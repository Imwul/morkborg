import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReferenceRegistry,
  searchReferences,
  contextReferences,
  relatedReferences,
  rollRegionalReference,
  creatureReferenceId,
  findReferenceCreature,
  REGION_TABLE_KEYS,
  type ReferenceContext,
} from '../src/domain/references.ts';
import { regions } from '../src/data/regions.ts';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';
const table = (
  id: string,
  title = id,
  category: OracleDefinition['category'] = 'OTHER',
  book = id.split('.')[0],
): OracleDefinition => ({
  id,
  title,
  category,
  sourceBookId: book,
  sourcePage: 1,
  dice: 'd6',
  tags: [],
  sourceVerified: true,
  entries: Array.from({ length: 6 }, (_, i) => ({
    id: `${id}:${i + 1}`,
    min: i + 1,
    max: i + 1,
    text: `Result ${i + 1}`,
  })),
});
function fixture() {
  const tables: OracleDefinition[] = [];
  const ids = [
    'core.names',
    'core.sparks',
    'core.treasures',
    'core.reaction',
    'core.failedMorale',
    'core.broken',
    'core.brokenInjury',
    'core.weather',
    'core.corpsePlundering',
    'feretory.A',
    'feretory.B',
    'feretory.C',
    'feretory.desire',
    'feretory.trait',
    'feretory.roadType',
    'feretory.roadEvent',
    'feretory.forage',
    'feretory.campsite',
    'feretory.leaveRoad',
    'feretory.huntingMishaps',
    'feretory.bellyOfBeast',
    'sd.room.adjective',
    'sd.room.type',
    'sd.room.contents',
    'sd.room.exits',
    'sd.material.quality',
    'sd.material.composition',
    'sd.sound.quality',
    'sd.sound.type',
    'sd.npc.disposition',
    'sd.npc.profession',
    'sd.stockCreatures',
    'depths.traps.regular',
    'depths.enemyCombatModifiers',
    'depths.danger',
    'reclvse.npcPersonality',
    'reclvse.npcAppearance',
    'reclvse.npcMotivation',
    'reclvse.roomEncounter',
    'reclvse.dungeonEntrance',
    'reclvse.action',
    'reclvse.theme',
  ];
  for (const id of ids)
    tables.push(
      table(
        id,
        id,
        id.includes('room')
          ? 'ROOM'
          : id.includes('npc')
            ? 'NPC'
            : id.startsWith('feretory.')
              ? 'MONSTER'
              : 'OTHER',
      ),
    );
  for (const region of regions) {
    const key = REGION_TABLE_KEYS[region.id];
    if (!key) continue;
    for (const suffix of [
      'monsters',
      'feature',
      'discovery',
      'trait',
      'npc_professions',
    ])
      tables.push(
        table(
          `depths.region.${key}.${suffix}`,
          `${region.name} — ${suffix}`,
          suffix === 'monsters' ? 'MONSTER' : 'LOCATION',
          'depths',
        ),
      );
  }
  const registry: OracleRegistry = {
    books: ['core', 'sd', 'depths', 'feretory', 'reclvse', 'heretic'].map(
      (id) => ({
        id,
        title: {
          core: 'MÖRK BORG BARE BONES EDITION',
          sd: 'Sölitary Defilement',
          depths: 'Sölitary Depths',
          feretory: 'MÖRK BORG CULT: FERETORY',
          reclvse: 'RECLVSE',
          heretic: 'HERETIC',
        }[id]!,
      }),
    ),
    tables,
    procedures: [
      {
        id: 'sd.room-description',
        title: 'Room Adjective + Type',
        oracleIds: ['sd.room.adjective', 'sd.room.type'],
      },
      {
        id: 'sd.material',
        title: 'Materials',
        oracleIds: ['sd.material.quality', 'sd.material.composition'],
      },
      {
        id: 'sd.sound',
        title: 'Sounds',
        oracleIds: ['sd.sound.quality', 'sd.sound.type'],
      },
      {
        id: 'reclvse.action-theme',
        title: 'Action + Theme',
        oracleIds: ['reclvse.action', 'reclvse.theme'],
      },
    ],
  };
  const rules: RulesPack = {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [
      {
        id: 'feretory.epk.skelelk',
        book: 'feretory',
        section: 'Eat Prey Kill',
        name: 'Skelelk',
        hp: 12,
        printedPage: 13,
        pdfPage: 15,
        presetEligible: true,
        referenceAliases: [
          {
            name: 'Skelelks',
            tableId: 'depths.region.sarkash.monsters',
            bookId: 'feretory',
            printedPage: 13,
            printedCrossReference: 'Feretory p. 13/EPK p.5',
            sourceVerified: true,
            note: 'Explicit fixture alias for the audited plural source heading.',
            evidence: [
              {
                bookId: 'feretory',
                pdfPage: 15,
                printedPage: 13,
                note: 'Fixture target identity.',
              },
            ],
          },
        ],
      },
      {
        id: 'different-epk',
        book: 'feretory',
        section: 'Eat Prey Kill',
        name: 'Different monster',
        hp: 99,
        printedPage: 13,
        pdfPage: 15,
      },
    ],
    outcasts: [],
    notes: {},
  };
  const sarkash = tables.find(
    (t) => t.id === 'depths.region.sarkash.monsters',
  )!;
  sarkash.sourcePage = 27;
  sarkash.printedPage = 24;
  sarkash.entries[0] = {
    ...sarkash.entries[0],
    text: 'd2 Skelelks (Feretory p. 13/EPK p.5)',
    metadata: {
      name: 'Skelelks',
      quantityDice: 'd2',
      fixedQuantity: null,
      printedCrossReference: 'Feretory p. 13/EPK p.5',
    },
  };
  sarkash.entries[1] = {
    ...sarkash.entries[1],
    text: 'd2 Zombies (MB p. 65)',
    metadata: {
      name: 'Zombies',
      quantityDice: 'd2',
      fixedQuantity: null,
      printedCrossReference: 'MB p. 65',
    },
  };
  return { registry, rules };
}
test('Reference graph is metadata-only and each canonical table appears once', () => {
  const { registry, rules } = fixture(),
    original = registry.tables[0];
  registry.tables.push({
    ...original,
    id: 'alias.name',
    canonicalTableId: original.id,
  });
  const before = JSON.stringify(registry),
    ref = buildReferenceRegistry(registry, rules);
  assert.equal(
    ref.entries.filter((e) => e.id === `oracle:${original.id}`).length,
    1,
  );
  assert.equal(new Set(ref.entries.map((e) => e.id)).size, ref.entries.length);
  assert.equal(JSON.stringify(registry), before);
  assert(!ref.entries.some((e) => 'entries' in e));
  assert(!JSON.stringify(ref).includes('Result 1'));
  assert.deepEqual(ref.byId['oracle:core.names'].canonicalIds, ['core.names']);
});
test('Multi-term search combines region, purpose, Korean aliases and accent-insensitive tokens', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  assert.equal(
    searchReferences(ref, 'Sarkash monster')[0].id,
    'rule:regional-monsters:sarkash',
  );
  assert.equal(
    searchReferences(ref, '사르카쉬 몬스터')[0].id,
    'rule:regional-monsters:sarkash',
  );
  assert(
    searchReferences(ref, 'Kergus monsters').some(
      (e) => e.id === 'oracle:depths.region.kergus.monsters',
    ),
  );
  assert.equal(searchReferences(ref, 'Sarkash nonexistentterm').length, 0);
  assert(
    searchReferences(ref, 'solitary depths').some((e) => e.kind === 'oracle'),
  );
});
test('All seven region hubs exist and Grift never pretends to have a Depths regional table', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  assert.equal(ref.entries.filter((e) => e.kind === 'region').length, 7);
  for (const region of regions) assert(ref.byId[`region:${region.id}`]);
  assert.equal(ref.byId['rule:regional-monsters:grift'].available, false);
  assert.equal(ref.byId['rule:regional-monsters:grift'].action, null);
  assert.throws(() => rollRegionalReference('grift', registry, rules));
});
test('Room, Monster, NPC and Dungeon context shelves contain four to eight relevant stable tools', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  for (const context of [
    'room',
    'monster',
    'npc',
    'dungeon',
  ] as ReferenceContext[]) {
    const shelf = contextReferences(ref, context, 'sarkash', 8);
    assert(shelf.length >= 4 && shelf.length <= 8);
    assert.equal(new Set(shelf.map((e) => e.id)).size, shelf.length);
    assert(shelf.every((e) => e.available));
  }
  assert.equal(
    contextReferences(ref, 'monster', 'sarkash')[0].action?.kind,
    'regional-monster',
  );
  assert.equal(
    contextReferences(ref, 'npc', 'sarkash')[0].id,
    'oracle:depths.region.sarkash.npc_professions',
  );
});
test('Related references contain no missing IDs, duplicate IDs, or recursive graph expansion', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  for (const entry of ref.entries) {
    assert(entry.relatedIds.every((id) => !!ref.byId[id]));
    assert.equal(new Set(entry.relatedIds).size, entry.relatedIds.length);
    const related = relatedReferences(ref, entry.id, 8);
    assert(related.length <= 8);
    assert(!related.some((e) => e.id === entry.id));
  }
});
test('Conditional/card references remain readable but are never exposed as invented dice actions', () => {
  const { registry, rules } = fixture();
  registry.tables.push({
    ...table('depths.rare.look', 'Card overall look', 'MONSTER'),
    dice: 'card rank',
    rollable: false,
  });
  registry.procedures.push({
    id: 'not-a-dice-pair',
    title: 'Card source',
    oracleIds: ['depths.rare.look'],
  });
  const ref = buildReferenceRegistry(registry, rules);
  assert.equal(ref.byId['oracle:depths.rare.look'].action, null);
  assert.equal(ref.byId['procedure:not-a-dice-pair'].available, false);
  assert.equal(ref.byId['procedure:not-a-dice-pair'].action, null);
});
test('Combined procedures retain repeated table IDs and their specified order', () => {
  const { registry, rules } = fixture();
  registry.procedures.push({
    id: 'repeat',
    title: 'Two independent results',
    oracleIds: ['core.names', 'core.names'],
  });
  const ref = buildReferenceRegistry(registry, rules);
  assert.deepEqual(ref.byId['procedure:repeat'].canonicalIds, [
    'core.names',
    'core.names',
  ]);
});
test('Workbench procedures expose explicit routing and keep EPK selection separate from Depths d6', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  for (const id of ['workbench.stock-room', 'workbench.npc', 'workbench.epk'])
    assert.deepEqual(ref.byId[`procedure:${id}`].action, {
      kind: 'procedure',
      procedureId: id,
    });
  assert.match(
    ref.byId['procedure:workbench.stock-room'].summary,
    /Common.*Rare.*Room/,
  );
  assert.match(
    ref.byId['procedure:workbench.epk'].summary,
    /공식 d6.*표시하지/,
  );
});
test('Regional d6 follows the rolled Depths entry to the matching EPK name/page and quantity', () => {
  const { registry, rules } = fixture(),
    before = JSON.stringify({ registry, rules });
  const values = [0, 0.99];
  const result = rollRegionalReference(
    'sarkash',
    registry,
    rules,
    () => values.shift() ?? 0,
  );
  assert.equal(result.reading.roll, 1);
  assert.equal(result.preset?.id, 'feretory.epk.skelelk');
  assert.equal(result.quantity, 2);
  assert.deepEqual(result.quantityRoll, { dice: 'd2', roll: 2 });
  assert.equal(result.unresolved, false);
  assert.equal(result.sourceChain[0].source.pdfPage, 27);
  assert.equal(result.sourceChain[1].source.pdfPage, 15);
  assert.equal(result.sourceChain[1].source.printedPage, 13);
  assert.match(result.reading.text, /d2 Skelelks/);
  assert.equal(JSON.stringify({ registry, rules }), before);
});
test('A non-EPK regional outcome stays unresolved instead of rolling another EPK creature', () => {
  const { registry, rules } = fixture();
  const result = rollRegionalReference('sarkash', registry, rules, () => 0.2);
  assert.equal(result.reading.roll, 2);
  assert.equal(result.preset, null);
  assert.equal(result.unresolved, true);
  assert.match(result.reading.text, /Zombies/);
  assert.equal(result.sourceChain[1].source.bookId, 'core');
  assert.equal(result.sourceChain[1].source.printedPage, 65);
});
test('Preset exclusions and mismatched printed pages prevent false monster resolution', () => {
  for (const change of [
    { presetEligible: false },
    { hp: undefined },
    { printedPage: 99 },
  ]) {
    const { registry, rules } = fixture();
    Object.assign(rules.creatures[0], change);
    assert.equal(
      rollRegionalReference('sarkash', registry, rules, () => 0).preset,
      null,
    );
  }
});
test('Conflicting printed cross-references remain explicit and are not silently corrected', () => {
  const { registry, rules } = fixture();
  const table = registry.tables.find(
    (t) => t.id === 'depths.region.kergus.monsters',
  )!;
  table.entries[0] = {
    ...table.entries[0],
    text: 'Fogbound Skeletons (Feretory p. 23/GLW p. 9)',
    metadata: {
      name: 'Fogbound Skeletons',
      fixedQuantity: 1,
      printedCrossReference: 'Feretory p. 23/GLW p. 9',
      referenceNote:
        'The printed Feretory/GLW reference conflicts with the other regional pages.',
    },
  };
  rules.creatures.push({
    name: 'Fogbound Skeleton',
    book: 'heretic',
    hp: 7,
    pdfPage: 25,
    context: 'Graves Left Wanting',
  });
  const result = rollRegionalReference('kergus', registry, rules, () => 0);
  assert.equal(result.preset, null);
  assert.equal(result.quantity, 1);
  assert.match(result.reason!, /conflicts/);
  assert.match(result.sourceChain[1].label, /Feretory/);
});
test('A matching HERETIC reference resolves via its documented printed/PDF page offset', () => {
  const { registry, rules } = fixture();
  const table = registry.tables.find(
    (t) => t.id === 'depths.region.graven_tosk.monsters',
  )!;
  table.entries[0] = {
    ...table.entries[0],
    text: 'Rotted skeleton (Heretic p. 21/ GLW p. 7)',
    metadata: {
      name: 'Rotted skeleton',
      fixedQuantity: 1,
      printedCrossReference: 'Heretic p. 21/ GLW p. 7',
    },
  };
  rules.creatures.push({
    name: 'Rotted Skeleton',
    book: 'heretic',
    hp: 5,
    pdfPage: 23,
    context: 'Graves Left Wanting',
  });
  const result = rollRegionalReference('graven-tosk', registry, rules, () => 0);
  assert.equal(result.preset?.name, 'Rotted Skeleton');
  assert.equal(result.sourceChain[1].source.pdfPage, 23);
});
test('Missing or unverified regional tables are not rolled and do not mutate supplied data', () => {
  const { registry, rules } = fixture();
  registry.tables.find(
    (t) => t.id === 'depths.region.sarkash.monsters',
  )!.sourceVerified = false;
  assert.throws(() => rollRegionalReference('sarkash', registry, rules));
  const empty = buildReferenceRegistry({
    books: [],
    tables: [],
    procedures: [],
  });
  assert.equal(empty.entries.filter((e) => e.kind === 'region').length, 7);
  assert.equal(contextReferences(empty, 'room').length, 0);
});

