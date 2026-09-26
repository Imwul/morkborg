import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actingSide,
  applyAttack,
  changeAttackOmen,
  changeCombat,
  combatFormula,
  combatFrame,
  initiativeSide,
  newCombatant,
  newCombatSession,
  parseCombatSession,
  prepareAttack,
  rerollAttackDie,
  resolveCombatMorale,
  secondCombatSide,
  seekCombat,
  startCombatRound,
  type AttackRequest,
} from '../src/domain/combatTool.ts';

const noRng = () => {
  throw new Error('Manual operation must not roll');
};
function fixture() {
  const pc = {
    ...newCombatant('pc', 1),
    id: 'pc',
    name: 'Test PC',
    hp: 12,
    maxHp: 12,
    strength: 2,
    agility: 1,
    presence: 3,
    omens: 5,
    weapon: 'd6',
    armor: 'd4',
    armorTier: 2,
    defencePenalty: 2,
  };
  const enemy = {
    ...newCombatant('enemy', 1),
    id: 'enemy',
    name: 'Test enemy',
    hp: 10,
    maxHp: 10,
    weapon: 'd8',
    armor: 'd2',
    armorTier: 1,
  };
  const session = changeCombat(newCombatSession(), 'Fixture roster', (f) => {
    f.fighters = [pc, enemy];
  });
  const request: AttackRequest = {
    attackerId: pc.id,
    targetId: enemy.id,
    style: 'melee',
    dr: 12,
    bonus: 0,
    mode: 'manual',
    dice: { test: '14', damage: '5', armor: '1', reduction: '3' },
    omen: 'none',
    omenOwnerId: pc.id,
    breakShield: false,
    ignoreArmor: false,
    damageOverride: null,
  };
  return { session, frame: combatFrame(session), pc, enemy, request };
}

