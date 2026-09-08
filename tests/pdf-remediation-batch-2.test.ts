import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  findReferenceCreature,
} from '../src/domain/references.ts';
import { unresolvedReferenceDefinitions } from '../src/domain/referenceDefinitions.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import {
  drawRareMonster,
  nextRareLook,
  checkEncounterLevel,
  encounterRegions,
  shuffledDeck,
  CARD_RANKS,
  cardIdentity,
  DEPTHS_GENERATOR_PROCEDURES,
  type PlayingCard,
} from '../src/domain/depthsProcedures.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  copyReferenceReading,
  oracleFollowUpLinks,
} from '../src/domain/referenceReading.ts';
import { tableEntryNotes } from '../src/domain/referenceTable.ts';
import { referenceAction } from '../src/domain/referenceActions.ts';
import { referenceTextSegments } from '../src/domain/generatedReferenceLinks.ts';
import { oracleSourceFingerprint } from '../src/data/oracles/sourceEvidence.ts';
import { regions } from '../src/data/regions.ts';

const available = existsSync('outputs/morkborg-private-data.json');
const bundle = available
  ? JSON.parse(readFileSync('outputs/morkborg-private-data.json', 'utf8'))
  : null;
const rules = bundle ? parseRulesPack(bundle.library) : null;
const registry = buildOracleRegistry(
  rules,
  bundle ? parseOraclePack(bundle.oracles) : null,
);
const index = buildReferenceRegistry(registry, rules);
const check = (name: string, fn: () => void) =>
  test(name, { skip: !available }, fn);
const entry = (id: string) => {
  assert.ok(index.byId[id], id);
  return index.byId[id];
};
const rule = (id: string) => entry('rule:' + id);
const top = (q: string) => searchReferences(index, q, { limit: 1 })[0];
const run = (id: string, rng = () => 0.2) =>
  executeReference(entry(id), {
    registry,
    rules,
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: true,
    rng,
  })!;
const deck = (prefix: PlayingCard[]) => [
  ...prefix,
  ...shuffledDeck(() => 0.3).filter(
    (c) => !prefix.some((p) => cardIdentity(p) === cardIdentity(c)),
  ),
];