test('Alöne in the Crowd entries and combined procedures are discoverable through the city context', () => {
  const { registry, rules } = fixture();
  registry.books.push({ id: 'aitc', title: 'Alöne in the Crowd' });
  registry.tables.push(
    table('aitc.street.type', 'Street Type', 'OTHER', 'aitc'),
    table('aitc.street.contents', 'Street Contents', 'OTHER', 'aitc'),
  );
  registry.procedures.push({
    id: 'aitc.street',
    title: 'Street',
    oracleIds: ['aitc.street.type', 'aitc.street.contents'],
  });
  const ref = buildReferenceRegistry(registry, rules);
  assert.deepEqual(ref.byId['rule:city'].action, { kind: 'city' });
  assert.deepEqual(ref.byId['procedure:workbench.city'].action, {
    kind: 'city',
  });
  assert(ref.byId['oracle:aitc.street.type'].contexts.includes('city'));
  assert(ref.byId['procedure:aitc.street'].contexts.includes('city'));
  assert(
    contextReferences(ref, 'city').some(
      (e) => e.id === 'procedure:aitc.street',
    ),
  );
  assert(
    relatedReferences(ref, 'rule:city', 8).some(
      (e) => e.id === 'procedure:aitc.street',
    ),
  );
  assert(
    searchReferences(ref, 'city', { context: 'city' }).some(
      (e) => e.id === 'rule:city',
    ),
  );
});

