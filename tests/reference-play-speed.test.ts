import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  buildReferenceRegistry,
  contextReferences,
  searchReferences,
} from '../src/domain/references.ts';
import { referenceAction } from '../src/domain/referenceActions.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { rollCityMove } from '../src/domain/cityProcedures.ts';
import { cityCrawlMoveReading } from '../src/domain/cityCrawlWorkspace.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
const path = 'outputs/morkborg-private-data.json';
const raw = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const rules = raw ? parseRulesPack(raw.library) : null;
const registry = buildOracleRegistry(
  rules,
  raw ? parseOraclePack(raw.oracles) : null,
);
const references = buildReferenceRegistry(registry, rules);
const local = (name: string, run: () => void) =>
  test(name, { skip: !raw }, run);

local(
  'Every requested play query retains its actionable first result and honest primary label',
  () => {
    const expected = [
      ['reaction', 'oracle:core.reaction', 'ROLL', true],
      ['morale', 'rule:core.reaction-morale', 'OPEN', false],
      ['broken', 'rule:core.broken', 'OPEN', false],
      ['corpse', 'oracle:core.corpsePlundering', 'ROLL', true],
      ['treasure', 'oracle:core.treasures', 'ROLL', true],
      ['useful item', 'oracle:sd.usefulItems', 'ROLL', true],
      ['Sarkash monster', 'rule:regional-monsters:sarkash', 'GENERATE', true],
      ['Kergüs monster', 'rule:regional-monsters:kergus', 'GENERATE', true],
      ['room', 'oracle:sd.room.contents', 'ROLL', true],
      ['NPC', 'procedure:workbench.npc', 'GENERATE', true],
      ['Omens', 'rule:core.omens', 'OPEN', false],
      ['Miseries', 'oracle:core.miseries', 'ROLL', true],
      ['powers', 'rule:core.casting', 'OPEN', false],
      ['casting', 'rule:core.casting', 'OPEN', false],
    ] as const;
    for (const [query, id, label, immediate] of expected) {
      const first = searchReferences(references, query)[0];
      assert.equal(first.id, id, query);
      assert.equal(first.available, true, query);
      assert.deepEqual(referenceAction(first), { label, immediate }, query);
    }
  },
);

local(
  'Current Monster has four live-play tools, while Room exposes useful tools without an oversized shelf',
  () => {
    const monsterIds = [
      'oracle:core.reaction',
      'rule:core.reaction-morale',
      'oracle:core.corpsePlundering',
      'oracle:core.treasures',
    ];
    for (const region of [undefined, 'sarkash', 'kergus'] as const)
      assert.deepEqual(
        contextReferences(references, 'monster', region, 20).map(
          (entry) => entry.id,
        ),
        monsterIds,
      );
    const rooms = contextReferences(references, 'room');
    assert.equal(rooms.length, 6);
    assert.deepEqual(
      rooms.slice(3).map((entry) => entry.id),
      [
        'oracle:core.reaction',
        'oracle:core.treasures',
        'oracle:sd.usefulItems',
      ],
    );
    assert.equal(
      contextReferences(references, 'room', undefined, 20).length,
      8,
    );
    assert.ok(rooms.every((entry) => entry.available && entry.action));
  },
);

local(
  'A source creature opens its existing stat block immediately without rolling new dice',
  () => {
    const entry = searchReferences(references, 'Meatroach', {
      kind: 'creature',
    })[0];
    assert.deepEqual(referenceAction(entry), {
      label: 'OPEN',
      immediate: true,
    });
    const result = executeReference(entry, {
      registry,
      rules,
      region: 'sarkash',
      stockKind: 'room',
      stockDR: 10,
      cityLarge: false,
      cityExits: false,
      rng: () => {
        throw new Error('Creature retrieval must not roll');
      },
    });
    assert.ok(result?.blocks.some((block) => block.kind === 'creature'));
    assert.match(copyReferenceReading(result!), /Meatroach/);
    assert.equal(
      referenceAction(references.byId['procedure:workbench.stock-room']).label,
      'OPEN',
    );
    assert.equal(
      referenceAction(references.byId['procedure:workbench.stock-room'])
        .immediate,
      false,
    );
  },
);

local(
  'Copy of an unavailable City branch retains its source result and warning without internal target IDs',
  () => {
    const dice = [0, 0.999, 0.999];
    const move = rollCityMove({ move: 'stash', dr: 10, modifier: 0 }, () =>
      dice.shift()!,
    );
    const partial = buildOracleRegistry(null, parseOraclePack(raw.oracles));
    const reading = cityCrawlMoveReading(move, partial);
    assert.match(reading.blocks[1].text, /sd\.npc\.disposition/);
    for (const withSource of [false, true]) {
      const copied = copyReferenceReading(reading, withSource);
      assert.match(copied, /SOURCE DATA UNAVAILABLE/);
      assert.doesNotMatch(copied, /sd\.npc\.(disposition|profession)/);
      const original = partial.tables
        .find((table) => table.id === 'aitc.stash-weak')!
        .entries.find((entry) => entry.id === 'aitc.stash-weak:5-6')!.text;
      assert.ok(copied.includes(original));
    }
  },
);

