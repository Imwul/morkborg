import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  contextReferences,
} from '../src/domain/references.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../src/domain/referenceDefinitions.ts';
import {
  generatedReference,
  generatedSourceReference,
  referenceTextSegments,
} from '../src/domain/generatedReferenceLinks.ts';
import {
  tableSelector,
  tableEntryNotes,
  followUpSelector,
  selectReferenceReading,
  canSelectTableEntry,
} from '../src/domain/referenceTable.ts';
import { parseRulesPack, setRules } from '../src/storage/rulesStore.ts';
import { parseOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { mergePublishedPacks } from '../src/storage/publishedDataMerge.ts';
import { validateCampaign } from '../src/storage/schema.ts';
import { createCampaign } from '../src/generators/index.ts';
import { REFERENCE_SEARCH_ALIASES } from '../src/domain/referenceSearchAliases.ts';
const available = existsSync('outputs/morkborg-private-data.json');
const bundle = available
  ? JSON.parse(readFileSync('outputs/morkborg-private-data.json', 'utf8'))
  : null;
const rules = bundle ? parseRulesPack(bundle.library) : null;
const extra = bundle ? parseOraclePack(bundle.oracles) : null;
const registry = buildOracleRegistry(rules, extra);
const index = buildReferenceRegistry(registry, rules);
const defs = index.entries.filter((e) => e.definition);
const privateTest = (name: string, fn: () => void) =>
  test(name, { skip: !available }, fn);
const top = (q: string) => searchReferences(index, q)[0];
const table = (id: string) => registry.tables.find((t) => t.id === id)!;

test('Omens retains all five source uses and depleted-only recovery, without a retry/failure substitution', () => {
  const r = buildReferenceRegistry({
    books: [
      { id: 'core', title: 'Core' },
      { id: 'core-full', title: 'Full' },
    ],
    tables: [],
    procedures: [],
  }).byId['rule:core.omens'];
  for (const term of [
    'with an attack',
    'yours or someone else',
    'dealt to you by d6',
    'Crit or Fumble',
    'one test’s DR by 4',
    'Only when depleted',
    'at least six hours',
    'classless: d2',
  ])
    assert.ok(r.summary.includes(term), term);
  assert.doesNotMatch(r.summary, /재시도|ordinary failure|권능 사용 횟수/);
  assert.ok(r.sourceRefs.every((s) => s.status === 'VERIFIED'));
  assert.deepEqual(
    r.sourceRefs.map((s) => [s.bookId, s.pdfPage, s.printedPage]),
    [
      ['core', [37], 37],
      ['core-full', 42, 38],
    ],
  );
});
privateTest(
  'All 20 exact Power names rank first and have the canonical unmodified effect',
  () => {
    const powers = defs.filter((e) => e.definition!.kind === 'Power');
    assert.equal(powers.length, 20);
    for (const p of powers) {
      assert.equal(top(p.title).id, p.id, p.title);
      const s = p.definition!.tableEntry!;
      const e = table(s.tableId).entries.find((e) => e.id === s.entryId)!;
      assert.equal(p.definition!.blocks[0].text, e.metadata!.effect);
      assert.ok(p.definition!.blocks[0].text.length > 20);
      assert.ok(p.relatedIds.includes('rule:core.casting'));
    }
  },
);
privateTest(
  'Named Power links resolve from a roll, generated scroll and innate Power without translation matching',
  () => {
    for (const p of defs.filter((e) => e.definition!.kind === 'Power')) {
      assert.equal(generatedReference(index.entries, p.title)?.id, p.id);
      assert.equal(
        generatedReference(
          index.entries,
          `sacred scroll: ${p.title} — ${p.definition!.blocks[0].text}`,
        )?.id,
        p.id,
      );
      assert.equal(
        generatedReference(index.entries, `Innate Power: ${p.title} — effect`)
          ?.id,
        p.id,
      );
    }
  },
);
privateTest('Power TABLE notes contain every effect', () => {
  for (const id of ['core.sacred', 'core.unclean'])
    for (const e of table(id).entries)
      assert.ok(tableEntryNotes(e).includes(String(e.metadata!.effect)));
});
privateTest(
  'SD daily Misery variant has the ceiling, daily cadence and downgrade sequence; Calendar and travel reuse it',
  () => {
    const r = index.byId['rule:sd.daily-misery'];
    for (const s of [
      'SÖLITARY DEFILEMENT VARIANT',
      'Each passing day',
      'no higher than d20',
      'after each Misery',
      'd12, d10, d8, d6, d4, d2',
    ])
      assert.ok(r.summary.includes(s));
    assert.equal(r.sourceRefs[0].pdfPage?.toString(), '5');
    assert.equal(r.sourceRefs[0].printedPage, 3);
    for (const id of [
      'rule:sd.travel-day',
      'rule:core.miseries',
      'oracle:core.miseries',
    ])
      assert.ok(index.byId[id].relatedIds.includes(r.id), id);
    assert.doesNotMatch(
      index.byId['rule:sd.solo-variant'].summary,
      /단계 상승/,
    );
  },
);
privateTest(
  'FER travel times have all eleven map routes and original adjustment conditions',
  () => {
    const r = index.byId['rule:feretory.travel-distances'];
    assert.equal(r.definition!.blocks.length, 12);
    for (const s of [
      'halve the static modifier',
      'drop the die size one step',
      'double everything',
      'double travel time',
      'outside known roads',
    ])
      assert.ok(r.summary.includes(s));
    assert.equal(r.sourceRefs[0].pdfPage, 6);
    assert.equal(r.sourceRefs[0].printedPage, 4);
    assert.equal(
      r.definition!.blocks.find((b) => b.title === 'Alliáns — Galgenbeck')
        ?.text,
      'd10+10 days',
    );
    for (const q of ['road', 'journey', 'distance', '이동', '거리', '며칠'])
      assert.equal(top(q).id, r.id, q);
    assert.ok(contextReferences(index, 'travel').some((e) => e.id === r.id));
  },
);
privateTest(
  'All seventeen weapons have exact-name definitions with source damage and prices',
  () => {
    const expected: Record<string, string> = {
      'Battle axe': 'd8',
      Bow: 'd6',
      Club: 'd6',
      Crossbow: 'd8',
      Flail: 'd8',
      Femur: 'd4',
      Handaxe: 'd6',
      Knife: 'd4',
      Mace: 'd6',
      Shortbow: 'd4',
      Shortsword: 'd4',
      Sling: 'd4',
      Staff: 'd4',
      Sword: 'd6',
      Warhammer: 'd6',
      Whip: 'd2',
      Zweihänder: 'd10',
    };
    const weapons = defs.filter((e) => e.definition!.kind === 'Weapon');
    assert.equal(weapons.length, 17);
    for (const [name, damage] of Object.entries(expected)) {
      const r = top(name);
      assert.equal(r.title, name);
      assert.ok(r.summary.includes(`Damage ${damage}`));
      assert.ok(r.summary.includes('s') || r.summary.includes('worthless'));
      assert.equal(generatedReference(index.entries, name)?.id, r.id);
    }
    for (const e of table('core.weapons').entries)
      assert.ok(top(e.text).summary.includes(String(e.metadata!.damage)));
    assert.ok(top('Bow').summary.includes('Presence + 10 arrows'));
    assert.ok(top('Crossbow').summary.includes('10 bolts: 10s'));
    assert.match(top('Improvised Weapons').summary, /d4/);
    assert.match(top('Unarmed').summary, /d2/);
  },
);
privateTest(
  'Armor and Shield expose reductions, penalties and restrictions without invented stats',
  () => {
    for (const [name, dr] of [
      ['Light armor', 'd2'],
      ['Medium armor', 'd4'],
      ['Heavy armor', 'd6'],
    ]) {
      const r = top(name);
      assert.equal(r.title, name);
      assert.ok(r.summary.includes(dr));
      assert.ok(r.sourceRefs.length);
    }
    assert.match(
      top('Heavy armor').summary,
      /Agility tests DR \+4; defence DR \+2/,
    );
    assert.match(top('Medium armor').summary, /Scrolls will never work/);
    assert.match(top('Shield').summary, /ignore all damage from one attack/);
    assert.equal(
      generatedReference(index.entries, 'Light armor −d2')?.id,
      top('Light armor').id,
    );
  },
);
privateTest(
  'All 45 equipment catalog names and Shield resolve; name-only items retain price without invented uses',
  () => {
    const gear = defs.filter((e) => e.definition!.kind === 'Equipment');
    assert.equal(gear.length, 46);
    for (const e of gear)
      assert.equal(
        searchReferences(index, e.title).find(
          (r) => r.definition?.kind === 'Equipment',
        )?.id,
        e.id,
        e.title,
      );
    const medicine = top('medicine box');
    assert.match(medicine.summary, /Stops bleeding\/infection and \+d6 HP/);
    assert.match(medicine.summary, /Presence \+ 4 uses/);
    assert.equal(medicine.sourceRefs[0].pdfPage, 24);
    assert.equal(top('Tent').summary, '12s');
    assert.match(top('Lantern oil').summary, /Presence \+ 6 hours/);
    assert.match(top('Poison (black)').summary, /DR14.*one hour/);
    assert.match(top('Waterskin').summary, /4 days/);
    const toolbox = top('Toolbox');
    assert.equal(toolbox.definition!.blocks.length, 2);
    assert.match(toolbox.definition!.blocks[1].text, /drill/);
    assert.doesNotMatch(toolbox.definition!.blocks[0].text, /drill/);
    assert.equal(toolbox.sourceRefs.length, 2);
  },
);
privateTest(
  'Generated item text links use exact names, longest first, without altering visible text',
  () => {
    const text = 'A Shortbow, a Bow, Medicine box and Torch.';
    const parts = referenceTextSegments(index.entries, text);
    assert.equal(parts.map((p) => p.text).join(''), text);
    assert.equal(parts.filter((p) => p.id).length, 4);
    assert.equal(
      parts.find((p) => p.text === 'Shortbow')?.id,
      top('Shortbow').id,
    );
    assert.equal(
      referenceTextSegments(index.entries, 'swordsman')[0].id,
      undefined,
    );
    assert.ok(
      referenceTextSegments(index.entries, 'death comes for everyone').every(
        (p) => !p.id,
      ),
    );
    assert.equal(generatedReference(index.entries, 'death'), undefined);
    assert.equal(
      generatedReference(index.entries, 'Death')?.definition?.kind,
      'Power',
    );
  },
);
privateTest(
  'Every curated Korean and English situational alias ranks its existing canonical action first',
  () => {
    for (const [id, a] of Object.entries(REFERENCE_SEARCH_ALIASES))
      for (const query of [...a.ko, ...a.en])
        assert.equal(top(query)?.id, id, query);
    for (const q of ['power', 'powers', 'scroll', 'scrolls', '마법', '스크롤'])
      assert.equal(top(q).id, 'rule:core.casting');
  },
);
privateTest(
  'All six Core classes rank before support tables and expose rules without character creation',
  () => {
    const classes = defs.filter((e) => e.definition!.kind === 'Class');
    assert.equal(classes.length, 6);
    for (const c of classes) {
      assert.equal(top(c.title).id, c.id);
      assert.ok(c.definition!.blocks.length >= 3);
      assert.ok(c.relatedIds.some((id) => id.startsWith('oracle:core.')));
    }
    assert.match(top('Fanged Deserter').summary, /Bite attack: DR10/);
    assert.match(
      top('Heretical Priest').summary,
      /Powers while wearing medium armor/,
    );
    assert.match(top('Occult Herbmaster').summary, /24 hours/);
  },
);
privateTest(
  'All 38 class table effects have a definition linked to their parent class',
  () => {
    const abilities = defs.filter(
      (e) => e.definition!.kind === 'Class ability',
    );
    assert.equal(abilities.length, 38);
    for (const a of abilities) {
      assert.equal(top(a.title).id, a.id, a.title);
      assert.ok(a.relatedIds.some((id) => id.startsWith('class:')));
      assert.equal(
        generatedReference(index.entries, a.definition!.blocks[0].text)?.id,
        a.id,
      );
    }
  },
);
privateTest(
  'City actions route to parent Moves, preserve child tables and keep their own source',
  () => {
    for (const [q, move] of [
      ['City Crawl', 'crawl'],
      ['Directions', 'directions'],
      ['Pray', 'pray'],
      ['Stash', 'stash'],
    ] as const) {
      const r = top(q);
      assert.equal(r.id, `procedure:city.${move}`);
      assert.deepEqual(r.action, { kind: 'city', move });
      assert.match(r.summary, /Strong:.*Weak:.*Fail:/);
      assert.ok(r.relatedIds.length);
      for (const child of relatedReferences(index, r.id, 99)) {
        assert.equal(child.parentId, r.id);
        assert.ok(child.relatedIds.includes(r.id));
      }
    }
    assert.equal(top('Pray Failure').id, 'oracle:aitc.pray-failure');
  },
);
privateTest(
  'TABLE preserves cards, truth/false, open-ended ranges, room exit columns, conditions and nested ranges',
  () => {
    assert.equal(tableSelector(table('depths.rare.look').entries[0]), 'A');
    assert.equal(
      tableSelector(table('depths.rare.intention').entries[0]),
      '♣♣',
    );
    assert.equal(
      tableSelector(table('depths.enemyStats').entries.at(-1)!),
      '16+',
    );
    assert.equal(
      tableSelector(table('heretic.songbird.spinalHusk').entries[0]),
      '6+',
    );
    for (const e of table('heretic.gravesKnowledge').entries)
      assert.ok(tableEntryNotes(e).includes(`Truth: ${e.metadata!.truth}`));
    assert.deepEqual(
      Object.keys(
        table('sd.room.exits').entries[0].metadata!
          .bySpecialRoomsUncovered as object,
      ),
      ['0', '1', '2', '3', '4'],
    );
    for (const e of table('aitc.holy-places-small').entries)
      assert.ok(tableEntryNotes(e).includes(String(e.metadata!.conditional)));
    const children = table('core.danger').entries[0].metadata!
      .followup as any[];
    assert.equal(followUpSelector(children[0]), '1–2');
    assert.equal(followUpSelector(children[1]), '3–4');
  },
);
privateTest(
  'Manual TABLE selection is transient with source entry identity and no fabricated roll',
  () => {
    const t = table('core.unclean'),
      e = t.entries[4],
      r = selectReferenceReading(t, e, registry);
    assert.equal(r.sourceRefs[0].entryId, e.id);
    assert.equal(r.sourceRefs[0].roll, undefined);
    assert.equal(r.oracle, undefined);
    assert.equal(r.authority![0].kind, 'APP_POLICY');
    assert.ok(copyReferenceReading(r).includes(String(e.metadata!.effect)));
    assert.doesNotMatch(
      copyReferenceReading(r, true),
      /core\.unclean|dataset|app\.table/,
    );
    assert.equal(
      canSelectTableEntry(
        table('depths.rare.look'),
        table('depths.rare.look').entries[0],
      ),
      false,
    );
  },
);
privateTest(
  'New definitions resolve their sources and the canonical registry retains zero unresolved production sources',
  () => {
    assert.deepEqual(
      unresolvedReferenceDefinitions(
        buildReferenceDefinitions(registry, rules),
        registry,
      ),
      [],
    );
    assert.deepEqual(validateOracleRegistry(registry), []);
    assert.deepEqual(unresolvedOracleSources(registry), []);
    const bad = structuredClone(defs[0].definition!);
    bad.sourceRefs[0].entryId = 'missing-entry';
    assert.ok(
      unresolvedReferenceDefinitions([bad], registry).some((message) =>
        message.includes('missing entry'),
      ),
    );
  },
);
privateTest(
  'Missing source packs create no substitute Power/Class/equipment definitions',
  () => {
    assert.equal(
      buildReferenceDefinitions({ books: [], tables: [], procedures: [] }, null)
        .length,
      0,
    );
  },
);
privateTest(
  'Generated Character class, Omens, armor, weapon, Power and equipment links survive save/reload without editing values',
  () => {
    setRules(bundle.library);
    setOraclePack(bundle.oracles);
    const campaign = createCampaign('Batch 1 QA');
    const ch = generateCharacter(campaign.id, false, 'esoteric-hermit');
    assert.ok(index.byId[`class:${ch.classId}`]);
    assert.ok(index.byId['rule:core.omens']);
    assert.ok(generatedReference(index.entries, ch.armor));
    assert.ok(generatedReference(index.entries, ch.weapons[0].text));
    const power = ch.equipment.find((e) => e.text.includes('scroll:'));
    assert.ok(power);
    assert.equal(
      generatedSourceReference(index.entries, power!.text, power!.provenance)
        ?.definition?.kind,
      'Power',
    );
    const before = JSON.parse(JSON.stringify(ch));
    campaign.characters.push(ch);
    const after = validateCampaign(JSON.parse(JSON.stringify(campaign)));
    assert.deepEqual(after.characters[0], before);
  },
);
privateTest(
  'Lookup execution is read-only and COPY excludes source/debug identifiers',
  () => {
    const entry = top('Daemon of Capillaries');
    const before = JSON.stringify(rules);
    const r = executeReference(entry, {
      registry,
      rules,
      region: 'sarkash',
      stockKind: 'common',
      stockDR: 10,
      cityLarge: false,
      cityExits: false,
    })!;
    assert.ok(copyReferenceReading(r).includes('d6 rounds'));
    assert.doesNotMatch(
      copyReferenceReading(r),
      /PDF|definition:|sourceStatus/,
    );
    assert.equal(JSON.stringify(rules), before);
  },
);
privateTest(
  'New source catalog can merge into an existing installation without changing saved source text or custom selectors',
  () => {
    const old = structuredClone(extra!);
    old.tables = old.tables.filter(
      (t) =>
        ![
          'core.weaponCatalog',
          'core.equipmentCatalog',
          'feretory.travelDistances',
        ].includes(t.id),
    );
    const classTable = old.tables.find(
      (t) => t.id === 'core.fangedDeserterItem',
    )!;
    delete classTable.entries[0].metadata!.referenceName;
    const oldRules = structuredClone(rules!);
    for (const e of oldRules.tables['core.armor'].entries)
      delete e.meta.scrollRestriction;
    const merged = mergePublishedPacks(
      { library: oldRules, oracles: old },
      { library: rules!, oracles: extra! },
    );
    assert.ok(
      merged.oracles!.tables.some((t) => t.id === 'core.weaponCatalog'),
    );
    assert.equal(
      merged.oracles!.tables.find((t) => t.id === classTable.id)!.entries[0]
        .text,
      classTable.entries[0].text,
    );
    assert.ok(
      merged.library!.tables['core.armor'].entries[2].meta.scrollRestriction,
    );
    assert.deepEqual(
      unresolvedReferenceDefinitions(
        buildReferenceDefinitions(
          buildOracleRegistry(merged.library!, merged.oracles!),
          merged.library!,
        ),
        buildOracleRegistry(merged.library!, merged.oracles!),
      ),
      [],
    );
  },
);
