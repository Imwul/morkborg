import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  REGION_TABLE_KEYS,
  regionTableId,
  rollRegionalReference,
} from '../src/domain/references.ts';
import { PLAY_REFERENCE_RULES } from '../src/domain/playReferenceRules.ts';
import type { OraclePack, OracleRegistry } from '../src/domain/oracle.ts';
import type { RegionId } from '../src/domain/types.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';

// Local private fixture only. Never print source text or the bundle's connection key.
const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const hasFixture = existsSync(fixturePath);
const fixture = hasFixture
  ? (JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      library: RulesPack;
      oracles: OraclePack;
    })
  : null;
const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Audited route identities and encounter quantities, without creature prose/statblocks.
const targets = {
  scvm: ['core', 'Bent', 58, 58],
  goblin: ['core', 'Seth', 58, 58],
  zombie: ['core', 'Nodh', 61, 61],
  skeleton: ['core', 'Belze', 60, 60],
  wickhead: ['core', 'Aland', 62, 62],
  prowler: ['core', 'Prowler', 67, 67],
  pale: ['core', 'Pale one', 66, 66],
  earthbound: ['core', 'Earthbound', 64, 64],
  vulture: ['feretory', 'Flayed Vultures', 14, 12],
  antideer: ['feretory', 'Antideer', 14, 12],
  horse: ['feretory', 'Feral Horses', 14, 12],
  skelelk: ['feretory', 'Skelelk', 15, 13],
  squirrel: ['feretory', 'Mulch-Squirrels', 15, 13],
  owl: ['feretory', 'Carrion Owls', 15, 13],
  moth: ['feretory', 'Giant Skull Moth', 16, 14],
  gull: ['feretory', 'Blubber Gulls', 18, 16],
  grub: ['feretory', 'Grubstopper', 21, 19],
  graveling: ['feretory', 'Gravelings', 21, 19],
  rat: ['feretory', 'Phantom Rats', 21, 19],
  rotted: ['heretic', 'Rotted Skeleton', 23, 21],
  fogbound: ['heretic', 'Fogbound Skeleton', 25, 23],
  mongrel: ['core-full', 'Mongrel', 79, 'III'],
  gnoum: ['core-full', 'Dusk Gnoum', 79, 'III'],
  guard: ['core-full', 'Guards with Sharpened Teeth', 79, 'III'],
} as const;
type Route = readonly [keyof typeof targets, 1 | 'd2' | 'd4' | 'd6'];
const routes: Partial<Record<RegionId, readonly Route[]>> = {
  galgenbeck: [
    ['scvm', 'd2'],
    ['goblin', 'd4'],
    ['vulture', 'd4'],
    ['antideer', 'd2'],
    ['mongrel', 1],
    ['horse', 'd2'],
  ],
  sarkash: [
    ['skelelk', 'd2'],
    ['zombie', 'd2'],
    ['squirrel', 'd2'],
    ['owl', 'd2'],
    ['mongrel', 1],
    ['prowler', 1],
  ],
  'graven-tosk': [
    ['rotted', 'd2'],
    ['zombie', 'd2'],
    ['pale', 1],
    ['moth', 1],
    ['fogbound', 'd2'],
    ['skeleton', 'd2'],
  ],
  kergus: [
    ['goblin', 'd4'],
    ['mongrel', 1],
    ['fogbound', 'd2'],
    ['gnoum', 'd2'],
    ['gull', 'd4'],
    ['earthbound', 1],
  ],
  wastland: [
    ['scvm', 'd2'],
    ['scvm', 'd4'],
    ['wickhead', 1],
    ['guard', 'd2'],
    ['mongrel', 1],
    ['goblin', 'd4'],
  ],
  'valley-undead': [
    ['grub', 'd6'],
    ['graveling', 'd2'],
    ['prowler', 1],
    ['rat', 'd4'],
    ['fogbound', 'd2'],
    ['rotted', 'd2'],
  ],
};
const conflicting = new Set(['kergus:3', 'valley-undead:5', 'valley-undead:6']);

