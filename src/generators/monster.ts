import type {
  Monster,
  MonsterAttack,
  MonsterText,
  RegionId,
} from '../domain/types';
import { id, now, pick, rollDie } from './random';
import { entries, rollTable, scalarText } from './tables';
import { getRules, sourceCitation } from '../storage/rulesStore';

export type FeretoryRolls = { A: number; B: number; C: number };
export const feretoryRolls = (): FeretoryRolls => ({
  A: rollDie(12),
  B: rollDie(12),
  C: rollDie(12),
});
export function feretoryStats(rolls: FeretoryRolls) {
  const values = Object.values(rolls);
  const highest = Math.max(...values),
    lowest = Math.min(...values);
  const sides =
    lowest <= 3
      ? 4
      : lowest <= 5
        ? 6
        : lowest <= 7
          ? 8
          : lowest <= 10
            ? 10
            : 12;
  const options = Object.entries(rolls)
    .filter(([, n]) => n === highest)
    .map(([key]) =>
      key === 'A' ? 'None' : key === 'B' ? '−d2' : highest % 2 ? '−d4' : '−d6',
    );
  return {
    hp: 2 * rollDie(sides),
    morale: highest,
    damage: `d${sides}`,
    armor:
      options.length === 1
        ? options[0]
        : `동률 — 심판 선택: ${options.map((option) => (option === 'None' ? '없음' : option)).join(' / ')}`,
    sides,
  };
}
export const fereAppearance = (rolls: FeretoryRolls): string =>
  (['A', 'B', 'C'] as const)
    .map((key) => entries(`feretory.${key}`)[rolls[key] - 1].text)
    .join('; ');
const statSource = (rolls: FeretoryRolls) =>
  `FERETORY · PDF 2쪽 · A=${rolls.A}, B=${rolls.B}, C=${rolls.C}`;
const isFeretorySource = (source?: string) =>
  /^(?:MÖRK BORG CULT: )?FERETORY/.test(source ?? '');
const hpSource =
  'FERETORY · PDF 2쪽 · 피해 주사위 한 번 ×2 (본문; 괄호의 2dN 예시와 분포 불일치)';
export function monsterText(tableId: string): MonsterText {
  const r = rollTable(tableId);
  return { id: id(), text: String(r.value), source: r.source, tableId };
}
export function generateMonster(campaignId: string, blank = false): Monster {
  const m: Monster = {
    id: id(),
    campaignId,
    name: '',
    concept: '',
    appearance: '',
    behavior: '',
    wants: '',
    hp: 0,
    morale: '',
    armor: '',
    attacks: [],
    special: [],
    weakness: [],
    loot: [],
    weirdTrait: '',
    description: '',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    sources: {},
  };
  if (blank) return m;
  if (!getRules()) throw new Error('원문 생성 자료를 먼저 불러오세요.');
  const rolls = feretoryRolls(),
    stats = feretoryStats(rolls);
  Object.assign(m, {
    name: String(rollTable('core.names').value),
    appearance: fereAppearance(rolls),
    hp: stats.hp,
    morale: stats.morale,
    armor: stats.armor,
    wants: String(rollTable('feretory.desire').value),
    attacks: [
      {
        id: id(),
        name: '',
        damage: stats.damage,
        description: '',
        tableId: 'feretory.stats',
        sources: {
          name: '전용 공격명 생성표 없음 · 직접 작성',
          damage: statSource(rolls),
        },
      },
    ],
    special: [monsterText('feretory.trait')],
    generation: { system: 'feretory', rolls },
  });
  m.sources = {
    name:
      sourceCitation('core.names') +
      ' · 기본 이름표를 몬스터 이름에 사용 (기록장 방식)',
    appearance: statSource(rolls),
    hp: hpSource,
    morale: statSource(rolls),
    armor: statSource(rolls),
    wants: sourceCitation('feretory.desire'),
  };
  return m;
}
export function patchMonsterScalar(
  m: Monster,
  key: string,
  value: string | number,
  source = '직접 작성',
): void {
  if (
    ![
      'name',
      'concept',
      'appearance',
      'behavior',
      'wants',
      'hp',
      'morale',
      'armor',
      'weirdTrait',
      'description',
      'notes',
    ].includes(key)
  )
    return;
  let accepted: string | number = String(value);
  if (key === 'hp') {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    accepted = Math.max(0, Math.min(9999, Math.trunc(n)));
  }
  if (key === 'morale' && /^\d+$/.test(String(value)))
    accepted = Math.max(0, Math.min(12, Number(value)));
  Object.assign(m, { [key]: accepted });
  m.sources = { ...m.sources, [key]: source };
}
export const usesFeretory = (m: Monster): boolean =>
  /^feretory(?:-edited)?$/.test(m.generation?.system ?? '');