test('Frequent rule references separate Core and SD variants and cite the regional stocking alternative', () => {
  const { registry, rules } = fixture(),
    ref = buildReferenceRegistry(registry, rules);
  assert.match(ref.byId['rule:core.rest'].summary, /d4 HP.*d6 HP/);
  assert.match(ref.byId['rule:core.broken'].summary, /음수.*사망/);
  assert(
    ref.byId['rule:sd.stockCommon'].sourceRefs.some(
      (source) =>
        source.bookId === 'depths' &&
        source.pdfPage === 24 &&
        source.printedPage === 21,
    ),
  );
  assert.match(ref.byId['rule:sd.stockCommon'].summary, /예시/);
  assert.match(ref.byId['rule:sd.solo-variant'].summary, /별도 규칙/);
  assert.equal(ref.byId['rule:city'].available, false);
});

test('Procedures using source aliases retain canonical links and repeated roll order', () => {
  const { registry } = fixture();
  const original = registry.tables.find((t) => t.id === 'core.names')!;
  registry.tables.push({
    ...original,
    id: 'legacy.names',
    canonicalTableId: original.id,
  });
  registry.procedures.push({
    id: 'names.twice',
    title: 'Names twice',
    oracleIds: ['legacy.names', 'core.names'],
  });
  const ref = buildReferenceRegistry(registry),
    procedure = ref.byId['procedure:names.twice'];
  assert.deepEqual(procedure.canonicalIds, ['core.names', 'core.names']);
  assert.deepEqual(procedure.relatedIds, ['oracle:core.names']);
  assert.equal(procedure.sourceRefs[0].tableId, 'core.names');
  assert.deepEqual(procedure.action, {
    kind: 'procedure',
    procedureId: 'names.twice',
  });
  assert.deepEqual(registry.procedures.at(-1)!.oracleIds, [
    'legacy.names',
    'core.names',
  ]);
});