test('Omen effects after seeing a result preserve dice, reroll costs and the unapplied state', () => {
  const { session, frame, request } = fixture();
  const original = prepareAttack(
    frame,
    { ...request, dice: { ...request.dice, test: '20' } },
    noRng,
  );
  const rerolled = rerollAttackDie(frame, original, 'armor', 'pc', '2', noRng);
  const neutralized = changeAttackOmen(
    frame,
    rerolled,
    'neutralize',
    'pc',
    undefined,
    noRng,
  );
  assert.equal(neutralized.critical, false);
  assert.deepEqual(
    neutralized.dice.map((d) => d.values),
    [[20], [5], [2]],
  );
  assert.equal(neutralized.omenCosts.pc, 2);
  assert.equal(combatFrame(session).fighters[0].omens, 5);
  assert.equal(
    combatFrame(applyAttack(session, neutralized)).fighters[0].omens,
    3,
  );
  const maximum = changeAttackOmen(
    frame,
    neutralized,
    'maximum',
    'pc',
    undefined,
    noRng,
  );
  assert.equal(maximum.damage, 4);
  assert.equal(maximum.omenCosts.pc, 2);
  assert.equal(maximum.dice[0].total, 20);
  assert.equal(maximum.dice[2].total, 2);
  assert.throws(
    () => changeAttackOmen({ ...frame, round: 9 }, neutralized, 'none', 'pc'),
    /바뀌었습니다/,
  );
});
test('Combat formula accepts bounded dice and fixed damage without evaluating expressions', () => {
  assert.deepEqual(combatFormula(' 2D4 + 1 '), {
    notation: '2d4+1',
    count: 2,
    sides: 4,
    modifier: 1,
  });
  assert.deepEqual(combatFormula('3'), {
    notation: '3',
    count: 0,
    sides: 0,
    modifier: 3,
  });
  assert.equal(combatFormula('d6−1').modifier, -1);
  for (const formula of [
    '0d6',
    '21d6',
    'd0',
    'd1',
    'd1001',
    'Infinity',
    '1+2',
    'd6;alert(1)',
    'd6foo',
    '-d4',
    '',
  ])
    assert.throws(() => combatFormula(formula), formula);
});
test('PC melee and ranged use the chosen ability, while monster attacks only roll PC defence', () => {
  const { frame, request } = fixture();
  assert.equal(prepareAttack(frame, request, noRng).total, 16);
  assert.equal(
    prepareAttack(frame, { ...request, style: 'ranged' }, noRng).total,
    17,
  );
  frame.fighters[1].strength = 90;
  const defence = prepareAttack(
    frame,
    {
      ...request,
      attackerId: 'enemy',
      targetId: 'pc',
      dice: { test: '12', damage: '8', armor: '2' },
    },
    noRng,
  );
  assert.equal(defence.total, 13);
  assert.equal(defence.dr, 14);
  assert.equal(defence.hit, true);
  assert.equal(defence.damage, 6);
});
test('Misses require no damage dice; successful defence never rolls enemy damage', () => {
  const { frame, request } = fixture();
  assert.equal(
    prepareAttack(frame, { ...request, dice: { test: '2' } }, noRng).dice
      .length,
    1,
  );
  const p = prepareAttack(
    frame,
    { ...request, attackerId: 'enemy', targetId: 'pc', dice: { test: '19' } },
    noRng,
  );
  assert.equal(p.hit, false);
  assert.equal(p.damage, 0);
  assert.equal(p.dice.length, 1);
});
test('Manual dice reject missing, out-of-range, fractional and total-only multi-die input', () => {
  const { frame, request } = fixture();
  for (const testValue of ['', '0', '21', '1.5', '2,3', 'x'])
    assert.throws(() =>
      prepareAttack(
        frame,
        { ...request, dice: { ...request.dice, test: testValue } },
        noRng,
      ),
    );
  frame.fighters[0].weapon = '2d6';
  assert.throws(() => prepareAttack(frame, request, noRng), /2개/);
  assert.throws(() =>
    prepareAttack(
      frame,
      { ...request, dice: { ...request.dice, damage: '2,7' } },
      noRng,
    ),
  );
  assert.equal(
    prepareAttack(
      frame,
      { ...request, dice: { ...request.dice, damage: '2,3' } },
      noRng,
    ).damage,
    4,
  );
});
test('Preview is immutable, and applying once changes HP while preserving participants, gear and notes', () => {
  const { session, frame, request } = fixture();
  const before = JSON.stringify(session);
  const preview = prepareAttack(frame, request, noRng);
  assert.equal(JSON.stringify(session), before);
  const next = applyAttack(session, preview);
  assert.equal(combatFrame(next).fighters[1].hp, 6);
  assert.equal(combatFrame(next).fighters[1].armor, 'd2');
  assert.equal(JSON.stringify(session), before);
  assert.throws(() => applyAttack(next, preview), /바뀌었습니다/);
});
test('Natural 20 attack is a critical notice, without double damage or automatic armor changes', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(
    frame,
    { ...request, dice: { ...request.dice, test: '20' } },
    noRng,
  );
  assert.equal(p.critical, true);
  assert.equal(p.damage, 4);
  const next = combatFrame(applyAttack(session, p));
  assert.equal(next.fighters[1].hp, 6);
  assert.equal(next.fighters[1].armorTier, 1);
  assert.equal(next.fighters[1].armor, 'd2');
  assert.match(next.last, /자동 적용하지 않았습니다/);
});
test('Natural 1 attack warns about the weapon without changing or deleting it', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(frame, { ...request, dice: { test: '1' } }, noRng);
  assert.equal(p.fumble, true);
  assert.equal(p.weaponLost, true);
  assert.equal(p.damage, 0);
  const next = combatFrame(applyAttack(session, p));
  assert.equal(next.fighters[0].weapon, 'd6');
  assert.equal(next.fighters[0].active, true);
  assert.equal(next.fighters[0].notes, '');
});
test('Defence fumble shows its rule without doubling damage or degrading armor', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(
    frame,
    {
      ...request,
      attackerId: 'enemy',
      targetId: 'pc',
      dice: { test: '1', damage: '6', armor: '2' },
    },
    noRng,
  );
  assert.equal(p.fumble, true);
  assert.equal(p.damage, 4);
  const next = combatFrame(applyAttack(session, p));
  assert.equal(next.fighters[0].hp, 8);
  assert.equal(next.fighters[0].armor, 'd4');
  assert.equal(next.fighters[0].defencePenalty, 2);
});
test('Defence critical only offers a free attack; it neither rolls nor applies another attack', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(
    frame,
    { ...request, attackerId: 'enemy', targetId: 'pc', dice: { test: '20' } },
    noRng,
  );
  assert.equal(p.freeAttack, true);
  assert.equal(p.damage, 0);
  assert.equal(p.dice.length, 1);
  const next = combatFrame(applyAttack(session, p));
  assert.deepEqual(next.fighters, frame.fighters);
});
test('Damage is reduced by armor and shield, floors at zero, and HP may become negative', () => {
  const { session, frame, request } = fixture();
  frame.fighters[1].shield = true;
  const p = prepareAttack(
    frame,
    { ...request, dice: { test: '14', damage: '1', armor: '2' } },
    noRng,
  );
  assert.equal(p.damage, 0);
  const lethal = prepareAttack(
    frame,
    { ...request, damageOverride: 15 },
    noRng,
  );
  assert.equal(combatFrame(applyAttack(session, lethal)).fighters[1].hp, -5);
  assert.throws(() =>
    prepareAttack(frame, { ...request, damageOverride: -1 }, noRng),
  );
});
test('Explicit shield sacrifice and custom damage are reversible with the whole action', () => {
  const { session, frame, request } = fixture();
  frame.fighters[1].shield = true;
  const p = prepareAttack(frame, { ...request, breakShield: true }, noRng);
  assert.equal(p.damage, 0);
  const next = applyAttack(session, p);
  assert.equal(combatFrame(next).fighters[1].shield, false);
  assert.equal(
    combatFrame(seekCombat(next, session.cursor)).fighters[1].shield,
    true,
  );
});
test('Omen maximum damage skips the damage roll and is spent only on apply', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(
    frame,
    { ...request, omen: 'maximum', dice: { test: '14', armor: '1' } },
    noRng,
  );
  assert.equal(p.damage, 5);
  assert.equal(p.dice[1].origin, 'maximum');
  assert.equal(frame.fighters[0].omens, 5);
  const next = applyAttack(session, p);
  assert.equal(combatFrame(next).fighters[0].omens, 4);
  assert.equal(
    combatFrame(seekCombat(next, session.cursor)).fighters[0].omens,
    5,
  );
});
test('Omen reduction is limited to its PC recipient and accounts for armor separately', () => {
  const { frame, request } = fixture();
  assert.throws(
    () => prepareAttack(frame, { ...request, omen: 'reduce' }, noRng),
    /피해를 받는/,
  );
  const p = prepareAttack(
    frame,
    {
      ...request,
      omen: 'reduce',
      attackerId: 'enemy',
      targetId: 'pc',
      dice: { test: '5', damage: '8', armor: '2', reduction: '3' },
    },
    noRng,
  );
  assert.equal(p.damage, 3);
});
test('Omen DR reduction and neutralization use ordinary totals without permanent DR edits', () => {
  const { frame, request } = fixture();
  const p = prepareAttack(
    frame,
    { ...request, omen: 'difficulty', dice: { ...request.dice, test: '7' } },
    noRng,
  );
  assert.equal(p.dr, 8);
  assert.equal(p.hit, true);
  assert.equal(request.dr, 12);
  const neutral = prepareAttack(
    frame,
    {
      ...request,
      omen: 'neutralize',
      dr: 3,
      dice: { ...request.dice, test: '1' },
    },
    noRng,
  );
  assert.equal(neutral.fumble, false);
  assert.equal(neutral.weaponLost, false);
  assert.equal(neutral.hit, true);
});
test('Omen reroll preserves other dice, accumulates cost and uses the selected payer', () => {
  const { frame, request } = fixture();
  const p = prepareAttack(frame, { ...request, mode: 'app' }, () => 0.6);
  const next = rerollAttackDie(frame, p, 'damage', 'pc', undefined, () => 0.9);
  assert.equal(next.omenCosts.pc, 1);
  assert.equal(next.dice.find((d) => d.key === 'test')!.total, p.dice[0].total);
  assert.equal(
    next.dice.find((d) => d.key === 'armor')!.total,
    p.dice.find((d) => d.key === 'armor')!.total,
  );
  assert.equal(next.dice.find((d) => d.key === 'damage')!.total, 6);
  const third = rerollAttackDie(frame, next, 'armor', 'pc', undefined, () => 0);
  assert.equal(third.omenCosts.pc, 2);
  assert.equal(frame.fighters[0].omens, 5);
});
test('Manual Omen reroll never substitutes an app die, and unavailable Omens cannot go negative', () => {
  const { frame, request } = fixture();
  const p = prepareAttack(frame, request, noRng);
  assert.throws(
    () => rerollAttackDie(frame, p, 'test', 'pc', '', noRng),
    /실물/,
  );
  const next = rerollAttackDie(frame, p, 'test', 'pc', '15', noRng);
  assert.equal(next.dice[0].total, 15);
  assert.equal(next.omenCosts.pc, 1);
  frame.fighters[0].omens = 0;
  assert.throws(
    () => prepareAttack(frame, { ...request, omen: 'difficulty' }, noRng),
    /부족/,
  );
});
test('Custom dice and DR change the calculation, while a stale preview cannot overwrite those edits', () => {
  const { session, frame, request } = fixture();
  const p = prepareAttack(frame, request, noRng);
  const next = changeCombat(session, 'Magic gear', (f) => {
    f.fighters[0].weapon = '2d4+1';
    f.fighters[1].armor = '3';
  });
  assert.throws(() => applyAttack(next, p), /바뀌었습니다/);
  const custom = prepareAttack(
    combatFrame(next),
    { ...request, dice: { test: '12', damage: '2,3' } },
    noRng,
  );
  assert.equal(custom.damage, 3);
});
test('Round and side checkpoints restore notes, roster, HP, Omens and gear without rerolling', () => {
  const { session, request } = fixture();
  let s = startCombatRound(session, 'pc', 6);
  const first = s.cursor,
    firstFrame = structuredClone(combatFrame(s));
  s = applyAttack(
    s,
    prepareAttack(combatFrame(s), { ...request, omen: 'maximum' }, noRng),
  );
  s = changeCombat(s, 'Spell and notes', (f) => {
    f.fighters[0].notes = 'Enchanted';
    f.fighters[0].armor = 'd8';
    f.fighters.push(newCombatant('enemy', 2));
  });
  s = secondCombatSide(s);
  const second = s.cursor,
    secondFrame = structuredClone(combatFrame(s));
  assert.equal(actingSide(secondFrame), 'enemy');
  s = changeCombat(s, 'Wounded', (f) => {
    f.fighters[0].hp = 2;
  });
  s = startCombatRound(s, 'enemy', 2);
  assert.equal(combatFrame(s).round, 2);
  assert.deepEqual(combatFrame(seekCombat(s, first)), firstFrame);
  assert.deepEqual(combatFrame(seekCombat(s, second)), secondFrame);
  assert.equal(actingSide(combatFrame(s)), 'enemy');
});
test('Undo, redo and branching preserve old snapshots until a new action replaces the future', () => {
  const { session } = fixture();
  const edited = changeCombat(session, 'HP edit', (f) => {
    f.fighters[0].hp = 3;
  });
  const undone = seekCombat(edited, session.cursor);
  assert.equal(combatFrame(undone).fighters[0].hp, 12);
  assert.equal(
    combatFrame(seekCombat(undone, edited.cursor)).fighters[0].hp,
    3,
  );
  const branch = changeCombat(undone, 'Different edit', (f) => {
    f.fighters[0].notes = 'New route';
  });
  assert.equal(branch.moments.length, edited.moments.length);
  assert.equal(combatFrame(branch).fighters[0].hp, 12);
  assert.equal(combatFrame(edited).fighters[0].hp, 3);
});
test('Morale failure is strictly greater, uses its own outcome die and is fully reversible', () => {
  const { session, frame } = fixture();
  const held = resolveCombatMorale(session, 'enemy', '3,4', undefined, noRng);
  assert.equal(combatFrame(held).fighters[1].active, true);
  const fled = resolveCombatMorale(session, 'enemy', '6,6', '3', noRng);
  assert.equal(combatFrame(fled).fighters[1].active, false);
  assert.match(combatFrame(fled).fighters[1].notes, /도주/);
  assert.deepEqual(combatFrame(seekCombat(fled, session.cursor)), frame);
  const surrender = resolveCombatMorale(session, 'enemy', '6,6', '4', noRng);
  assert.match(combatFrame(surrender).fighters[1].notes, /항복/);
  assert.throws(() => resolveCombatMorale(session, 'enemy', '12', '4', noRng));
  assert.throws(
    () => resolveCombatMorale(session, 'pc', '3,4', undefined, noRng),
    /사기/,
  );
});
test('Session round-trip includes the full undo/redo path and rejects malformed data', () => {
  const { session } = fixture();
  const s = secondCombatSide(startCombatRound(session, 'enemy', 2));
  assert.deepEqual(parseCombatSession(JSON.stringify(s)), s);
  assert.deepEqual(
    parseCombatSession(JSON.stringify(seekCombat(s, 1))),
    seekCombat(s, 1),
  );
  for (const raw of [
    '{}',
    'null',
    '{',
    JSON.stringify({ ...s, cursor: 999 }),
    JSON.stringify({ ...s, version: 2 }),
  ])
    assert.throws(() => parseCombatSession(raw));
  const bad = structuredClone(s);
  bad.moments[1].frame.fighters[0].weapon = 'd0';
  assert.throws(() => parseCombatSession(JSON.stringify(bad)));
});
test('Initiative range, missing roster, duplicate participants and invalid edits are rejected atomically', () => {
  assert.equal(initiativeSide(3), 'enemy');
  assert.equal(initiativeSide(4), 'pc');
  assert.throws(() => initiativeSide(0));
  assert.throws(() => initiativeSide(7));
  assert.throws(() => startCombatRound(newCombatSession(), 'pc'), /追加|추가/);
  const { session } = fixture();
  const before = JSON.stringify(session);
  assert.throws(
    () =>
      changeCombat(session, 'Duplicate', (f) => f.fighters.push(f.fighters[0])),
    /중복/,
  );
  assert.throws(() =>
    changeCombat(session, 'Bad HP', (f) => {
      f.fighters[0].hp = NaN;
    }),
  );
  assert.equal(JSON.stringify(session), before);
});