test(
  'Private source audit: all 36 regional outcomes preserve exact records, quantities, and source roles at both RNG boundaries',
  { skip: !hasFixture },
  () => {
    const rules = fixture!.library;
    const registry = buildOracleRegistry(rules, fixture!.oracles);
    const before = digest({ rules, registry });
    assert.deepEqual(
      Object.keys(routes).sort(),
      Object.keys(REGION_TABLE_KEYS).sort(),
    );
    let audited = 0;
    for (const [region, expectedRoutes] of Object.entries(routes) as [
      RegionId,
      readonly Route[],
    ][]) {
      assert.equal(expectedRoutes.length, 6);
      for (const [index, [targetKey, quantity]] of expectedRoutes.entries()) {
        const label = `${region}:${index + 1}`;
        const [book, name, pdfPage, printedPage] = targets[targetKey];
        const candidates = rules.creatures.filter(
          (c) =>
            c.book === book &&
            c.name === name &&
            c.pdfPage === pdfPage &&
            c.printedPage === printedPage,
        );
        assert.equal(
          candidates.length,
          1,
          `${label}: one exact audited target`,
        );
        const table = registry.tables.find(
          (t) => t.id === regionTableId(region, 'monsters'),
        )!;
        const entry = table.entries.find(
          (e) => e.min <= index + 1 && e.max >= index + 1,
        )!;
        assert.ok(entry, `${label}: source row exists`);
        for (const boundary of [0, 1 - Number.EPSILON]) {
          let calls = 0;
          const result = rollRegionalReference(region, registry, rules, () =>
            calls++ === 0 ? (index + 0.5) / 6 : boundary,
          );
          const expectedQuantity =
            quantity === 1 ? 1 : boundary === 0 ? 1 : Number(quantity.slice(1));
          assert.equal(result.reading.roll, index + 1, `${label}: d6 face`);
          assert.ok(
            result.reading.text === entry.text,
            `${label}: original row text preserved`,
          );
          assert.ok(
            digest(result.reading.metadata) === digest(entry.metadata),
            `${label}: original routing metadata preserved`,
          );
          assert.ok(
            result.preset === candidates[0],
            `${label}: complete original statblock object preserved`,
          );
          assert.equal(result.unresolved, false, `${label}: resolves`);
          assert.equal(
            result.quantity,
            expectedQuantity,
            `${label}: Depths quantity`,
          );
          assert.equal(
            calls,
            quantity === 1 ? 1 : 2,
            `${label}: no EPK or appendix quantity roll`,
          );
          assert.deepEqual(
            result.quantityRoll,
            quantity === 1
              ? undefined
              : { dice: quantity, roll: expectedQuantity },
            `${label}: quantity provenance`,
          );
          assert.equal(
            result.sourceChain[0].role,
            'routing',
            `${label}: routing role`,
          );
          assert.equal(
            result.sourceChain[0].confidence,
            conflicting.has(label) ? 'conflicting-citation' : 'verified',
            `${label}: citation confidence`,
          );
          assert.ok(
            result.sourceChain[0].via === entry.metadata?.printedCrossReference,
            `${label}: literal citation retained`,
          );
          assert.equal(
            result.sourceChain[1].role,
            'primary',
            `${label}: target role`,
          );
          assert.equal(
            result.sourceChain[1].confidence,
            'verified',
            `${label}: target confidence`,
          );
          assert.equal(
            result.sourceChain[1].source.bookId,
            book,
            `${label}: actual target book`,
          );
          assert.equal(
            result.sourceChain[1].source.pdfPage,
            pdfPage,
            `${label}: PDF page`,
          );
          assert.equal(
            result.sourceChain[1].source.printedPage,
            printedPage,
            `${label}: printed page including Roman appendix`,
          );
        }
        audited++;
      }
    }
    assert.equal(audited, 36);
    assert.equal(
      digest({ rules, registry }),
      before,
      'Private source records were not mutated',
    );
    assert.equal(
      regionTableId('grift', 'monsters'),
      null,
      'No invented Grift substitute',
    );
  },
);