test('An earlier alias cannot replace canonical display or source provenance', () => {
  const { registry } = fixture();
  const original = registry.tables.find((t) => t.id === 'core.names')!;
  registry.tables.unshift({
    ...original,
    id: 'legacy.names',
    title: 'Legacy local label',
    sourcePage: 999,
    sourceVerified: false,
    canonicalTableId: original.id,
  });
  const before = JSON.stringify(registry),
    ref = buildReferenceRegistry(registry),
    entry = ref.byId['oracle:core.names'];
  assert.equal(entry.title, original.title);
  assert.equal(entry.sourceRefs[0].pdfPage, original.sourcePage);
  assert.equal(entry.available, true);
  assert.equal(ref.byId['oracle:legacy.names'], entry);
  assert.deepEqual(entry.action, { kind: 'oracle', oracleIds: ['core.names'] });
  assert.equal(
    ref.entries.filter((e) => e.id === 'oracle:core.names').length,
    1,
  );
  assert(searchReferences(ref, 'legacy names').some((e) => e.id === entry.id));
  assert.equal(JSON.stringify(registry), before);
});

test('Mythic meaning pairs share one searchable tool while retaining both source rolls', () => {
  const { registry } = fixture();
  for (const family of ['action', 'descriptor']) {
    // Reverse load order is intentional: source order must still be 1 then 2.
    for (const part of [2, 1])
      registry.tables.push(
        table(
          `mythic2.meaning.${family}-${part}`,
          `Mythic ${family} ${part}`,
          family === 'action' ? 'ACTION' : 'DESCRIPTION',
          'mythic2',
        ),
      );
  }
  registry.procedures.push({
    id: 'mythic.event-meaning',
    title: 'Event meaning',
    oracleIds: ['mythic2.meaning.action-1', 'mythic2.meaning.action-2'],
  });
  const before = JSON.stringify(registry),
    ref = buildReferenceRegistry(registry);
  for (const family of ['action', 'descriptor']) {
    const ids = [1, 2].map((n) => `mythic2.meaning.${family}-${n}`),
      entry = ref.byId[`oracle:${ids[0]}`];
    assert.equal(ref.byId[`oracle:${ids[1]}`], entry);
    assert.deepEqual(entry.canonicalIds, ids);
    assert.deepEqual(entry.action, { kind: 'oracle', oracleIds: ids });
    assert.deepEqual(
      entry.sourceRefs.map((source) => source.tableId),
      ids,
    );
    assert.equal(
      searchReferences(ref, `mythic ${family}`).filter(
        (e) => e.kind === 'oracle',
      ).length,
      1,
    );
    assert.equal(
      relatedReferences(ref, `oracle:${ids[1]}`).some((e) => e.id === entry.id),
      false,
    );
  }
  assert.deepEqual(ref.byId['procedure:mythic.event-meaning'].relatedIds, [
    'oracle:mythic2.meaning.action-1',
  ]);
  assert.equal(JSON.stringify(registry), before);
});