check(
  'RECLVSE core rules retain their own mechanics and exact source pages',
  () => {
    const expected: Record<string, [number, string[]]> = {
      advantage: [12, ['3d20', 'highest two', 'lowest two']],
      'critical-die': [12, ['designate', '20 + Strong Hit', '1 + Miss']],
      omens: [
        18,
        [
          'Maximum 2',
          'single die',
          'negate all damage',
          'lower DR by 2',
          'before consequences',
        ],
      ],
      guarding: [42, ['d20 + Agility', 'DR12', 'Once per fight', 'destroying']],
      morale: [
        42,
        [
          'bloodied, outnumbered or leaderless',
          'exceeds',
          '1–3 flee',
          '4–6 surrender',
        ],
      ],
      'combat-criticals': [42, ['double damage', 'degrade', 'disarmed']],
      infection: [43, ['do not heal naturally', 'd6 HP per day']],
      'medicine-kit': [43, ['Presence + 4', 'd6 HP']],
      calendar: [9, ['d100', 'd20', 'd10', 'd6', 'd2', 'seventh Truth', '7:7']],
    };
    for (const [id, [page, terms]] of Object.entries(expected)) {
      const e = rule('reclvse.' + id);
      assert.equal(e.sourceRefs[0].bookId, 'reclvse');
      assert.equal(e.sourceRefs[0].pdfPage, page);
      for (const term of terms)
        assert.ok(e.summary.includes(term), `${id}: ${term}`);
    }
  },
);
check(
  'RECLVSE source ambiguities remain visible without invented outcomes',
  () => {
    assert.match(
      rule('reclvse.ask-oracle').summary,
      /or less[\s\S]+below the target/,
    );
    assert.match(
      rule('reclvse.recovery').summary,
      /SOURCE CONFLICT[\s\S]+Scarred/,
    );
    assert.match(
      rule('reclvse.journey-length').summary,
      /does not explicitly state which base duration/,
    );
    assert.match(rule('reclvse.road').summary, /Ignore Strong Hit/);
    assert.match(
      rule('reclvse.invoke-power').sourceRefs[0].note!,
      /actual supplied Corruption table is PDF\/printed36/,
    );
  },
);
check(
  'All targeted RECLVSE Moves have roll, trigger and distinct outcome branches',
  () => {
    const ids = [
      'journey-length',
      'road',
      'move-area',
      'weather',
      'hunt',
      'butcher',
      'camp',
      'night-encounter',
      'hold-bearing',
      'forage',
      'tend-wounds',
      'short-rest',
      'passage',
      'search-room',
      'face-trap',
      'room-encounter',
    ];
    for (const id of ids) {
      const e = rule('reclvse.' + id);
      for (const heading of [
        'RECLVSE MOVE',
        'ROLL',
        'STRONG HIT',
        'WEAK HIT',
        'MISS',
      ])
        assert.ok(
          e.definition!.blocks.some(
            (b) => b.title === heading && b.text.length > 0,
          ),
          id + heading,
        );
      assert.equal(e.action?.kind, 'rule');
      assert.equal(top(e.title).id, e.id, e.title);
    }
    assert.match(
      rule('reclvse.starvation').summary,
      /1 damage and disadvantage the next day/,
    );
  },
);
check(
  'RECLVSE groups and travel/dungeon next steps are compact canonical links',
  () => {
    assert.equal(entry('group:reclvse').referenceGroupIds?.length, 7);
    for (const [from, to] of [
      ['travel', 'camp'],
      ['camp', 'night-encounter'],
      ['road', 'hold-bearing'],
      ['passage', 'face-trap'],
      ['search-room', 'room-encounter'],
    ])
      assert.ok(
        relatedReferences(index, rule('reclvse.' + from).id, 8).some(
          (e) => e.id === 'rule:reclvse.' + to,
        ),
        from + '→' + to,
      );
  },
);
check(
  'RECLVSE calendar has all 36 distinct d66 selectors and links back to its rule',
  () => {
    const t = registry.tables.find((t) => t.id === 'reclvse.unspokens')!;
    assert.equal(t.entries.length, 36);
    assert.equal(t.dice, 'd66');
    assert.equal(t.sourcePage, 10);
    for (let a = 1; a <= 6; a++)
      for (let b = 1; b <= 6; b++)
        assert.equal(
          t.entries.filter((e) => e.min === 10 * a + b && e.max === e.min)
            .length,
          1,
        );
    assert.ok(
      rule('reclvse.calendar').relatedIds.includes('oracle:reclvse.unspokens'),
    );
  },
);
check(
  'SD Omens and Power exceptions stay separate from Core with all timing and dice semantics',
  () => {
    const o = rule('sd.omens'),
      p = rule('sd.powers');
    assert.match(o.summary, /one or both dice/);
    assert.match(o.summary, /Maximum four/);
    assert.match(o.summary, /does not spend/);
    assert.match(p.summary, /single d20/);
    assert.match(p.summary, /failed casting equates to Weak Hit/);
    assert.match(p.summary, /fumble equates to Fail/);
    assert.equal(p.sourceRefs[0].pdfPage, 5);
    assert.equal(p.sourceRefs[0].printedPage, 3);
    assert.ok(
      relatedReferences(index, 'rule:core.omens', 8).some((e) => e.id === o.id),
    );
    assert.ok(
      relatedReferences(index, 'rule:core.casting', 8).some(
        (e) => e.id === p.id,
      ),
    );
  },
);
check(
  'SD outdoor Micro-crawl cites PDF20, while Begin/Conclude cite PDF7 and preserve exact milestones/DR',
  () => {
    assert.equal(rule('sd.microcrawl').sourceRefs[0].pdfPage, 20);
    assert.match(
      rule('sd.microcrawl').summary,
      /d4 waypoints[\s\S]+excluding Room Exits/,
    );
    assert.equal(rule('sd.begin-adventure').sourceRefs[0].pdfPage, 7);
    assert.match(
      rule('sd.begin-adventure').summary,
      /Straightforward 1 · Annoying 2 · Depressing 4 · Wearying 8 · Suicidal 12/,
    );
    const c = rule('sd.conclude-adventure');
    assert.match(
      c.summary,
      /8 · Annoying 10 · Depressing 12 · Wearying 16 · Suicidal 18/,
    );
    assert.match(c.summary, /d2\+1 milestones/);
  },
);
check(
  'All eight Encounter Levels match source and equality triggers an encounter',
  () => {
    assert.deepEqual(
      encounterRegions(registry).map((r) => r.level),
      [7, 8, 5, 12, 5, 9, 10, 9],
    );
    for (const r of encounterRegions(registry)) {
      let n = 0;
      const at = checkEncounterLevel(registry, r.key, () =>
        n++ === 0 ? (r.level - 0.5) / 20 : 0,
      );
      assert.equal(at.blocks[0].text, 'Encounter');
      assert.ok(
        at.relatedIds!.some((id) => id.startsWith('rule:regional-monsters:')),
      );
      assert.ok(
        at.relatedIds!.every((id) => index.byId[id]),
        r.key,
      );
      const above = checkEncounterLevel(
        registry,
        r.key,
        () => (r.level + 0.5) / 20,
      );
      assert.equal(above.blocks.length, 1);
      assert.equal(above.blocks[0].text, 'No encounter');
    }
  },
);
check(
  'Encounter routing preserves NPC and rare branches; no numeric level modifiers are invented',
  () => {
    for (const [die, target] of [
      [3, 'oracle:sd.npc.disposition'],
      [5, 'oracle:sd.npc.disposition'],
      [6, 'oracle:sd.npc.disposition'],
      [7, 'oracle:sd.npc.disposition'],
      [8, 'rule:regional-monsters:sarkash'],
      [9, 'procedure:depths.rare-monster'],
    ] as const) {
      let n = 0;
      const r = checkEncounterLevel(registry, 'sarkash', () =>
        n++ === 0 ? 0 : (die - 0.5) / 20,
      );
      assert.ok(r.relatedIds!.includes(target));
    }
    assert.equal(
      referenceAction(entry('procedure:depths.encounter-level')).immediate,
      false,
    );
    assert.match(
      entry('procedure:depths.encounter-level').summary,
      /No numeric Encounter Level modifiers/,
    );
  },
);
check(
  'A card deck has all rank/suit identities and successive piles never reuse cards',
  () => {
    const full = shuffledDeck(() => 0.42);
    assert.equal(new Set(full.map(cardIdentity)).size, 52);
    const a = drawRareMonster(registry, full),
      b = drawRareMonster(registry, a.rareMonster!.remaining);
    assert.equal(
      new Set(
        [...a.rareMonster!.cards, ...b.rareMonster!.cards].map(cardIdentity),
      ).size,
      a.rareMonster!.cards.length + b.rareMonster!.cards.length,
    );
    assert.deepEqual(
      full,
      shuffledDeck(() => 0.42),
    );
    assert.throws(
      () => drawRareMonster(registry, full.slice(0, 4)),
      /카드가 부족/,
    );
  },
);
check(
  'Every rank gives source-faithful HP, armor, Morale and rounded damage',
  () => {
    const hp = [2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10],
      armor = [
        'No armor',
        '−d2',
        'No armor',
        '−d2',
        'No armor',
        '−d2',
        'No armor',
        '−d2',
        'No armor',
        '−d2',
        '−d4',
        '−d4',
        '−d4',
      ],
      morale = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 15, 15],
      damage = [2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 10, 10, 10];
    CARD_RANKS.forEach((rank, i) => {
      const t = drawRareMonster(
        registry,
        deck([
          { rank: 'A', suit: '♠' },
          { rank: '2', suit: '♠' },
          { rank, suit: '♥' },
          { rank, suit: '♦' },
          { rank, suit: '♣' },
        ]),
      ).rareMonster!;
      assert.equal(t.hp, hp[i]);
      assert.equal(t.armor, armor[i]);
      assert.equal(t.morale, morale[i]);
      assert.equal(t.damageDie, damage[i]);
    });
  },
);
check(
  'Ordered card suits select their exact source entries; ranks are not arbitrary dN indexes',
  () => {
    const t = drawRareMonster(
      registry,
      deck([
        { rank: 'K', suit: '♣' },
        { rank: 'A', suit: '♦' },
        { rank: '3', suit: '♥' },
        { rank: '4', suit: '♣' },
        { rank: '5', suit: '♦' },
      ]),
    ).rareMonster!;
    assert.equal(t.components[0].text, 'Human... or is it?');
    assert.equal(t.components[1].text, 'Too many legs');
    assert.equal(
      t.components[2].source.entryId,
      registry.tables
        .find((x) => x.id === 'depths.rare.intention')!
        .entries.find((e) => e.metadata?.symbols === '♣♦')!.id,
    );
  },
);
check(
  'Double spades draws card six; repeated double spades doubles HP and raises d10 to d12',
  () => {
    const a = drawRareMonster(
      registry,
      deck([
        { rank: 'A', suit: '♣' },
        { rank: '2', suit: '♥' },
        { rank: 'A', suit: '♠' },
        { rank: '10', suit: '♠' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♠' },
      ]),
    );
    assert.equal(a.rareMonster!.cards.length, 6);
    assert.equal(a.rareMonster!.hp, 4);
    assert.equal(a.rareMonster!.damageDie, 12);
    assert.deepEqual(
      a.rareMonster!.components.find((c) => c.title === 'SPECIAL')!.cards,
      [5, 6],
    );
    assert.ok(a.sourceRefs.some((s) => s.note?.includes('Cards 3 + 4')));
    const b = drawRareMonster(
      registry,
      deck([
        { rank: 'A', suit: '♣' },
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♠' },
        { rank: '4', suit: '♠' },
        { rank: '5', suit: '♣' },
        { rank: 'Q', suit: '♥' },
      ]),
    );
    assert.equal(b.rareMonster!.hp, 3);
    assert.match(b.rareMonster!.components.at(-1)!.text, /Upon death/);
  },
);
check(
  'Source-permitted next Look preserves other components/cards and updates its entry provenance',
  () => {
    const a = drawRareMonster(
      registry,
      deck([
        { rank: 'A', suit: '♣' },
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' },
        { rank: '4', suit: '♣' },
        { rank: '5', suit: '♦' },
      ]),
    );
    const b = nextRareLook(a, registry);
    assert.equal(b.rareMonster!.components[0].text, 'Slime');
    assert.notEqual(
      b.rareMonster!.components[0].source.entryId,
      a.rareMonster!.components[0].source.entryId,
    );
    assert.deepEqual(
      b.rareMonster!.components.slice(1),
      a.rareMonster!.components.slice(1),
    );
    assert.deepEqual(b.rareMonster!.cards, a.rareMonster!.cards);
  },
);
check(
  'Ten thousand rare-monster passes have resolvable per-component source/card traces and no UNSOURCED values',
  () => {
    let state = 771;
    const rng = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let n = 0; n < 10000; n++) {
      const r = drawRareMonster(registry, undefined, rng),
        trace = r.rareMonster!;
      assert.ok(trace.hp >= 2 && trace.hp <= 20);
      assert.equal(
        new Set(trace.cards.map(cardIdentity)).size,
        trace.cards.length,
      );
      for (const c of trace.components) {
        assert.ok(c.text);
        assert.ok(
          ['SOURCE_VERBATIM', 'APP_DERIVED'].includes(c.classification),
        );
        const t = registry.tables.find((t) => t.id === c.source.tableId);
        assert.ok(t?.entries.some((e) => e.id === c.source.entryId));
        assert.ok(c.cards.every((k) => trace.cards[k - 1]));
      }
    }
  },
);
check(
  'Private data failure disables new card/Encounter Level procedures without fallback content',
  () => {
    const absent = buildOracleRegistry(null, null);
    assert.throws(() => drawRareMonster(absent), /SOURCE DATA UNAVAILABLE/);
    assert.throws(
      () => checkEncounterLevel(absent, 'sarkash'),
      /SOURCE DATA UNAVAILABLE/,
    );
  },
);
check(
  'The two automated Depths procedures document their conditional steps and authority',
  () => {
    for (const p of DEPTHS_GENERATOR_PROCEDURES) {
      assert.equal(p.authority, 'SOURCE_PROCEDURE');
      assert.ok(p.sourceRefs.every((s) => s.bookId === 'depths' && s.pdfPage));
      for (const s of p.steps) {
        if (s.tableId)
          assert.ok(registry.tables.some((t) => t.id === s.tableId));
        assert.ok(s.count > 0);
        for (const dependency of s.dependsOn ?? [])
          assert.ok(
            p.steps.findIndex((step) => step.id === dependency) <
              p.steps.indexOf(s),
          );
      }
    }
  },
);
check(
  'All twelve blackpowder names resolve exactly with damage, reload, ammunition and price',
  () => {
    const expected: Record<string, string> = {
      Pistolet: 'd6',
      Culverin: 'd8',
      Arquebus: 'd10',
      Dragon: '2d4',
      'Basilisk Gun': '2d10',
      Blunderbuss: '2d6',
      'Heavy Arquebus': 'd12',
      'Pepperbox Pistolet': 'd4',
      'Blackpowder Bomb': '3d4',
      Ribauldequin: '6d6',
      Cannon: '4d10',
      Ammunition: '10 powdershots 50s',
    };
    for (const [name, mechanic] of Object.entries(expected)) {
      const e = top(name);
      assert.ok(e.id.startsWith('definition:heretic.blackpowder:'), name);
      assert.ok(e.summary.includes(mechanic), name);
      assert.equal(e.sourceRefs[0].pdfPage, 46);
      assert.equal(e.sourceRefs[0].printedPage, 44);
    }
    for (const term of [
      'DR14',
      'Ignores armor',
      'd6+2 rounds',
      'Cannot reload',
      'notice and investigate',
    ])
      assert.ok(rule('heretic.blackpowder').summary.includes(term));
    assert.match(
      top('Ribauldequin').summary,
      /9 shots[\s\S]+targets or 3[\s\S]+Round up[\s\S]+d4\+3/,
    );
    assert.match(top('Cannon').summary, /d8 damage[\s\S]+d4\+1/);
  },
);
check(
  'Alöne Gunsmith is a primary lookup with a one-step canonical HERETIC cross-link',
  () => {
    const g = entry('definition:aitc.businesses:11-11');
    assert.equal(g.sourceRefs[0].bookId, 'aitc');
    assert.ok(g.relatedIds.includes('rule:heretic.blackpowder'));
    assert.ok(
      referenceTextSegments(index.entries, 'Gunsmith').some(
        (s) => s.id === g.id,
      ),
    );
    const row = registry.tables
      .find((t) => t.id === 'aitc.businesses')!
      .entries.find((e) => e.metadata?.title === 'Gunsmith')!;
    assert.ok(
      oracleFollowUpLinks(row.metadata).relatedIds!.includes(
        'rule:heretic.blackpowder',
      ),
    );
  },
);
check(
  'Carcasswan variants retain different HP/attack and no generic invented primary stats',
  () => {
    const p = top('Carcasswan'),
      r = run(p.id);
    assert.equal(r.childReferenceIds?.length, 2);
    assert.doesNotMatch(
      r.blocks.map((b) => b.text).join(''),
      /SOURCE UNAVAILABLE|HP 5|HP 15/,
    );
    const lone = run(r.childReferenceIds![0]),
      pair = run(r.childReferenceIds![1]);
    assert.match(lone.blocks[0].text, /HP 15/);
    assert.match(lone.blocks[0].text, /d8/);
    assert.match(pair.blocks[0].text, /HP 5/);
    assert.match(pair.blocks[0].text, /d6/);
  },
);
check(
  'Lentil Lice and Überwolf do not inherit their participant or companion stats',
  () => {
    const lice = top('Lentil Lice'),
      parent = findReferenceCreature(rules, lice.id)!;
    assert.equal(parent.hp, null);
    const peasants = run(run(lice.id).childReferenceIds![0]);
    assert.match(peasants.blocks[0].text, /HP 4/);
    assert.match(peasants.blocks[0].text, /Morale 7/);
    assert.match(peasants.blocks[0].text, /Knife\/Femur d4/);
    const wolf = run(top('Überwolf').id);
    assert.match(wolf.blocks[0].text, /HP 18/);
    const companion = run(wolf.childReferenceIds![0]);
    assert.match(companion.blocks[0].text, /HP 6/);
    assert.match(companion.blocks[0].text, /Morale 8/);
  },
);
check(
  'Rotten Nurse stays special-rule-only and Mikhael exposes the actual outcast statblock',
  () => {
    const nurse = run(top('Rotten Nurse').id);
    assert.match(
      nurse.blocks[0].text,
      /Presence DR14[\s\S]+below −3 means death/,
    );
    assert.doesNotMatch(nurse.blocks[0].text, /HP|SOURCE UNAVAILABLE/);
    const mikhael = run(top('Mikhael').id);
    assert.match(
      mikhael.blocks[0].text,
      /HP 6[\s\S]+Morale 9[\s\S]+Staff d4[\s\S]+d4 days/,
    );
  },
);
check(
  'Mythic Event Focus sends NPC/Thread results to Lists, not an unrelated automatic NPC generator',
  () => {
    const t = registry.tables.find(
      (t) => t.id === 'mythic2.random-event-focus-table',
    )!;
    for (const min of [21, 41, 46, 51, 56, 66])
      assert.deepEqual(
        oracleFollowUpLinks(t.entries.find((e) => e.min === min)!.metadata)
          .relatedIds,
        ['rule:mythic.lists'],
      );
    assert.match(
      rule('mythic.lists').summary,
      /6–10: d4; 11–15: d6; 16–20: d8; 21–25: d10/,
    );
    assert.match(rule('mythic.lists').summary, /Blank line means Choose/);
    assert.match(
      rule('mythic.lists').summary,
      /entirely empty[\s\S]+Current Context/,
    );
  },
);
check(
  'Mythic altered scenes preserve recursive-adjustment handling and NPC events fix Current Context',
  () => {
    assert.match(
      rule('mythic.altered-scene').summary,
      /Ignore and reroll further 7–10/,
    );
    assert.match(rule('mythic.altered-scene').summary, /ignore the second/);
    const npc = rule('mythic.npc-behavior');
    assert.match(npc.summary, /Fix Event Focus to Current Context/);
    assert.match(npc.summary, /Fate answer first and Event second/);
    assert.doesNotMatch(npc.summary, /automatically roll/);
  },
);
check(
  'New TABLE views contain usable blocks; source metadata remains independent of summaries',
  () => {
    for (const t of registry.tables.filter((t) => t.tags.includes('batch-2')))
      for (const e of t.entries.filter((e) => e.metadata?.blocks))
        assert.ok(tableEntryNotes(e).some((v) => v.length > 15));
    const copy = copyReferenceReading(
      drawRareMonster(registry, undefined, () => 0.5),
      true,
    );
    assert.doesNotMatch(
      copy,
      /datasetVersion|entryId|remaining|APP_DERIVED|depths\.rare/,
    );
    assert.match(copy, /PDF/);
  },
);
check(
  'Building reference links never mutates canonical source metadata or its fingerprints',
  () => {
    const before = registry.tables.map(oracleSourceFingerprint);
    buildReferenceRegistry(registry, rules);
    buildReferenceRegistry(registry, rules);
    assert.deepEqual(registry.tables.map(oracleSourceFingerprint), before);
  },
);
check(
  'All Batch 2 source IDs and relationships resolve; UNSOURCED remains zero',
  () => {
    assert.deepEqual(unresolvedOracleSources(registry), []);
    assert.equal(
      validateOracleRegistry(registry).filter((i) => i.severity === 'error')
        .length,
      0,
    );
    assert.deepEqual(
      unresolvedReferenceDefinitions(
        index.entries.flatMap((e) => (e.definition ? [e.definition] : [])),
        registry,
      ),
      [],
    );
    for (const t of registry.tables.filter((t) => t.tags.includes('batch-2')))
      for (const e of t.entries)
        for (const id of (e.metadata?.relatedIds as string[]) ?? [])
          assert.ok(index.byId[id], `${e.id} → ${id}`);
  },
);