test('Copy with source uses concise book/pages and never exports provenance or audit internals', () => {
  const reading: ReferenceReading = {
    title: 'Action / Theme',
    blocks: [
      { title: '', text: 'Test Action / Test Theme', dice: 'debug die trace' },
    ],
    sourceRefs: [
      {
        bookId: 'feretory',
        bookTitle: 'MÖRK BORG CULT: FERETORY',
        tableId: 'internal.table-id',
        entryId: 'internal.entry-id',
        tableTitle: 'internal.procedure-id',
        note: 'datasetVersion secret-audit-version; debug metadata',
        pdfPage: 15,
        printedPage: 13,
      },
    ],
    relatedIds: ['oracle:internal.related-id'],
  };
  reading.sourceRefs.push({
    ...reading.sourceRefs[0],
    tableId: 'internal.other-table',
    note: 'different audit data',
  });
  assert.equal(
    copyReferenceReading(reading),
    'Action / Theme\n\nTest Action / Test Theme',
  );
  assert.equal(
    copyReferenceReading(reading, true),
    'Action / Theme\n\nTest Action / Test Theme\n\nFER · PDF 15 · 인쇄 p. 13',
  );
  for (const withSource of [false, true])
    assert.doesNotMatch(
      copyReferenceReading(reading, withSource),
      /internal\.|datasetVersion|secret-audit|debug|MÖRK BORG CULT/,
    );
});

test('Clipboard preserves useful custom copy content, never falls back to unknown internal book IDs, and adds no empty suffix', () => {
  const reading: ReferenceReading = {
    title: 'Navigation title',
    blocks: [{ title: 'Routing procedure', text: 'Inspector route details' }],
    copyContent: {
      title: 'Known creature × 2',
      blocks: [{ title: '', text: 'HP 4 · Bite d4' }],
    },
    sourceRefs: [{ bookId: 'internal.missing-book', pdfPage: 3 }],
  };
  assert.equal(
    copyReferenceReading(reading),
    'Known creature × 2\n\nHP 4 · Bite d4',
  );
  assert.equal(
    copyReferenceReading(reading, true),
    'Known creature × 2\n\nHP 4 · Bite d4\n\nSource · PDF 3',
  );
  assert.equal(
    copyReferenceReading({ ...reading, sourceRefs: [] }, true),
    copyReferenceReading(reading),
  );
});

local(
  'Regional display groups the canonical creature and derived quantity while preserving the original cited route',
  () => {
    const table = registry.tables.find(
      (item) => item.id === 'depths.region.sarkash.monsters',
    )!;
    const row = table.entries.find(
      (item) => item.metadata?.name === 'Carrion Owls',
    )!;
    assert.ok(row);
    const original = JSON.stringify(row);
    const rolls = [(row.min - 1) / 6, 0];
    const result = executeReference(
      references.byId['rule:regional-monsters:sarkash'],
      {
        registry,
        rules,
        region: 'sarkash',
        stockKind: 'room',
        stockDR: 10,
        cityLarge: false,
        cityExits: false,
        rng: () => {
          assert.ok(rolls.length, 'No substitute creature rolls');
          return rolls.shift()!;
        },
      },
    )!;
    assert.equal(rolls.length, 0);
    assert.equal(result.blocks.length, 1);
    assert.equal(result.blocks[0].title, 'Carrion Owls × 1');
    assert.match(result.blocks[0].text, /HP \d+/);
    assert.doesNotMatch(
      JSON.stringify(result.blocks.map(({ title, text }) => ({ title, text }))),
      /Feretory p\.|EPK p\./i,
    );
    assert.equal(result.oracle!.rolls[0].text, row.text);
    assert.match(result.oracle!.rolls[0].text, /Feretory/i);
    assert.ok(
      result.evidence!.some(
        (item) => item.role === 'primary' && item.source.bookId === 'feretory',
      ),
    );
    assert.ok(
      result.evidence!.some(
        (item) => item.role === 'routing' && item.source.bookId === 'depths',
      ),
    );
    assert.ok(
      result.authority!.some(
        (item) =>
          item.id === 'app.result-grouping' && item.kind === 'APP_POLICY',
      ),
    );
    assert.equal(JSON.stringify(row), original);
    assert.ok(copyReferenceReading(result).startsWith('Carrion Owls × 1'));
  },
);

local(
  'An unresolved regional result keeps the verified name and quantity without manufacturing a stat block',
  () => {
    const table = registry.tables.find(
      (item) => item.id === 'depths.region.sarkash.monsters',
    )!;
    const row = table.entries.find(
      (item) => item.metadata?.name === 'Carrion Owls',
    )!;
    const rolls = [(row.min - 1) / 6, 0];
    const result = executeReference(
      references.byId['rule:regional-monsters:sarkash'],
      {
        registry,
        rules: { ...rules!, creatures: [] },
        region: 'sarkash',
        stockKind: 'room',
        stockDR: 10,
        cityLarge: false,
        cityExits: false,
        rng: () => {
          assert.ok(rolls.length, 'No missing-source substitute roll');
          return rolls.shift()!;
        },
      },
    )!;
    assert.equal(result.blocks.length, 1);
    assert.equal(result.blocks[0].title, 'Carrion Owls × 1');
    assert.equal(result.blocks[0].text, 'SOURCE UNAVAILABLE');
    assert.equal(result.oracle!.rolls[0].text, row.text);
    assert.ok(
      result.evidence!.some((item) => item.confidence === 'unavailable-source'),
    );
    assert.doesNotMatch(
      copyReferenceReading(result),
      /HP|Morale|Armor|Feretory p\.|EPK p\./i,
    );
  },
);