test('A missing or unverified Mythic partner never offers a partial paired roll', () => {
  const { registry } = fixture(),
    first = table('mythic2.meaning.action-1', 'Action 1', 'ACTION', 'mythic2');
  registry.tables.push(first);
  let ref = buildReferenceRegistry(registry);
  assert.equal(ref.byId[`oracle:${first.id}`].available, false);
  assert.equal(ref.byId[`oracle:${first.id}`].action, null);
  registry.tables.push({
    ...table('mythic2.meaning.action-2', 'Action 2', 'ACTION', 'mythic2'),
    sourceVerified: false,
  });
  ref = buildReferenceRegistry(registry);
  assert.equal(ref.byId[`oracle:${first.id}`].available, false);
  assert.equal(ref.byId['oracle:mythic2.meaning.action-2'].action, null);
});

test('Morale tables retain monster follow-ups even when their source category is OTHER', () => {
  const { registry } = fixture();
  registry.tables.find((t) => t.id === 'core.failedMorale')!.category = 'OTHER';
  registry.tables.find((t) => t.id === 'core.failedMorale')!.title =
    'Failed Morale';
  const ref = buildReferenceRegistry(registry),
    entry = ref.byId['oracle:core.failedMorale'];
  assert.deepEqual(entry.contexts, ['monster']);
  assert(
    searchReferences(ref, 'morale', { context: 'monster' }).some(
      (candidate) => candidate.id === entry.id,
    ),
  );
  const related = relatedReferences(ref, entry.id).map(
    (candidate) => candidate.id,
  );
  assert(related.includes('oracle:core.reaction'));
  assert(related.includes('rule:feretory.monster-approaches'));
  assert(!related.includes(entry.id));
});