export function canRerollMonsterHp(m: Monster): boolean {
  return usesFeretory(m) && /^d(4|6|8|10|12)$/.test(m.attacks[0]?.damage ?? '');
}
export function rerollMonsterField(
  m: Monster,
  key: 'name' | 'wants' | 'hp',
): void {
  if (key === 'hp') {
    if (!canRerollMonsterHp(m)) return;
    patchMonsterScalar(
      m,
      'hp',
      2 * rollDie(Number(m.attacks[0].damage.slice(1))),
      hpSource,
    );
    return;
  }
  const r = rollTable(key === 'name' ? 'core.names' : 'feretory.desire');
  patchMonsterScalar(
    m,
    key,
    r.value,
    r.source +
      (key === 'name'
        ? ' · 기본 이름표를 몬스터 이름에 사용 (기록장 방식)'
        : ''),
  );
}
/** FERETORY uses one linked 3d12 roll. Never silently replace another manually edited field. */
export function rerollMonsterLinked(
  m: Monster,
  target: 'appearance' | 'morale' | 'armor' | 'attack',
  attackId?: string,
): void {
  if (!usesFeretory(m)) return;
  const attack = m.attacks.find((a) => a.id === attackId) ?? m.attacks[0];
  if (target === 'attack' && (!attack || attack.tableId !== 'feretory.stats'))
    return;
  const rolls = feretoryRolls(),
    stats = feretoryStats(rolls),
    source = statSource(rolls);
  const derived = {
    appearance: fereAppearance(rolls),
    morale: stats.morale,
    armor: stats.armor,
  };
  for (const key of ['appearance', 'morale', 'armor'] as const)
    if (key === target || isFeretorySource(m.sources?.[key]))
      patchMonsterScalar(m, key, derived[key], source);
  for (const a of m.attacks)
    if (
      a.tableId === 'feretory.stats' &&
      ((target === 'attack' && a.id === attack?.id) ||
        isFeretorySource(a.sources?.damage))
    ) {
      a.damage = stats.damage;
      a.sources = { ...a.sources, damage: source };
    }
  // A manually edited primary damage die is authoritative for any automatic HP.
  const primaryDamage = m.attacks[0]?.damage ?? '';
  if (isFeretorySource(m.sources?.hp) && /^d(4|6|8|10|12)$/.test(primaryDamage))
    patchMonsterScalar(
      m,
      'hp',
      primaryDamage === stats.damage
        ? stats.hp
        : 2 * rollDie(Number(primaryDamage.slice(1))),
      hpSource,
    );
  m.generation = { system: 'feretory', rolls };
}
export function rerollMonsterSpecial(m: Monster, itemId: string): void {
  const item = m.special.find((s) => s.id === itemId);
  if (!item || item.tableId !== 'feretory.trait') return;
  const next = monsterText('feretory.trait');
  Object.assign(item, next, { id: item.id });
}

