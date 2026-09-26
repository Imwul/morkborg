import { id, rollDie, type RandomSource } from '../generators/random';

export type CombatSide = 'pc' | 'enemy';
export interface Combatant {
  id: string;
  name: string;
  side: CombatSide;
  hp: number;
  maxHp: number;
  strength: number;
  agility: number;
  presence: number;
  morale: number | null;
  omens: number;
  weaponName: string;
  weapon: string;
  armor: string;
  armorTier: number | null;
  defencePenalty: number;
  shield: boolean;
  active: boolean;
  notes: string;
}
export interface CombatFrame {
  fighters: Combatant[];
  round: number;
  phase: 'setup' | 'first' | 'second';
  first: CombatSide;
  last: string;
}
export interface CombatMoment {
  id: string;
  label: string;
  checkpoint?: string;
  frame: CombatFrame;
}
/** A single encounter's undo history, independent of campaign/character storage. */
export interface CombatSession {
  version: 1;
  moments: CombatMoment[];
  cursor: number;
}
export function newCombatSession(): CombatSession {
  return {
    version: 1,
    cursor: 0,
    moments: [
      {
        id: id(),
        label: '전투 준비',
        checkpoint: '전투 준비',
        frame: {
          fighters: [],
          round: 0,
          phase: 'setup',
          first: 'pc',
          last: '',
        },
      },
    ],
  };
}
export const combatFrame = (session: CombatSession) =>
  session.moments[session.cursor].frame;
export const sideName = (side: CombatSide) => (side === 'pc' ? '아군' : '적');
export const actingSide = (frame: CombatFrame) =>
  frame.phase === 'second'
    ? frame.first === 'pc'
      ? 'enemy'
      : 'pc'
    : frame.first;
export function newCombatant(side: CombatSide, number: number): Combatant {
  return {
    id: id(),
    name: `${side === 'pc' ? 'PC' : '적'} ${number}`,
    side,
    hp: 1,
    maxHp: 1,
    strength: 0,
    agility: 0,
    presence: 0,
    morale: side === 'pc' ? null : 7,
    omens: 0,
    weaponName: '',
    weapon: 'd6',
    armor: '0',
    armorTier: 0,
    defencePenalty: 0,
    shield: false,
    active: true,
    notes: '',
  };
}
export function integer(value: unknown, min = -9999, max = 9999): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(`${min}~${max} 사이의 정수를 입력하세요.`);
  return value;
}
export interface CombatFormula {
  notation: string;
  count: number;
  sides: number;
  modifier: number;
}
export function combatFormula(raw: string): CombatFormula {
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[−–]/g, '-');
  if (/^\d{1,4}$/.test(text))
    return { notation: text, count: 0, sides: 0, modifier: Number(text) };
  const match = /^(\d{0,2})d(\d{1,4})([+-]\d{1,4})?$/.exec(text);
  if (!match)
    throw new Error('주사위는 d6, 2d4+1 또는 고정값 3처럼 입력하세요.');
  const count = Number(match[1] || 1),
    sides = Number(match[2]),
    modifier = Number(match[3] || 0);
  integer(count, 1, 20);
  integer(sides, 2, 1000);
  return {
    notation: `${count === 1 ? '' : count}d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}`,
    count,
    sides,
    modifier,
  };
}
export function validateCombatant(f: Combatant) {
  if (
    !f.id ||
    !f.name.trim() ||
    f.name.length > 100 ||
    !['pc', 'enemy'].includes(f.side)
  )
    throw new Error('참가자의 이름과 진영을 확인하세요.');
  for (const value of [
    f.hp,
    f.strength,
    f.agility,
    f.presence,
    f.defencePenalty,
  ])
    integer(value);
  integer(f.maxHp, 1);
  integer(f.omens, 0);
  if (f.morale !== null) integer(f.morale, 0);
  if (f.armorTier !== null) integer(f.armorTier, 0, 3);
  if (
    typeof f.notes !== 'string' ||
    f.notes.length > 4000 ||
    typeof f.weaponName !== 'string' ||
    f.weaponName.length > 100
  )
    throw new Error('이름 또는 메모가 너무 깁니다.');
  if (typeof f.shield !== 'boolean' || typeof f.active !== 'boolean')
    throw new Error('참가자 상태를 확인하세요.');
  combatFormula(f.weapon);
  combatFormula(f.armor);
}
export function changeCombat(
  session: CombatSession,
  label: string,
  update: (frame: CombatFrame) => void,
  checkpoint?: string,
): CombatSession {
  const frame = structuredClone(combatFrame(session));
  update(frame);
  frame.fighters.forEach(validateCombatant);
  if (new Set(frame.fighters.map((f) => f.id)).size !== frame.fighters.length)
    throw new Error('참가자 ID가 중복되었습니다.');
  const moments = session.moments.slice(0, session.cursor + 1);
  moments.push({
    id: id(),
    label,
    ...(checkpoint ? { checkpoint } : {}),
    frame,
  });
  return { version: 1, moments, cursor: moments.length - 1 };
}
export function seekCombat(
  session: CombatSession,
  cursor: number,
): CombatSession {
  integer(cursor, 0, session.moments.length - 1);
  return { ...session, cursor };
}
export function initiativeSide(value: number): CombatSide {
  integer(value, 1, 6);
  return value <= 3 ? 'enemy' : 'pc';
}
export function startCombatRound(
  session: CombatSession,
  first: CombatSide,
  die?: number,
): CombatSession {
  const frame = combatFrame(session);
  if (
    !frame.fighters.some((f) => f.active && f.side === 'pc') ||
    !frame.fighters.some((f) => f.active && f.side === 'enemy')
  )
    throw new Error('참여 중인 아군과 적을 한 명씩 추가하세요.');
  if (die !== undefined && initiativeSide(die) !== first)
    throw new Error('선공 주사위를 확인하세요.');
  const round = frame.round + 1;
  return changeCombat(
    session,
    `${round}라운드 시작${die ? ` · 선공 d6 = ${die}` : ' · 선공 직접 선택'}`,
    (f) => {
      f.round = round;
      f.phase = 'first';
      f.first = first;
      f.last = `${sideName(first)} 선공${die ? ` · d6 = ${die}` : ''}`;
    },
    `${round}R · 선공 시작 (${sideName(first)})`,
  );
}
export function secondCombatSide(session: CombatSession): CombatSession {
  const frame = combatFrame(session);
  if (frame.phase !== 'first')
    throw new Error('선공 단계에서 후공으로 넘어갈 수 있습니다.');
  const second = frame.first === 'pc' ? 'enemy' : 'pc';
  return changeCombat(
    session,
    `${frame.round}라운드 후공`,
    (f) => {
      f.phase = 'second';
      f.last = `${sideName(second)} 후공`;
    },
    `${frame.round}R · 후공 시작 (${sideName(second)})`,
  );
}