test(
  'Private source audit: every quick rule retains source pages and links only existing canonical oracles',
  { skip: !hasFixture },
  () => {
    const registry = buildOracleRegistry(fixture!.library, fixture!.oracles);
    const references = buildReferenceRegistry(registry, fixture!.library);
    assert.equal(
      new Set(PLAY_REFERENCE_RULES.map((seed) => seed.id)).size,
      PLAY_REFERENCE_RULES.length,
    );
    for (const seed of PLAY_REFERENCE_RULES) {
      const entry = references.byId[`rule:${seed.id}`];
      assert.ok(entry?.available, `${seed.id}: indexed and available`);
      assert.equal(entry.sourceRefs[0].bookId, seed.book);
      assert.deepEqual(entry.sourceRefs[0].pdfPage, seed.pages);
      assert.equal(entry.sourceRefs[0].printedPage, seed.printedPage);
      if (seed.seeFullRule)
        assert.ok(entry.sourceRefs[0].note, `${seed.id}: nuance pointer`);
      for (const id of seed.oracles ?? [])
        assert.ok(
          registry.tables.some((t) => t.id === id),
          `${seed.id}: canonical oracle exists`,
        );
    }
  },
);

function syntheticRegional() {
  const citation = 'Feretory p. 13/EPK p.5';
  const tableId = 'depths.region.sarkash.monsters';
  const target = {
    name: 'Example Creature',
    book: 'feretory',
    section: 'Eat Prey Kill',
    hp: 1,
    pdfPage: 15,
    printedPage: 13,
  };
  const registry: OracleRegistry = {
    books: [],
    procedures: [],
    tables: [
      {
        id: tableId,
        title: 'Synthetic region',
        sourceBookId: 'depths',
        sourcePage: 27,
        dice: 'd6',
        category: 'MONSTER',
        sourceVerified: true,
        tags: [],
        entries: [
          {
            id: 'synthetic:1',
            min: 1,
            max: 6,
            text: 'Synthetic source entry',
            metadata: {
              name: target.name,
              fixedQuantity: 1,
              printedCrossReference: citation,
            },
          },
        ],
      },
    ],
  };
  const rules: RulesPack = {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [target],
    outcasts: [],
    notes: {},
  };
  return { registry, rules, target, citation, tableId };
}

test('Similar spelling, punctuation, and plurals never authorize a regional creature without an exact alias', () => {
  for (const name of [
    'Example Creatures',
    'Example-Creature',
    'ExampleCreature',
    'Éxample Creature',
  ]) {
    const { registry, rules } = syntheticRegional();
    registry.tables[0].entries[0].metadata!.name = name;
    assert.equal(
      rollRegionalReference('sarkash', registry, rules, () => 0).preset,
      null,
    );
  }
  const { registry, rules, target } = syntheticRegional();
  registry.tables[0].entries[0].metadata!.name = 'example creature';
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).preset,
    target,
    'Case alone does not change source identity',
  );
});

test('Exact aliases resolve once, reject ambiguous targets, and reject stale target-page evidence', () => {
  const { registry, rules, target, citation, tableId } = syntheticRegional();
  registry.tables[0].entries[0].metadata!.name = 'Example Creatures';
  const aliased = {
    ...target,
    referenceAliases: [
      {
        name: 'Example Creatures',
        tableId,
        bookId: 'feretory',
        printedPage: 13,
        printedCrossReference: citation,
        sourceVerified: true,
        note: 'Synthetic audited plural alias.',
        evidence: [
          {
            bookId: 'feretory',
            pdfPage: 15,
            printedPage: 13,
            note: 'Exact synthetic target.',
          },
        ],
      },
    ],
  };
  rules.creatures = [aliased];
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).preset,
    aliased,
  );
  rules.creatures.push({ ...aliased, id: 'ambiguous-copy' });
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).preset,
    null,
  );
  rules.creatures = [{ ...aliased, printedPage: 99 }];
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).preset,
    null,
  );
  rules.creatures = [aliased];
  registry.tables[0].entries[0].metadata!.printedCrossReference = `${citation} changed`;
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).preset,
    null,
  );
});