/** Fixed book creatures are imported as a whole, never mixed into random creature tables. */
export function loadMonsterPreset(
  campaignId: string,
  record: Record<string, unknown>,
): Monster {
  if (typeof record.hp !== 'number')
    throw new Error(
      '일반 HP가 없는 원문 개체는 자동 프리셋에서 제외합니다. 직접 작성하세요.',
    );
  const m = generateMonster(campaignId, true);
  const additional = record.additionalSource as
    | { pdfPage?: number }
    | undefined;
  const depthsReference = scalarText(record.depthsReference);
  const source = `${record.book === 'feretory' ? 'MÖRK BORG CULT: FERETORY · Eat Prey Kill' : record.book === 'heretic' ? 'MÖRK BORG CULT: HERETIC' : 'MÖRK BORG BARE BONES EDITION'} · PDF ${scalarText(record.pdfPage)}쪽${additional?.pdfPage ? ` · 추가 PDF ${additional.pdfPage}쪽` : ''}${depthsReference ? ` · ${depthsReference}` : ''}`;
  for (const key of [
    'name',
    'concept',
    'appearance',
    'wants',
    'armor',
    'weirdTrait',
    'description',
  ] as const)
    m[key] = scalarText(record[key]);
  m.hp = record.hp;
  m.morale = scalarText(record.moraleDisplay ?? record.morale ?? '—');
  m.behavior = scalarText(record.behavior ?? record.behaviour);
  const item = (value: unknown): MonsterText[] =>
    scalarText(value) ? [{ id: id(), text: scalarText(value), source }] : [];
  m.special = item(record.specialAbility);
  m.weakness = item(record.weakness);
  m.loot = item(record.loot);
  const attack = (raw: Record<string, unknown>): MonsterAttack => ({
    id: id(),
    name: scalarText(raw.attack ?? raw.name),
    damage: scalarText(raw.damage),
    description: scalarText(raw.description ?? raw.effect),
    sources: { name: source, damage: source, description: source },
  });
  if (Array.isArray(record.attackOptions) && record.attackOptions.length)
    m.attacks = record.attackOptions.map(attack);
  else if (record.attack || record.damage)
    m.attacks = [
      attack({
        ...record,
        description:
          record.attackDescription ??
          record.attackEffect ??
          record.effect ??
          '',
      }),
    ];
  const table = record.attackTable as
    | { entries?: Record<string, unknown>[] }
    | undefined;
  if (table?.entries?.length) {
    m.attacks = [attack(pick(table.entries))];
    m.attacks[0].sources!.name += ' · 원문 무기 표 선택';
    m.attacks[0].sources!.damage += ' · 원문 무기 표 선택';
  }
  const actions = record.actionTable as
    | { entries?: Record<string, unknown>[]; dice?: string }
    | undefined;
  if (actions?.entries?.length) {
    const text = actions.entries
      .map(
        (e) =>
          `${scalarText(e.roll ?? e.min)}${e.max && e.max !== e.min ? `–${scalarText(e.max)}` : ''}: ${scalarText(e.text ?? e.name ?? e.attack)}${e.damage ? ` ${scalarText(e.damage)}` : ''}${e.effect ? ` — ${scalarText(e.effect)}` : ''}`,
      )
      .join('\n');
    m.special.push({ id: id(), text: `d4 · ${text}`, source });
  }
  m.notes = [
    scalarText(record.context),
    scalarText(record.sourceNotes),
    record.valuation
      ? `Valuation (매각가 · 자동 전리품 아님): ${typeof record.valuation === 'string' ? record.valuation : JSON.stringify(record.valuation)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  m.sources = Object.fromEntries(
    [
      'name',
      'concept',
      'appearance',
      'behavior',
      'wants',
      'hp',
      'morale',
      'armor',
      'description',
    ].map((key) => [key, source]),
  );
  m.generation = { system: 'preset', rolls: {} };
  return m;
}

const epkRegionKeys: Record<RegionId, string> = {
  galgenbeck: 'tveland',
  sarkash: 'sarkash',
  'graven-tosk': 'gravenTosk',
  grift: 'grift',
  kergus: 'kergus',
  wastland: 'wastland',
  'valley-undead': 'valley',
};
export function eatPreyKillCreatures(region: RegionId) {
  return (getRules()?.creatures ?? []).filter(
    (record) =>
      record.book === 'feretory' &&
      record.section === 'Eat Prey Kill' &&
      record.regionKey === epkRegionKeys[region] &&
      typeof record.hp === 'number' &&
      record.presetEligible !== false,
  );
}
export function generateEatPreyKillMonster(
  campaignId: string,
  region: RegionId,
): Monster {
  const records = eatPreyKillCreatures(region);
  if (!records.length)
    throw new Error('Eat Prey Kill 지역 자료를 먼저 갱신하세요.');
  const record = pick(records);
  const monster = loadMonsterPreset(campaignId, record);
  monster.region = region;
  monster.generation = {
    system: 'epk',
    rolls: { entry: Number(record.roll) || 0 },
  };
  return monster;
}
