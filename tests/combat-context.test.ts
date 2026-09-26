import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  findReferenceCreature,
} from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  creatureCombatant,
  addCreatureToCombat,
  creatureArmor,
  creatureDamage,
} from '../src/domain/combatCreature.ts';
import {
  combatRelevantReferences,
  COMBAT_RULE_SHORTCUTS,
} from '../src/domain/combatContext.ts';
import {
  combatSelection,
  attackSettingsFor,
} from '../src/domain/combatSelection.ts';
import {
  startCombatRound,
  newCombatant,
  newCombatSession,
  changeCombat,
  combatFrame,
  prepareAttack,
  applyAttack,
  changeAttackOmen,
  resolveCombatMorale,
  seekCombat,
  parseCombatSession,
  type AttackRequest,
} from '../src/domain/combatTool.ts';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const registry = buildOracleRegistry(getRules(), getOraclePack()),
  index = buildReferenceRegistry(registry, getRules());
const source = getRules()!;
const seth = index.entries.find(
  (e) => e.kind === 'creature' && e.title.startsWith('Seth'),
)!;
const belze = index.entries.find(
  (e) => e.kind === 'creature' && e.title.startsWith('Belze'),
)!;
const hash = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const noRng = () => {
  throw new Error('This operation must not roll');
};
function fixture() {
  const pc = {
    ...newCombatant('pc', 1),
    id: 'pc',
    hp: 12,
    maxHp: 12,
    omens: 3,
  };
  const enemy = { ...newCombatant('enemy', 1), id: 'enemy', hp: 9, maxHp: 9 };
  const session = changeCombat(newCombatSession(), 'Fixture', (f) => {
    f.fighters = [pc, enemy];
  });
  const request: AttackRequest = {
    attackerId: 'pc',
    targetId: 'enemy',
    style: 'melee',
    dr: 12,
    bonus: 0,
    mode: 'manual',
    dice: { test: '14', damage: '4' },
    omen: 'none',
    omenOwnerId: 'pc',
    breakShield: false,
    ignoreArmor: false,
    damageOverride: null,
  };
  return { session, frame: combatFrame(session), request };
}
const relevant = (
  frame: ReturnType<typeof combatFrame>,
  p: ReturnType<typeof prepareAttack> | null = null,
) => combatRelevantReferences(frame, p, index.byId);

test('No relevant combat condition produces no suggestions; every local mapping resolves', () => {
  assert.deepEqual(relevant(fixture().frame), []);
  for (const id of Object.values(COMBAT_RULE_SHORTCUTS))
    assert.equal(index.byId[id]?.available, true, id);
});
test('PC HP zero and below expose the existing Broken rule once, never roll it', () => {
  const { frame } = fixture();
  frame.fighters[0].hp = 0;
  frame.fighters.push({ ...frame.fighters[0], id: 'pc2', hp: -2 });
  assert.deepEqual(
    relevant(frame).map((r) => r.id),
    ['rule:core.broken'],
  );
  assert.equal(frame.fighters[0].hp, 0);
});
for (const defence of [false, true])
  for (const natural of [20, 1])
    test(`${defence ? 'Defence' : 'Attack'} natural ${natural} offers only its existing crit/fumble rule`, () => {
      const { frame, request } = fixture();
      const p = prepareAttack(
        frame,
        {
          ...request,
          attackerId: defence ? 'enemy' : 'pc',
          targetId: defence ? 'pc' : 'enemy',
          dice: { test: String(natural), damage: '4' },
        },
        noRng,
      );
      const r = relevant(frame, p);
      assert.equal(r.length, 1);
      assert.equal(r[0].id, 'rule:core.crit-fumble');
      assert.match(r[0].label, defence ? /방어/ : /공격/);
      assert.equal(frame.fighters[1].hp, 9);
    });