export type CombatOmen =
  | 'none'
  | 'maximum'
  | 'reduce'
  | 'neutralize'
  | 'difficulty';
export type CombatDieKey = 'test' | 'damage' | 'armor' | 'reduction';
export interface CombatDie {
  key: CombatDieKey;
  label: string;
  formula: string;
  values: number[];
  total: number;
  origin: 'app' | 'manual' | 'fixed' | 'maximum';
}
export interface AttackRequest {
  attackerId: string;
  targetId: string;
  style: 'melee' | 'ranged';
  dr: number;
  bonus: number;
  mode: 'app' | 'manual';
  dice: Partial<Record<CombatDieKey, string>>;
  omen: CombatOmen;
  omenOwnerId: string;
  breakShield: boolean;
  ignoreArmor: boolean;
  damageOverride: number | null;
}
export interface AttackPreview {
  basis: string;
  request: AttackRequest;
  dice: CombatDie[];
  hit: boolean;
  critical: boolean;
  fumble: boolean;
  total: number;
  dr: number;
  damage: number;
  armorLoss: boolean;
  freeAttack: boolean;
  weaponLost: boolean;
  messages: string[];
  omenCosts: Record<string, number>;
  extraCosts: Record<string, number>;
}
function readDie(
  key: CombatDieKey,
  label: string,
  formula: string,
  input: string | undefined,
  mode: 'app' | 'manual',
  rng?: RandomSource,
): CombatDie {
  const parsed = combatFormula(formula);
  let values: number[] = [];
  if (parsed.count) {
    if (input?.trim()) {
      if (!/^\d+(?:[\s,]+\d+)*$/.test(input.trim()))
        throw new Error(`${label}: 각 주사위의 눈을 쉼표로 나눠 입력하세요.`);
      values = input
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (values.length !== parsed.count)
        throw new Error(`${label}: ${parsed.count}개 주사위 값을 입력하세요.`);
      values.forEach((v) => integer(v, 1, parsed.sides));
    } else {
      if (mode === 'manual')
        throw new Error(
          `${label} (${parsed.notation})의 실물 값을 입력하세요.`,
        );
      values = Array.from({ length: parsed.count }, () =>
        rollDie(parsed.sides, rng),
      );
    }
  }
  return {
    key,
    label,
    formula: parsed.notation,
    values,
    total: Math.max(
      0,
      values.reduce((a, b) => a + b, parsed.modifier),
    ),
    origin: !parsed.count ? 'fixed' : input?.trim() ? 'manual' : 'app',
  };
}
function payer(frame: CombatFrame, fighterId: string) {
  const f = frame.fighters.find((f) => f.id === fighterId && f.side === 'pc');
  if (!f) throw new Error('Omen을 사용할 아군을 선택하세요.');
  return f;
}
export function prepareAttack(
  frame: CombatFrame,
  request: AttackRequest,
  rng?: RandomSource,
  extraCosts: Record<string, number> = {},
): AttackPreview {
  frame.fighters.forEach(validateCombatant);
  const attacker = frame.fighters.find((f) => f.id === request.attackerId),
    target = frame.fighters.find((f) => f.id === request.targetId);
  if (
    !attacker ||
    !target ||
    attacker.id === target.id ||
    attacker.side === target.side
  )
    throw new Error('서로 다른 진영의 공격자와 대상을 선택하세요.');
  if (!attacker.active || !target.active)
    throw new Error('전투 참여 중인 참가자를 선택하세요.');
  integer(request.dr, 1, 99);
  integer(request.bonus, -99, 99);
  if (request.damageOverride !== null) integer(request.damageOverride, 0);
  const defence = attacker.side === 'enemy';
  const pc = defence ? target : attacker;
  const omenCosts = { ...extraCosts };
  if (request.omen !== 'none') {
    const owner = payer(frame, request.omenOwnerId);
    if (request.omen === 'maximum' && owner.id !== attacker.id)
      throw new Error('최대 피해 Omen은 공격하는 아군이 사용합니다.');
    if (request.omen === 'reduce' && owner.id !== target.id)
      throw new Error('피해 감소 Omen은 피해를 받는 아군이 사용합니다.');
    omenCosts[owner.id] = (omenCosts[owner.id] || 0) + 1;
  }
  for (const [fighterId, cost] of Object.entries(omenCosts)) {
    integer(cost, 0);
    if (payer(frame, fighterId).omens < cost)
      throw new Error('남은 Omen이 부족합니다.');
  }
  if (request.breakShield && !target.shield)
    throw new Error('대상에게 방패가 없습니다.');
  const test = readDie(
    'test',
    defence ? '방어' : '공격',
    'd20',
    request.dice.test,
    request.mode,
    rng,
  );
  const natural = test.total;
  const critical = natural === 20 && request.omen !== 'neutralize';
  const fumble = natural === 1 && request.omen !== 'neutralize';
  const modifier = defence
    ? pc.agility
    : request.style === 'ranged'
      ? pc.presence
      : pc.strength;
  const total = natural + modifier + request.bonus;
  const dr =
    request.dr +
    (defence ? target.defencePenalty : 0) -
    (request.omen === 'difficulty' ? 4 : 0);
  const success = critical || (!fumble && total >= dr);
  const hit = defence ? !success : success;
  const dice = [test];
  let damage = 0;
  const messages = [
    `${defence ? '방어' : request.style === 'ranged' ? '원거리 공격' : '근접 공격'}: ${natural} + ${modifier} + ${request.bonus} = ${total} / DR ${dr}`,
  ];
  if (hit) {
    let weapon: CombatDie;
    if (request.omen === 'maximum') {
      const formula = combatFormula(attacker.weapon);
      weapon = {
        key: 'damage',
        label: '무기 피해',
        formula: formula.notation,
        values: [],
        total: Math.max(0, formula.count * formula.sides + formula.modifier),
        origin: 'maximum',
      };
    } else
      weapon = readDie(
        'damage',
        '무기 피해',
        attacker.weapon,
        request.dice.damage,
        request.mode,
        rng,
      );
    const armor = readDie(
      'armor',
      '방어구 감소',
      request.ignoreArmor ? '0' : target.armor,
      request.dice.armor,
      request.mode,
      rng,
    );
    dice.push(weapon, armor);
    const shield = target.shield ? 1 : 0;
    let reduction = 0;
    if (request.omen === 'reduce') {
      const omen = readDie(
        'reduction',
        'Omen 감소',
        'd6',
        request.dice.reduction,
        request.mode,
        rng,
      );
      dice.push(omen);
      reduction = omen.total;
    }
    damage = request.breakShield
      ? 0
      : Math.max(0, weapon.total - armor.total - shield - reduction);
    messages.push(
      `${weapon.total} − 방어구 ${armor.total} − 방패 ${shield}${reduction ? ` − Omen ${reduction}` : ''} = 기본 피해 ${damage}`,
    );
    if (request.breakShield)
      messages.push('방패를 부수어 이번 공격의 피해를 무시합니다.');
  } else
    messages.push(
      defence ? '방어 성공 · 피해 없음' : '공격 빗나감 · 피해 없음',
    );
  const armorLoss = hit && ((!defence && critical) || (defence && fumble));
  const freeAttack = defence && critical;
  const weaponLost = !defence && fumble;
  if (armorLoss)
    messages.push(
      '치명타·실수 규칙: 피해 두 배, 대상 방어구 1단계 손상. 자동 적용하지 않았습니다. 피해와 방어구를 직접 수정하세요.',
    );
  if (freeAttack)
    messages.push('방어 치명타 · 이 아군은 추가 공격을 할 수 있습니다.');
  if (weaponLost)
    messages.push(
      '공격 실수 · 무기가 파손되거나 손에서 벗어납니다. 무기·메모를 직접 수정하세요.',
    );
  if (request.damageOverride !== null) {
    damage = request.damageOverride;
    messages.push(`최종 피해 직접 지정: ${damage}`);
  }
  return {
    basis: JSON.stringify(frame),
    request: structuredClone(request),
    dice,
    hit,
    critical,
    fumble,
    total,
    dr,
    damage,
    armorLoss,
    freeAttack,
    weaponLost,
    messages,
    omenCosts,
    extraCosts: { ...extraCosts },
  };
}
/** Apply an explicitly chosen Omen after seeing the roll, without rerolling existing dice. */
export function changeAttackOmen(
  frame: CombatFrame,
  preview: AttackPreview,
  omen: CombatOmen,
  ownerId: string,
  reduction?: string,
  rng?: RandomSource,
): AttackPreview {
  if (JSON.stringify(frame) !== preview.basis)
    throw new Error('전투 값이 바뀌었습니다. 다시 판정하세요.');
  const dice = {
    ...preview.request.dice,
    ...Object.fromEntries(
      preview.dice
        .filter((d) => d.values.length)
        .map((d) => [d.key, d.values.join(',')]),
    ),
    ...(reduction?.trim() ? { reduction } : {}),
  };
  const next = prepareAttack(
    frame,
    {
      ...preview.request,
      omen,
      omenOwnerId: ownerId,
      dice,
      damageOverride: null,
    },
    rng,
    preview.extraCosts,
  );
  next.dice = next.dice.map((d) => ({
    ...d,
    origin:
      preview.dice.find(
        (old) =>
          old.key === d.key &&
          old.values.length &&
          old.values.join(',') === d.values.join(','),
      )?.origin ?? d.origin,
  }));
  return next;
}