test('Stock a Room exposes the next NPC and reaction tools alongside its source rules', () => {
  const { registry } = fixture(),
    ref = buildReferenceRegistry(registry),
    entry = ref.byId['procedure:workbench.stock-room'],
    related = relatedReferences(ref, entry.id, 6).map(
      (candidate) => candidate.id,
    );
  assert.deepEqual(related, [
    'procedure:workbench.npc',
    'oracle:core.reaction',
    'rule:sd.stockCommon',
    'rule:sd.stockRare',
    'oracle:sd.stockCreatures',
    'oracle:reclvse.roomEncounter',
  ]);
  // These are next actions; they are not claimed as tables rolled by room stocking.
  assert(
    !entry.sourceRefs.some((source) => source.tableId === 'core.reaction'),
  );
  assert(!entry.canonicalIds.includes('core.reaction'));
});

test('City mode references include Micro-Crawl PDF 5 and the later move pages', () => {
  const { registry } = fixture(),
    ref = buildReferenceRegistry(registry);
  for (const id of ['rule:city', 'procedure:workbench.city']) {
    assert.deepEqual(ref.byId[id].sourceRefs[0].pdfPage, [5, 6, 7, 8]);
    assert.equal(ref.byId[id].sourceRefs[0].printedPage, '3–6');
  }
});

function coreAliasFixture() {
  const { registry, rules } = fixture();
  const table = registry.tables.find(
    (t) => t.id === 'depths.region.sarkash.monsters',
  )!;
  table.entries[0] = {
    ...table.entries[0],
    text: 'Prowler (MB 71)',
    metadata: {
      name: 'Prowler',
      fixedQuantity: 1,
      printedCrossReference: 'MB 71',
    },
  };
  const alias = {
    name: 'Prowler',
    bookId: 'core',
    printedPage: 71,
    tableId: table.id,
    printedCrossReference: 'MB 71',
    sourceVerified: true,
    note: 'Depths prints MB 71; the supplied Bare Bones edition presents Prowler on PDF/printed page 67.',
  };
  const record = {
    id: 'core.outcast.prowler',
    book: 'core',
    name: 'Prowler',
    hp: 8,
    morale: 8,
    armor: 'Leather -d2',
    attack: 'Knife/Femur',
    damage: 'd4',
    pdfPage: 67,
    printedPage: 67,
    referenceAliases: [alias],
  };
  rules.creatures.push(record);
  return { registry, rules, table, alias, record };
}

test('A verified Core edition alias resolves Prowler while preserving supplied PDF 67 provenance', () => {
  const { registry, rules } = coreAliasFixture(),
    before = JSON.stringify({ registry, rules }),
    result = rollRegionalReference('sarkash', registry, rules, () => 0);
  assert.equal(result.unresolved, false);
  assert.equal(result.preset?.name, 'Prowler');
  assert.equal(result.preset?.hp, 8);
  assert.equal(result.preset?.attack, 'Knife/Femur');
  assert.equal(result.preset?.damage, 'd4');
  assert.equal(result.sourceChain[0].via, 'MB 71');
  assert.equal(result.sourceChain[1].source.pdfPage, 67);
  assert.equal(result.sourceChain[1].source.printedPage, 67);
  assert.match(result.sourceChain[1].source.note ?? '', /MB 71.*67/);
  assert.equal(JSON.stringify({ registry, rules }), before);
});