test('Omen neutralization removes the critical shortcut; applied context survives snapshots and Undo/Redo', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(
    frame,
    { ...request, dice: { test: '20', damage: '4' } },
    noRng,
  );
  const neutral = changeAttackOmen(
    frame,
    p,
    'neutralize',
    'pc',
    undefined,
    noRng,
  );
  assert.deepEqual(relevant(frame, neutral), []);
  const applied = applyAttack(session, p);
  assert.ok(
    relevant(combatFrame(applied)).some(
      (r) => r.id === 'rule:core.crit-fumble',
    ),
  );
  assert.deepEqual(
    relevant(combatFrame(seekCombat(applied, session.cursor))),
    [],
  );
  assert.deepEqual(parseCombatSession(JSON.stringify(applied)), applied);
  assert.deepEqual(relevant(combatFrame(startCombatRound(applied, 'pc'))), []);
});
test('Morale hints require source conditions and a known morale; leadership is never inferred from notes', () => {
  const { frame } = fixture();
  frame.fighters[1].notes = 'leader killed surrender';
  assert.deepEqual(relevant(frame), []);
  frame.fighters[1].hp = 3;
  assert.equal(relevant(frame)[0]?.id, 'rule:core.reaction-morale');
  frame.fighters[1].morale = null;
  assert.deepEqual(relevant(frame), []);
  frame.fighters[1].morale = 7;
  frame.fighters[1].hp = 9;
  frame.fighters.push({ ...frame.fighters[1], id: 'enemy2', hp: 0 });
  assert.equal(relevant(frame)[0]?.id, 'rule:core.reaction-morale');
  frame.fighters[2].hp = 9;
  frame.fighters[2].active = false;
  assert.deepEqual(relevant(frame), []);
});
test('Enemy defeat only offers corpse/loot along existing imported creature edges', () => {
  const { frame } = fixture();
  frame.fighters[1].hp = 0;
  assert.deepEqual(relevant(frame), []);
  frame.fighters[1].sourceReferenceId = seth.id;
  assert.deepEqual(
    relevant(frame).map((r) => r.id),
    ['oracle:core.corpsePlundering', 'oracle:core.treasures'],
  );
  const refs = { ...index.byId, [seth.id]: { ...seth, relatedIds: [] } };
  assert.deepEqual(combatRelevantReferences(frame, null, refs), []);
  frame.fighters[1].hp = 2;
  frame.fighters[1].active = false;
  assert.deepEqual(relevant(frame), []);
});
test('Explicit Morale flee/surrender offers its source, not a loot or PC escape workflow', () => {
  for (const outcome of ['2', '5']) {
    const { session } = fixture();
    const next = resolveCombatMorale(session, 'enemy', '6,6', outcome, noRng);
    assert.deepEqual(
      relevant(combatFrame(next)).map((r) => r.id),
      ['rule:core.reaction-morale'],
    );
    assert.equal(combatFrame(next).fighters[1].active, false);
  }
});
test('Duplicate relevant references collapse and the list is capped at three without mutating session', () => {
  const { session, frame, request } = fixture();
  frame.fighters[0].hp = 0;
  frame.fighters.push(
    { ...frame.fighters[1], id: 'dead1', hp: 0, sourceReferenceId: seth.id },
    { ...frame.fighters[1], id: 'dead2', hp: 0, sourceReferenceId: seth.id },
  );
  const p = prepareAttack(
    frame,
    { ...request, dice: { test: '20', damage: '4' } },
    noRng,
  );
  const before = JSON.stringify(session);
  const refs = relevant(frame, p);
  assert.equal(refs.length, 3);
  assert.equal(new Set(refs.map((r) => r.id)).size, 3);
  assert.equal(JSON.stringify(session), before);
});
test('Unavailable source targets are never offered', () => {
  const { frame } = fixture();
  frame.fighters[0].hp = 0;
  assert.deepEqual(
    combatRelevantReferences(frame, null, {
      ...index.byId,
      'rule:core.broken': {
        ...index.byId['rule:core.broken'],
        available: false,
      },
    }),
    [],
  );
});
test('Creature handoff copies only structured fields to an independent enemy snapshot', () => {
  const before = hash(source);
  const f = creatureCombatant(seth, source);
  assert.equal(f.name, 'Seth');
  assert.equal(f.hp, 6);
  assert.equal(f.maxHp, 6);
  assert.equal(f.morale, 7);
  assert.equal(f.armor, 'd2');
  assert.equal(f.weapon, 'd4');
  assert.equal(f.weaponName, 'Knife/shortbow');
  assert.equal(f.strength, null);
  assert.equal(f.defencePenalty, null);
  assert.equal(f.notes, '');
  assert.equal(f.sourceReferenceId, seth.id);
  assert.equal(hash(source), before);
});
test('Missing or malformed optional fields remain empty, even with numeric claims in prose', () => {
  const altered = structuredClone(source);
  const record = findReferenceCreature(altered, seth.id)!;
  Object.assign(record, {
    morale: '7',
    armor: { text: 'd6' },
    damage: null,
    attack: [],
    strength: NaN,
    omens: -1,
    specialAbility: 'HP 99. Armor d6. STR +5. DR 10.',
  });
  const f = creatureCombatant(seth, altered);
  assert.equal(f.morale, null);
  assert.equal(f.armor, '');
  assert.equal(f.weapon, '');
  assert.equal(f.weaponName, '');
  assert.equal(f.strength, null);
  assert.equal(f.omens, null);
  assert.equal(f.hp, 6);
});
test('References without an independent statblock import blank stats instead of generator defaults', () => {
  const entry = index.entries.find(
    (e) =>
      e.kind === 'creature' &&
      e.available &&
      findReferenceCreature(source, e.id)?.hp === null,
  )!;
  assert.ok(entry);
  const f = creatureCombatant(entry, source);
  assert.equal(f.hp, null);
  assert.equal(f.maxHp, null);
  const next = addCreatureToCombat(newCombatSession(), entry, source);
  assert.deepEqual(parseCombatSession(JSON.stringify(next)), next);
});
test('Only complete arithmetic stat fields normalize; conditional or compound effects remain blank', () => {
  assert.equal(creatureArmor('Ropy skin -d2'), 'd2');
  assert.equal(creatureArmor('No armor'), '0');
  assert.equal(creatureArmor('Leather −d2'), 'd2');
  assert.equal(creatureArmor('Exoskeleton -d2 (50%)'), '');
  assert.equal(creatureArmor('Armor is d6 in darkness'), '');
  assert.equal(creatureDamage('1 damage'), '1');
  assert.equal(creatureDamage('d4+1'), 'd4+1');
  for (const value of [
    'd4 + special',
    'd6 or d8',
    'd4; d2 with bony knuckles',
    'special',
    {},
    null,
  ])
    assert.equal(creatureDamage(value), '');
});
test('Multiple explicit attack options stay selectable without rolling or picking a weapon', () => {
  const f = creatureCombatant(belze, source);
  assert.equal(f.weapons?.length, 3);
  assert.equal(f.weapon, '');
  assert.equal(f.weaponName, '');
  assert.deepEqual(
    f.weapons?.map((w) => w.damage),
    ['d4', 'd4', 'd2'],
  );
  const another = creatureCombatant(belze, source);
  f.weapons![0].damage = 'd20';
  assert.equal(another.weapons![0].damage, 'd4');
});
test('Same Creature can be added twice; HP edits never mutate either source or the other copy', () => {
  const before = hash(source);
  let s = addCreatureToCombat(newCombatSession(), seth, source);
  s = addCreatureToCombat(s, seth, source);
  const [one, two] = combatFrame(s).fighters;
  assert.notEqual(one.id, two.id);
  s = changeCombat(s, 'Damage', (f) => {
    f.fighters[0].hp = 1;
    f.fighters[0].weapon = '2d8';
  });
  assert.equal(combatFrame(s).fighters[1].hp, 6);
  assert.equal(hash(source), before);
});
test('Creature addition is a normal undoable snapshot and preserves earlier frames and branches', () => {
  const s = newCombatSession(),
    added = addCreatureToCombat(s, seth, source);
  assert.equal(combatFrame(s).fighters.length, 0);
  const undo = seekCombat(added, s.cursor);
  assert.equal(combatFrame(undo).fighters.length, 0);
  assert.equal(
    combatFrame(seekCombat(undo, added.cursor)).fighters[0].name,
    'Seth',
  );
  assert.deepEqual(parseCombatSession(JSON.stringify(added)), added);
  assert.throws(() =>
    addCreatureToCombat(s, { ...seth, available: false }, source),
  );
});
test('Unknown combat values stay editable but cannot silently become zero in a required calculation', () => {
  const { frame, request } = fixture();
  frame.fighters[1].hp = null;
  assert.throws(() => prepareAttack(frame, request, noRng), /현재 HP/);
  frame.fighters[1].hp = 9;
  frame.fighters[1].armor = '';
  assert.throws(() => prepareAttack(frame, request, noRng), /방어구/);
  frame.fighters[1].armor = '0';
  frame.fighters[0].strength = null;
  assert.throws(() => prepareAttack(frame, request, noRng), /Strength/);
});
test('Valid repeated selections are retained; removed/inactive/same-side targets never switch automatically', () => {
  const { frame } = fixture();
  frame.fighters.push({ ...frame.fighters[1], id: 'enemy2' });
  assert.equal(combatSelection(frame, 'pc', 'enemy').target?.id, 'enemy');
  frame.fighters[1].active = false;
  assert.equal(combatSelection(frame, 'pc', 'enemy').target, undefined);
  frame.fighters.splice(1, 1);
  assert.equal(combatSelection(frame, 'pc', 'enemy').target, undefined);
  assert.equal(combatSelection(frame, 'pc', 'pc').target, undefined);
  assert.equal(combatSelection(frame, 'missing', 'enemy2').attacker, undefined);
  assert.equal(combatSelection(frame, 'pc', '').target, undefined);
});
test('Per-attacker settings remember target, style and DR without leaking them to a new attacker', () => {
  const profiles = {
    pc: { targetId: 'enemy', style: 'ranged' as const, dr: '14', bonus: '2' },
  };
  assert.deepEqual(attackSettingsFor(profiles, 'pc'), profiles.pc);
  assert.deepEqual(attackSettingsFor(profiles, 'enemy'), {
    targetId: '',
    style: 'melee',
    dr: '12',
    bonus: '0',
  });
  const returned = attackSettingsFor(profiles, 'pc');
  returned.dr = '8';
  assert.equal(profiles.pc.dr, '14');
});
test('Weapon mutations, imported additions, and inactive targets all invalidate an existing preview', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(frame, request, noRng);
  for (const mutate of [
    (f: typeof frame) => {
      f.fighters[0].weapon = 'd8';
    },
    (f: typeof frame) => {
      f.fighters[1].active = false;
    },
  ])
    assert.throws(
      () => applyAttack(changeCombat(session, 'Mutation', mutate), p),
      /바뀌었습니다/,
    );
  assert.throws(
    () => applyAttack(addCreatureToCombat(session, seth, source), p),
    /바뀌었습니다/,
  );
});
test('Existing v1 sessions without contextual fields still load, malformed new metadata is rejected', () => {
  const { session } = fixture();
  assert.deepEqual(parseCombatSession(JSON.stringify(session)), session);
  const bad = structuredClone(session);
  (combatFrame(bad) as unknown as { event: unknown }).event = {
    kind: 'attack',
    natural: 99,
  };
  assert.throws(() => parseCombatSession(JSON.stringify(bad)));
});
test('All canonical data and relationship counts remain unchanged after every creature import and context projection', () => {
  const before = hash(source),
    oracleBefore = hash(registry),
    refsBefore = hash(index);
  for (const e of index.entries.filter(
    (e) => e.kind === 'creature' && e.available,
  )) {
    const f = creatureCombatant(e, source);
    const { frame } = fixture();
    frame.fighters.push({ ...f, hp: 0 });
    relevant(frame);
  }
  assert.equal(hash(source), before);
  assert.equal(hash(registry), oracleBefore);
  assert.equal(hash(index), refsBefore);
  assert.deepEqual(
    [
      registry.tables.length,
      registry.procedures.length,
      index.entries.length,
      source.creatures.length,
      index.entries.filter((e) => e.kind === 'creature').length,
    ],
    [546, 60, 993, 89, 95],
  );
});

test('Missing imported calculation fields reject before consuming any app dice', () => {
  for (const field of ['hp', 'armor', 'strength', 'weapon'] as const) {
    const { frame, request } = fixture();
    if (field === 'hp') frame.fighters[1].hp = null;
    if (field === 'armor') frame.fighters[1].armor = '';
    if (field === 'strength') frame.fighters[0].strength = null;
    if (field === 'weapon') frame.fighters[0].weapon = '';
    let calls = 0;
    assert.throws(() =>
      prepareAttack(frame, { ...request, mode: 'app', dice: {} }, () => {
        calls++;
        return 0.5;
      }),
    );
    assert.equal(calls, 0, field);
  }
});

test('Printed numeric moraleDisplay is a structured value; a dash remains unknown', () => {
  const entry = index.entries.find(
    (e) => e.kind === 'creature' && e.title.startsWith('Mulch-Squirrels'),
  )!;
  assert.ok(entry);
  assert.equal(creatureCombatant(entry, source).morale, 3);
  const altered = structuredClone(source);
  findReferenceCreature(altered, entry.id)!.moraleDisplay = '—';
  assert.equal(creatureCombatant(entry, altered).morale, null);
});