/** Reroll only the selected roll, preserving every other die and all provisional Omen costs. */
export function rerollAttackDie(
  frame: CombatFrame,
  preview: AttackPreview,
  key: CombatDieKey,
  ownerId: string,
  manual?: string,
  rng?: RandomSource,
): AttackPreview {
  if (JSON.stringify(frame) !== preview.basis)
    throw new Error('전투 값이 바뀌었습니다. 다시 판정하세요.');
  const die = preview.dice.find((d) => d.key === key);
  if (!die || !combatFormula(die.formula).count || die.origin === 'maximum')
    throw new Error('이 값은 재굴림 대상이 아닙니다.');
  const owner = payer(frame, ownerId);
  const costs = {
    ...preview.extraCosts,
    [ownerId]: (preview.extraCosts[ownerId] || 0) + 1,
  };
  if ((preview.omenCosts[ownerId] || 0) + 1 > owner.omens)
    throw new Error('남은 Omen이 부족합니다.');
  if (preview.request.mode === 'manual' && !manual?.trim())
    throw new Error('새 실물 주사위 값을 입력하세요.');
  const rerolled = readDie(
    key,
    die.label,
    die.formula,
    manual,
    preview.request.mode,
    rng,
  );
  const dice = {
    ...preview.request.dice,
    ...Object.fromEntries(
      preview.dice
        .filter((d) => d.values.length)
        .map((d) => [d.key, d.values.join(',')]),
    ),
  };
  dice[key] = rerolled.values.join(',');
  const next = prepareAttack(frame, { ...preview.request, dice }, rng, costs);
  next.dice = next.dice.map((d) => ({
    ...d,
    origin:
      d.key === key
        ? rerolled.origin
        : (preview.dice.find(
            (old) =>
              old.key === d.key && old.values.join(',') === d.values.join(','),
          )?.origin ?? d.origin),
  }));
  return next;
}
export function applyAttack(
  session: CombatSession,
  preview: AttackPreview,
): CombatSession {
  const frame = combatFrame(session);
  if (JSON.stringify(frame) !== preview.basis)
    throw new Error('전투 값이 바뀌었습니다. 다시 판정하세요.');
  const attacker = frame.fighters.find(
    (f) => f.id === preview.request.attackerId,
  )!;
  const target = frame.fighters.find((f) => f.id === preview.request.targetId)!;
  return changeCombat(
    session,
    `${attacker.name} → ${target.name} · 피해 ${preview.damage}`,
    (f) => {
      const defender = f.fighters.find((f) => f.id === target.id)!;
      defender.hp -= preview.damage;
      if (preview.hit && preview.request.breakShield) defender.shield = false;
      for (const [fighterId, cost] of Object.entries(preview.omenCosts))
        f.fighters.find((p) => p.id === fighterId)!.omens -= cost;
      f.last = [
        `${attacker.name} → ${target.name} · HP ${target.hp} → ${defender.hp}`,
        ...preview.dice.map(
          (d) =>
            `${d.label} ${d.formula}: ${d.values.length ? `[${d.values.join(', ')}] = ` : ''}${d.total} (${d.origin === 'manual' ? '실물' : d.origin === 'app' ? '앱' : d.origin === 'maximum' ? '최대' : '고정'})`,
        ),
        ...preview.messages,
        ...Object.entries(preview.omenCosts).map(
          ([fighterId, cost]) =>
            `${f.fighters.find((p) => p.id === fighterId)!.name} Omen −${cost}`,
        ),
      ].join('\n');
    },
  );
}
export function resolveCombatMorale(
  session: CombatSession,
  fighterId: string,
  values?: string,
  outcomeDie?: string,
  rng?: RandomSource,
): CombatSession {
  const fighter = combatFrame(session).fighters.find((f) => f.id === fighterId);
  if (!fighter || fighter.morale === null)
    throw new Error('사기 수치가 있는 참가자를 선택하세요.');
  const dice = readDie(
    'test',
    '사기',
    '2d6',
    values,
    values === undefined ? 'app' : 'manual',
    rng,
  );
  const failed = dice.total > fighter.morale;
  const outcome = failed
    ? readDie(
        'damage',
        '실패한 사기',
        'd6',
        outcomeDie,
        values === undefined ? 'app' : 'manual',
        rng,
      )
    : null;
  const text = `${fighter.name} · 사기 [${dice.values.join(', ')}] = ${dice.total} / Morale ${fighter.morale} · ${failed ? `${outcome!.total <= 3 ? '도주' : '항복'} (d6 = ${outcome!.total})` : '유지'}`;
  return changeCombat(session, text, (f) => {
    f.last = text;
    if (failed) {
      const target = f.fighters.find((p) => p.id === fighterId)!;
      target.active = false;
      target.notes = [
        target.notes,
        outcome!.total <= 3 ? '사기 실패: 도주' : '사기 실패: 항복',
      ]
        .filter(Boolean)
        .join('\n');
    }
  });
}

/** Reject malformed storage without touching any older app storage keys. */
export function parseCombatSession(raw: string): CombatSession {
  const s = JSON.parse(raw) as CombatSession;
  if (!s || s.version !== 1 || !Array.isArray(s.moments) || !s.moments.length)
    throw new Error('전투 임시 자료를 읽을 수 없습니다.');
  integer(s.cursor, 0, s.moments.length - 1);
  for (const m of s.moments) {
    if (
      !m ||
      typeof m.id !== 'string' ||
      typeof m.label !== 'string' ||
      (m.checkpoint !== undefined && typeof m.checkpoint !== 'string') ||
      !m.frame ||
      !Array.isArray(m.frame.fighters)
    )
      throw new Error('전투 기록 형식을 확인하세요.');
    const f = m.frame;
    integer(f.round, 0);
    if (
      !['setup', 'first', 'second'].includes(f.phase) ||
      !['pc', 'enemy'].includes(f.first) ||
      typeof f.last !== 'string'
    )
      throw new Error('전투 단계 형식을 확인하세요.');
    f.fighters.forEach(validateCombatant);
    if (new Set(f.fighters.map((p) => p.id)).size !== f.fighters.length)
      throw new Error('참가자 ID가 중복되었습니다.');
  }
  return s;
}
