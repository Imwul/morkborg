import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { coreValuationTables } from '../src/data/oracles/coreValuations.ts';
import { parseRulesPack, setRules } from '../src/storage/rulesStore.ts';
import { parseOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  findReferenceCreature,
  creatureReferenceId,
} from '../src/domain/references.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../src/domain/referenceDefinitions.ts';
import {
  generatedReference,
  referenceTextSegments,
} from '../src/domain/generatedReferenceLinks.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { wildWickheadBlocks } from '../src/domain/wildWickheadReference.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { creatureRecordStatus } from '../src/generators/creatureProvenance.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import { tableEntryNotes } from '../src/domain/referenceTable.ts';

const pack = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(pack.library);
setOraclePack(pack.oracles);
const rules = parseRulesPack(pack.library),
  extra = parseOraclePack(pack.oracles);
const registry = buildOracleRegistry(rules, extra),
  index = buildReferenceRegistry(registry, rules);
const defs = buildReferenceDefinitions(registry, rules);
const top = (q: string) => searchReferences(index, q)[0];
const run = (id: string, rng = () => 0) =>
  executeReference(index.byId[id], {
    registry,
    rules,
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: true,
    rng,
  });

test('Outcast hiring/loyalty aliases reach free hire, periodic 2d6, highest Presence added and successful stay', () => {
  for (const q of ['Outcast', 'loyalty', 'hire', 'hireling', '고용', '충성'])
    assert.equal(top(q).id, 'rule:core.outcasts', q);
  const r = index.byId['rule:core.outcasts'];
  assert.match(r.summary, /no silver/);
  assert.match(r.summary, /2d6/);
  assert.match(r.summary, /adds the group’s highest Presence to the roll/);
  assert.match(r.summary, /from time to time/);
  assert.match(r.summary, /Success means the outcast stays/);
  assert.match(r.summaryTranslationKo!, /소중히/);
  assert.deepEqual(r.sourceRefs[0].pdfPage, [63]);
  assert.ok(r.sourceRefs.some((s) => s.bookId === 'core' && s.pdfPage === 32));
});
test('Wild Wickhead is its own verified follower, distinct from Aland', () => {
  const r = top('Wild Wickhead');
  assert.equal(r.id, 'creature:core:65:wild-wickhead');
  const record = findReferenceCreature(rules, r.id)!;
  assert.equal(creatureRecordStatus(record), 'VERIFIED');
  assert.equal(record.hp, 10);
  assert.equal(record.morale, 7);
  assert.equal(r.sourceRefs[0].printedPage, 65);
  assert.equal(r.sourceRefs[0].status, 'VERIFIED');
  const reading = run(r.id)!;
  const text = reading.blocks.map((b) => b.text).join('\n');
  for (const term of [
    'Knife d4',
    'Walking lightsource',
    'd4+2',
    'DR8',
    'weapon damage +3',
    'five items',
  ])
    assert.ok(text.includes(term), term);
  assert.match(reading.blocks[0].translation!.ko!, /광원/);
  assert.equal(
    reading.blocks[0].text.split('\n').length,
    reading.blocks[0].translation!.ko!.split('\n').length,
  );
  assert.equal(reading.valuationReferenceId, undefined);
  assert.notEqual(top('Aland').id, r.id);
});
test('Changed Wild Wickhead stats lose source verification and cannot be opened as verified', () => {
  const changed = structuredClone(rules);
  changed.outcasts.find((r) => r.name === 'Wild Wickhead')!.hp = 999;
  const next = buildReferenceRegistry(
    buildOracleRegistry(changed, extra),
    changed,
  );
  assert.equal(next.byId['creature:core:65:wild-wickhead'].available, false);
  assert.equal(
    next.byId['creature:core:65:wild-wickhead'].sourceRefs[0].status,
    'PARTIAL',
  );
});
test('The four Core Outcast names link directly, with loyalty related and no name-based cross-source merging', () => {
  for (const name of ['Earthbound', 'Wild Wickhead', 'Pale one', 'Prowler']) {
    const r = generatedReference(index.entries, name)!;
    assert.ok(r, name);
    assert.equal(r.kind, 'creature');
    assert.equal(r.sourceRefs[0].bookId, 'core');
    assert.ok(
      relatedReferences(index, r.id).some((e) => e.id === 'rule:core.outcasts'),
    );
    assert.ok(
      referenceTextSegments(index.entries, `A ${name} accompanies you.`).some(
        (s) => s.id === r.id,
      ),
    );
  }
  assert.equal(
    wildWickheadBlocks({ book: 'heretic', name: 'Wild Wickhead', pdfPage: 65 }),
    undefined,
  );
});
test('Five animals expose exact Core names and purchase prices, without fabricated stats or quantities', () => {
  const cases = [
    ['Dog (trained)', '25s'],
    ['Dog (wild)', '10s'],
    ['Horse', '80s'],
    ['Mule', '10s'],
    ['Rat (tame)', '8s'],
  ];
  const purchases = defs.filter((d) => d.kind === 'Purchase');
  assert.equal(purchases.length, 5);
  for (const [name, price] of cases) {
    const d = purchases.find((d) => d.title === name)!;
    assert.equal(top(name).id, d.id);
    assert.equal(d.blocks[0].text, price);
    assert.equal(d.sourceRefs[0].pdfPage, 26);
    assert.equal(d.sourceRefs[0].printedPage, 26);
    assert.match(d.blocks[0].translation!.ko!, /은화/);
    assert.doesNotMatch(
      JSON.stringify(d.blocks),
      /HP|Morale|Armor|Attack|speed|capacity|d6/i,
    );
    assert.equal(generatedReference(index.entries, name)!.id, d.id);
  }
  assert.equal(top('trained dog').title, 'Dog (trained)');
  assert.equal(top('wild dog').title, 'Dog (wild)');
  assert.equal(top('tame rats').title, 'Rat (tame)');
});
test('Core services links to the canonical Beasts table, and its price-only rows link to definitions', () => {
  assert.ok(
    relatedReferences(index, 'rule:core.services').some(
      (e) => e.id === 'oracle:core.beasts',
    ),
  );
  const table = registry.tables.find((t) => t.id === 'core.beasts')!;
  assert.equal(table.rollable, false);
  for (const row of table.entries)
    assert.equal(
      generatedReference(index.entries, row.text)!.definition!.tableEntry!
        .entryId,
      row.id,
    );
});
test('Ten Treasure definitions project full existing effects and exact source identities without duplicate pools', () => {
  const treasures = defs.filter((d) => d.kind === 'Treasure');
  assert.equal(treasures.length, 10);
  const table = registry.tables.find((t) => t.id === 'core.treasures')!;
  for (const row of table.entries) {
    const d = treasures.find((d) => d.tableEntry!.entryId === row.id)!;
    assert.equal(d.blocks[0].text, row.text);
    assert.equal(d.blocks[0].translation!.ko, row.metadata!.ko);
    assert.equal(top(d.title).id, d.id, d.title);
    assert.equal(d.sourceRefs[0].tableId, table.id);
    assert.equal(d.sourceRefs[0].status, 'VERIFIED');
    assert.equal(d.sourceRefs[0].pdfPage, 3);
    assert.equal(d.sourceRefs[0].printedPage, 3);
    assert.equal(generatedReference(index.entries, row.text)!.id, d.id);
    assert.deepEqual(d.canonicalIds, ['core.treasures']);
  }
});
test('Treasure numeric mechanics and limitations remain complete, including golem stats and curses', () => {
  const text = (n: number) =>
    defs.find((d) => d.id === `definition:core.treasures:${n}-${n}`)!.blocks[0]
      .text;
  for (const phrase of ['HP 5', 'Bite d4', 'immune to Powers'])
    assert.ok(text(2).includes(phrase));
  for (const phrase of [
    'd3',
    '6 hp',
    'dr 14',
    'dr 12 daily',
    'next sunrise',
    'die',
  ])
    assert.ok(text(5).includes(phrase));
  assert.match(text(7), /negative hp.*won’t die.*drop the torch/s);
  for (const phrase of [
    '100 yards',
    '+10',
    '−10',
    'above 20',
    'below 1',
    'full moon',
  ])
    assert.ok(text(9).includes(phrase));
});
test('Every Treasure roll carries a one-click definition target while preserving full text for copy', () => {
  for (let n = 1; n <= 10; n++) {
    const reading = run('oracle:core.treasures', () => (n - 0.5) / 10)!;
    const block = reading.blocks[0];
    assert.equal(
      block.definitionReferenceId,
      `definition:core.treasures:${n}-${n}`,
    );
    assert.equal(
      block.text,
      index.byId[block.definitionReferenceId!].definition!.blocks[0].text,
    );
    assert.ok(copyReferenceReading(reading).includes(block.text));
  }
});
test('Occult Torch lookup never redirects a mundane Torch or rewrites its canonical name', () => {
  const mundane = generatedReference(index.entries, 'Torch')!;
  assert.equal(mundane.definition!.kind, 'Equipment');
  const occult = top('occult torch');
  assert.equal(occult.definition!.kind, 'Treasure');
  assert.equal(occult.title, 'Torch · Occult treasures');
  assert.equal(
    registry.tables.find((t) => t.id === 'core.treasures')!.entries[6].metadata!
      .canonicalName,
    'Torch',
  );
});
test('Twelve creature valuations reuse one read-only projection and exact creature identities', () => {
  const values = defs.filter((d) => d.kind === 'Valuation');
  assert.equal(values.length, 12);
  const tables = coreValuationTables(rules);
  assert.equal(tables.length, 1);
  assert.equal(tables[0].rollable, false);
  for (const d of values) {
    const record = rules.creatures.find(
      (r) =>
        r.book === 'core' &&
        r.name === d.creatureIdentity!.name &&
        r.pdfPage === d.creatureIdentity!.pdfPage,
    )!;
    const monster = index.byId[creatureReferenceId(record)];
    assert.equal(monster.valuationReferenceId, d.id);
    assert.equal(run(monster.id)!.valuationReferenceId, d.id);
    assert.ok(
      d.relatedIds.includes(monster.id) ||
        index.byId[d.id].relatedIds.includes(monster.id),
    );
    assert.deepEqual(d.canonicalIds, ['core.creatureValuations']);
    assert.equal(d.sourceRefs[0].pdfPage, record.pdfPage);
    assert.equal(d.sourceRefs[0].status, 'VERIFIED');
    assert.ok(d.blocks[0].translation!.ko);
    assert.equal(index.byId[d.id].authority![0].kind, 'APP_POLICY');
  }
});
test('Valuations preserve conditional bounties, per-litre units and intact/pieces distinctions', () => {
  const effect = (name: string) =>
    defs.find(
      (d) => d.kind === 'Valuation' && d.creatureIdentity!.name === name,
    )!.blocks[0];
  assert.equal(effect('Seth').text, 'Head: 7s\nCaptured: 150s\nDead: 20s');
  assert.match(effect('Bent').text, /50–120s \(wanted, serious crime\)/);
  assert.match(effect('Bent').translation!.ko!, /중범죄 수배/);
  assert.match(effect('Zukuma').text, /Blood, per litre: 3s/);
  assert.match(effect('Nodh').text, /Blood, per litre: 5s/);
  assert.match(
    effect('Thinx').text,
    /Dead \(intact\): 100s\nDead \(in pieces\): 10s/,
  );
  assert.match(effect('Eulotha').text, /Poison gland: 60s\nTail spike: 60s/);
  const table = registry.tables.find(
    (t) => t.id === 'core.creatureValuations',
  )!;
  assert.ok(tableEntryNotes(table.entries[0]).join('\n').includes('150s'));
});
test('Changed valuation data fails independent source attestation; unknown values never acquire fallback prose', () => {
  const changed = structuredClone(rules);
  (
    changed.creatures.find((r) => r.name === 'Seth')!.valuation as Record<
      string,
      unknown
    >
  ).headSilver = 999;
  const r = buildOracleRegistry(changed, extra);
  assert.ok(
    unresolvedOracleSources(r).some((s) =>
      s.startsWith('core.creatureValuations:'),
    ),
  );
  assert.equal(
    buildReferenceDefinitions(r, changed).filter((d) => d.kind === 'Valuation')
      .length,
    0,
  );
  (
    changed.creatures.find((r) => r.name === 'Seth')!.valuation as Record<
      string,
      unknown
    >
  ).unknownSilver = 12;
  assert.throws(
    () => coreValuationTables(changed),
    /Unverified Core valuation field/,
  );
});
test('Source definitions remain resolvable, verified and unavailable private data creates no substitute lookups', () => {
  assert.deepEqual(unresolvedOracleSources(registry), []);
  assert.deepEqual(unresolvedReferenceDefinitions(defs, registry), []);
  const target = defs.filter((d) =>
    ['Treasure', 'Purchase', 'Valuation'].includes(d.kind),
  );
  assert.equal(target.length, 27);
  for (const d of target)
    for (const s of d.sourceRefs) assert.equal(s.status, 'VERIFIED');
  assert.equal(
    buildReferenceDefinitions(buildOracleRegistry(null, null), null).filter(
      (d) => ['Treasure', 'Purchase', 'Valuation'].includes(d.kind),
    ).length,
    0,
  );
});