test('Explicit species aliases preserve named Core statblocks rather than renaming or regenerating them', () => {
  const { registry, rules, table, alias, record } = coreAliasFixture();
  table.entries[0].metadata = {
    name: 'Goblins',
    fixedQuantity: 1,
    printedCrossReference: 'MB p. 58',
  };
  Object.assign(alias, {
    name: 'Goblins',
    printedPage: 58,
    printedCrossReference: 'MB p. 58',
  });
  Object.assign(record, {
    name: 'Seth',
    concept: 'Goblin',
    hp: 6,
    morale: 7,
    pdfPage: 58,
    printedPage: 58,
  });
  const result = rollRegionalReference('sarkash', registry, rules, () => 0);
  assert.equal(result.preset, record);
  assert.equal(result.preset?.name, 'Seth');
  assert.equal(result.preset?.hp, 6);
  assert.equal(result.preset?.morale, 7);
});

test('Core aliases require the exact audited table, name, page, citation and verification flag', () => {
  for (const change of [
    { tableId: 'depths.region.kergus.monsters' },
    { name: 'Earthbound' },
    { bookId: 'heretic' },
    { printedPage: 72 },
    { printedCrossReference: 'MB 72' },
    { sourceVerified: false },
  ]) {
    const { registry, rules, alias } = coreAliasFixture();
    Object.assign(alias, change);
    assert.equal(
      rollRegionalReference('sarkash', registry, rules, () => 0).unresolved,
      true,
    );
  }
});

test('Ambiguous or ineligible alias targets stay unresolved instead of selecting arbitrary stats', () => {
  const { registry, rules, record } = coreAliasFixture();
  rules.creatures.push({ ...record, id: 'another-prowler', hp: 99 });
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).unresolved,
    true,
  );
  rules.creatures.pop();
  Object.assign(record, { presetEligible: false });
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).unresolved,
    true,
  );
  Object.assign(record, { presetEligible: true, hp: null });
  assert.equal(
    rollRegionalReference('sarkash', registry, rules, () => 0).unresolved,
    true,
  );
});

test('Universal search opens an exact supplied creature preset without copying its statblock into the graph', () => {
  const { registry, rules } = fixture();
  const record = {
    id: 'feretory.epk.meatroach',
    book: 'feretory',
    name: 'Meatroach',
    hp: 4,
    section: 'Eat Prey Kill',
    pdfPage: 16,
    printedPage: 14,
  };
  rules.creatures.push(record);
  const before = JSON.stringify(rules),
    ref = buildReferenceRegistry(registry, rules),
    matches = searchReferences(ref, 'Meatroach');
  assert.equal(matches.length, 1);
  const entry = matches[0];
  assert.equal(entry.kind, 'creature');
  assert.deepEqual(entry.action, { kind: 'creature', creatureId: entry.id });
  assert.equal(findReferenceCreature(rules, entry.id), record);
  assert.equal(entry.sourceRefs[0].pdfPage, 16);
  assert.equal(entry.sourceRefs[0].printedPage, 14);
  assert(!('hp' in entry));
  assert.deepEqual(
    relatedReferences(ref, entry.id, 4).map((e) => e.id),
    [
      'oracle:core.reaction',
      'rule:core.reaction-morale',
      'oracle:core.corpsePlundering',
      'oracle:core.treasures',
    ],
  );
  assert.equal(JSON.stringify(rules), before);
});

test('Creature search includes original names, concepts and audited aliases while retaining actual source names', () => {
  const { registry, rules, record } = coreAliasFixture();
  const goblin = {
    book: 'core',
    name: 'Seth',
    concept: 'Goblin',
    hp: 6,
    pdfPage: 58,
    referenceAliases: [
      {
        name: 'Goblins',
        tableId: 'depths.region.sarkash.monsters',
        sourceVerified: true,
      },
    ],
  };
  rules.creatures.push(goblin);
  const ref = buildReferenceRegistry(registry, rules);
  for (const query of ['Seth', 'Goblin', 'Goblins']) {
    const entry = searchReferences(ref, query, { kind: 'creature' })[0];
    assert.equal(entry.id, creatureReferenceId(goblin));
    assert.equal(findReferenceCreature(rules, entry.id)?.name, 'Seth');
  }
  const prowler = searchReferences(ref, 'Prowler', { kind: 'creature' })[0];
  assert.equal(findReferenceCreature(rules, prowler.id), record);
  assert.equal(prowler.sourceRefs[0].pdfPage, 67);
  assert.equal(prowler.sourceRefs[0].printedPage, 67);
});