check(
  'Exactly five remaining cards are usable unless the source requires card six',
  () => {
    const five: PlayingCard[] = [
      { rank: 'A', suit: '♣' },
      { rank: '2', suit: '♥' },
      { rank: '3', suit: '♦' },
      { rank: '4', suit: '♣' },
      { rank: '5', suit: '♦' },
    ];
    assert.equal(
      drawRareMonster(registry, five).rareMonster!.remaining.length,
      0,
    );
    const branch: PlayingCard[] = [
      { rank: 'A', suit: '♣' },
      { rank: '2', suit: '♥' },
      { rank: '3', suit: '♠' },
      { rank: '4', suit: '♠' },
      { rank: '5', suit: '♦' },
    ];
    assert.throws(() => drawRareMonster(registry, branch), /후속 카드가 부족/);
    assert.equal(branch.length, 5);
  },
);
check(
  'Generated FERETORY results retain their canonical variant and participant links',
  () => {
    const ids = new Set<string>();
    for (const region of regions)
      for (let n = 0; n < 6; n++) {
        const result = executeReference(entry('procedure:workbench.epk'), {
          registry,
          rules,
          region: region.id,
          stockKind: 'common',
          stockDR: 10,
          cityLarge: false,
          cityExits: true,
          rng: () => (n + 0.5) / 6,
        })!;
        for (const child of result.childReferenceIds ?? []) {
          assert.ok(index.byId[child]);
          ids.add(child);
        }
      }
    for (const referenceId of [
      'rule:regional-monsters:lake_onda',
      'rule:regional-monsters:bergen_chrypt',
    ])
      for (let n = 0; n < 6; n++) {
        const result = run(referenceId, () => (n + 0.5) / 6);
        for (const child of result.childReferenceIds ?? []) {
          assert.ok(index.byId[child]);
          ids.add(child);
        }
      }
    assert.deepEqual(
      [...ids],
      ['creature:feretory:feretory.epk.lentil-lice.participants.1'],
    );
    assert.deepEqual(
      run('rule:regional-monsters:bergen_chrypt', () => 0).childReferenceIds,
      [],
    );
  },
);