test('Previously cached packs gain only matching Treasure identities and missing Wild Wickhead helper', async () => {
  const { mergePrivateLibraryUpdate } =
    await import('../src/storage/privateUpdates.ts');
  const current = structuredClone(rules);
  for (const row of current.tables['core.treasures'].entries) {
    delete row.meta.referenceName;
    delete row.meta.canonicalName;
    delete row.meta.searchAliases;
  }
  delete current.outcasts.find((r) => r.name === 'Wild Wickhead')!
    .referenceTranslationKo;
  const textBefore = current.tables['core.treasures'].entries.map((e) => [
    e.text,
    e.weight,
    e.meta.roll,
  ]);
  const merged = mergePrivateLibraryUpdate(current, rules);
  assert.deepEqual(
    merged.tables['core.treasures'].entries.map((e) => [
      e.text,
      e.weight,
      e.meta.roll,
    ]),
    textBefore,
  );
  assert.equal(
    merged.tables['core.treasures'].entries[4].meta.referenceName,
    'Vampiric Phurba',
  );
  assert.ok(
    merged.outcasts.find((r) => r.name === 'Wild Wickhead')!
      .referenceTranslationKo,
  );
  assert.deepEqual(
    unresolvedOracleSources(buildOracleRegistry(merged, extra)),
    [],
  );
  assert.equal(
    buildReferenceDefinitions(
      buildOracleRegistry(merged, extra),
      merged,
    ).filter((d) => d.kind === 'Treasure').length,
    10,
  );
  current.tables['core.treasures'].entries[4].text = 'User-written treasure';
  current.outcasts.find((r) => r.name === 'Wild Wickhead')!.sourceNotes =
    'User-written carrying note';
  const edited = mergePrivateLibraryUpdate(current, rules);
  assert.equal(
    edited.tables['core.treasures'].entries[4].text,
    'User-written treasure',
  );
  assert.equal(
    edited.tables['core.treasures'].entries[4].meta.referenceName,
    undefined,
  );
  assert.equal(
    edited.outcasts.find((r) => r.name === 'Wild Wickhead')!
      .referenceTranslationKo,
    undefined,
  );
  current.outcasts.find(
    (r) => r.name === 'Wild Wickhead',
  )!.referenceTranslationKo = { sourceNotes: '사용자 번역' };
  assert.deepEqual(
    mergePrivateLibraryUpdate(current, rules).outcasts.find(
      (r) => r.name === 'Wild Wickhead',
    )!.referenceTranslationKo,
    { sourceNotes: '사용자 번역' },
  );
});