test('Creature source IDs survive ordering and decline ambiguous or excluded presets', () => {
  const { registry, rules } = fixture();
  const original = rules.creatures[0],
    key = creatureReferenceId(original);
  rules.creatures.reverse();
  assert.equal(findReferenceCreature(rules, key), original);
  rules.creatures.push({ ...original, hp: 99 });
  assert.equal(findReferenceCreature(rules, key), null);
  assert.equal(buildReferenceRegistry(registry, rules).byId[key].action, null);
  rules.creatures.pop();
  original.presetEligible = false;
  assert.equal(findReferenceCreature(rules, key), null);
  assert.equal(buildReferenceRegistry(registry, rules).byId[key], undefined);
});

test('Unverified creatures remain listed for source inspection without an executable action', () => {
  const { registry, rules } = fixture(),
    record = rules.creatures[0];
  record.sourceVerified = false;
  const entry = buildReferenceRegistry(registry, rules).byId[
    creatureReferenceId(record)
  ];
  assert.equal(entry.available, false);
  assert.equal(entry.action, null);
  assert.equal(entry.sourceRefs[0].pdfPage, record.pdfPage);
});

test('Bare play searches prefer the Core rule and complete tools over alphabetic matches', () => {
  const { registry, rules } = fixture();
  registry.tables.push(
    table('reclvse.creatureMorale', 'Beasts — Morale', 'OTHER', 'reclvse'),
    table('sd.usefulItems', 'Useful Items', 'TREASURE', 'sd'),
    table('reclvse.npcItem', 'A NPC Useful Item', 'NPC', 'reclvse'),
    table('sd.stockRoomDetail', 'A Stock Room Detail', 'ROOM', 'sd'),
  );
  const ref = buildReferenceRegistry(registry, rules);
  for (const [query, expected] of [
    ['morale', 'rule:core.reaction-morale'],
    ['reaction', 'oracle:core.reaction'],
    ['useful item', 'oracle:sd.usefulItems'],
    ['useful items', 'oracle:sd.usefulItems'],
    ['NPC', 'procedure:workbench.npc'],
    ['stock room', 'procedure:workbench.stock-room'],
    ['stock a room', 'procedure:workbench.stock-room'],
  ])
    assert.equal(searchReferences(ref, query)[0].id, expected, query);
  assert.equal(
    searchReferences(ref, 'beasts morale')[0].id,
    'oracle:reclvse.creatureMorale',
  );
  assert(
    searchReferences(ref, 'morale', { kind: 'oracle' }).every(
      (e) => e.kind === 'oracle',
    ),
  );
});

test('Exact creature names outrank a longer table title or incidental keyword mention', () => {
  const { registry, rules, record } = coreAliasFixture();
  registry.tables.push(
    table('core.prowlerEncounters', 'A Prowler Encounter', 'ENCOUNTER', 'core'),
    {
      ...table('core.other', 'A Different Result', 'OTHER', 'core'),
      tags: ['Prowler'],
    },
  );
  Object.assign(record, { concept: 'Outcast' });
  const ref = buildReferenceRegistry(registry, rules);
  assert.equal(
    searchReferences(ref, 'Prowler')[0].id,
    creatureReferenceId(record),
  );
  assert.equal(
    searchReferences(ref, 'prowler encounter')[0].id,
    'oracle:core.prowlerEncounters',
  );
});

test('Malformed creature metadata is narrowed instead of stringifying arbitrary objects', () => {
  const { registry, rules } = fixture();
  let coercions = 0;
  const hostile = {
    toString() {
      coercions++;
      throw new Error('must not coerce an object');
    },
  };
  const record = {
    name: 'Narrowed beast',
    hp: 4,
    book: hostile,
    id: hostile,
    pdfPage: hostile,
    section: hostile,
    referenceAliases: [{ name: hostile, sourceVerified: true }],
  };
  rules.creatures.push(record);
  const ref = buildReferenceRegistry(registry, rules),
    id = creatureReferenceId(record);
  assert.equal(id, 'creature:unknown:unpaged:narrowed-beast');
  assert.equal(ref.byId[id].available, false);
  assert.equal(ref.byId[id].action, null);
  assert.equal(ref.byId[id].sourceRefs[0].tableTitle, 'Narrowed beast');
  assert.equal(coercions, 0);
});
