import type {
  Character,
  CharacterItem,
  CharacterWeapon,
} from '../domain/types';
import {
  getRules,
  sourceCitation,
  type RuleEntry,
} from '../storage/rulesStore';
import { id, now, rollDie, rollDice, weightedPick } from './random';
import {
  abilityModifier,
  coreRule,
  rollTable,
  sampleEntry,
  scalarText,
  type RuleRoll,
} from './tables';

export const abilityKeys = [
  'strength',
  'agility',
  'presence',
  'toughness',
] as const;
export const characterLimits: Record<string, [number, number]> = {
  hp: [-999, 9999],
  maxHp: [1, 9999],
  strength: [-99, 99],
  agility: [-99, 99],
  presence: [-99, 99],
  toughness: [-99, 99],
  omens: [0, 999],
  silver: [0, 9999999],
};
export const isClassless = (c: Partial<Character>) =>
  !c.className || c.className === 'Classless';
export const hasScroll = (c: Partial<Character>) =>
  (c.equipment ?? []).some((e) => /scroll/i.test(e.text));
const tableEntries = (key: string) => {
  const table = getRules()?.tables[key];
  if (!table) throw new Error(`원문 표를 불러와야 합니다: ${key}`);
  return table.entries;
};
function resolveGear(entry: RuleEntry, presence: number): string {
  let text = entry.text.replace(/Presence\s*\+\s*(\d+)/g, (_, n: string) =>
    String(presence + Number(n)),
  );
  if (entry.meta.scrollTable) {
    const table = scalarText(entry.meta.scrollTable);
    const scroll = sampleEntry('core.' + table);
    return `${table} scroll: ${scroll.text} — ${scalarText(scroll.meta.effect)}`;
  }
  if (entry.meta.quantity === 'd4')
    text = text.replace('d4 doses', `${rollDie(4)} doses`);
  if (entry.meta.companion && typeof entry.meta.companion === 'object') {
    const companion = entry.meta.companion as {
      count: number | string;
      hp: string;
    };
    const count =
      typeof companion.count === 'number' ? companion.count : rollDie(4);
    return `${text} [${count} creature(s); HP: ${Array.from({ length: count }, () => rollDie(companion.hp.startsWith('d6') ? 6 : 4) + 2).join(', ')}]`;
  }
  return text;
}
// A gear-only reroll never changes another slot. New scrolls require compatible
// existing starting arms; unknown manually written arms are left untouched.
export function canAddStartingScroll(c: Partial<Character>): boolean {
  return (
    (!c.armor || /^(No armor|Light armor)/.test(c.armor)) &&
    (c.weapons ?? []).every((w) =>
      /^(Femur|Staff|Shortsword|Knife|Warhammer|Sword)(\b|$)/.test(w.text),
    )
  );
}
export function rollEquipmentSlot(
  slot: string,
  c: Partial<Character>,
): CharacterItem {
  const base = { id: id(), slot };
  if (slot === 'waterskin')
    return { ...base, text: 'Waterskin', source: coreRule(21, '시작 장비') };
  if (slot === 'food')
    return {
      ...base,
      text: `${rollDie(4)} days of food`,
      source: coreRule(21, 'd4 days of food'),
    };
  const tableId =
    slot === 'container'
      ? 'core.containers'
      : slot === 'gearB'
        ? 'core.gearB'
        : 'core.gearA';
  const allowed = canAddStartingScroll(c);
  const entries = tableEntries(tableId).filter(
    (e) => allowed || !e.meta.scrollTable,
  );
  const entry = weightedPick(
    entries.map((value) => ({ value, weight: value.weight })),
  );
  return {
    ...base,
    tableId,
    text: resolveGear(entry, c.presence ?? 0),
    source:
      sourceCitation(tableId) +
      (entry.meta.scrollTable
        ? ` · ${sourceCitation('core.' + scalarText(entry.meta.scrollTable))}`
        : '') +
      (!allowed && tableId !== 'core.containers'
        ? ' · 현재 무기·방어구를 유지하기 위해 scroll 결과 제외'
        : ''),
  };
}
export function rollWeapon(c: Partial<Character>): CharacterWeapon {
  const sides = hasScroll(c) ? 6 : 10;
  const entry = tableEntries('core.weapons')[rollDie(sides) - 1];
  const ammo = scalarText(entry.meta.ammunition).replace(
    'Presence + 10',
    String((c.presence ?? 0) + 10),
  );
  return {
    id: id(),
    text: entry.text + (ammo ? `; ${ammo}` : ''),
    damage: scalarText(entry.meta.damage),
    tableId: 'core.weapons',
    source: coreRule(
      23,
      `시작 무기 d${sides}${hasScroll(c) ? ' · scroll 보유' : ''}`,
    ),
  };
}
export function rollArmor(c: Partial<Character>): RuleRoll {
  const sides = hasScroll(c) ? 2 : 4;
  const entry = tableEntries('core.armor')[rollDie(sides) - 1];
  return {
    value: `${entry.text}${entry.meta.damageReduction ? ` −${scalarText(entry.meta.damageReduction)}` : ''}${Number(entry.meta.agilityDRPenalty) > 0 ? ` (Agility DR +${scalarText(entry.meta.agilityDRPenalty)}; defence DR +${scalarText(entry.meta.defenseDRPenalty)})` : ''}`,
    source: coreRule(
      23,
      `시작 방어구 d${sides}${hasScroll(c) ? ' · scroll 보유' : ''}`,
    ),
  };
}
export function rollTrait(tableId = 'core.traits'): CharacterItem {
  const table = tableId === 'core.bodies' ? 'core.bodies' : 'core.traits';
  const roll = rollTable(table);
  return {
    id: id(),
    text: String(roll.value),
    tableId: table,
    source: roll.source,
  };
}
export function characterFieldRoll(
  key: string,
  c: Partial<Character>,
): RuleRoll {
  if (key === 'name') return rollTable('core.names');
  if (abilityKeys.includes(key as (typeof abilityKeys)[number]))
    return {
      value: abilityModifier(rollDice(3, 6)),
      source: coreRule(27, '3d6 능력치 변환'),
    };
  if (key === 'hp' || key === 'maxHp')
    return {
      value: Math.max(1, (c.toughness ?? 0) + rollDie(8)),
      source: coreRule(29, 'max(1, Toughness + d8)'),
    };
  if (key === 'omens')
    return {
      value: rollDie(2),
      source: coreRule(37, 'Classless d2 Omens · 선택 규칙'),
    };
  if (key === 'silver')
    return {
      value: rollDice(2, 6) * 10,
      source: coreRule(21, '2d6 × 10 silver'),
    };
  if (key === 'armor') return rollArmor(c);
  if (key === 'archetype' || key === 'className')
    return {
      value: 'Classless',
      source: coreRule(21, '기본 캐릭터 · 선택 직업 없음'),
    };
  return { value: '', source: '직접 작성' };
}
export function updateCharacterHpFromToughness(c: Character): void {
  const die = c.generation?.rolls.hpDie;
  if (!die || !c.sources?.maxHp?.includes('Toughness')) return;
  const priorMax = c.maxHp;
  c.maxHp = Math.max(1, c.toughness + die);
  if (c.hp === priorMax && c.sources.hp !== '직접 작성') c.hp = c.maxHp;
}
export function patchCharacterScalar(
  c: Character,
  key: string,
  input: string | number,
  source = '직접 작성',
): void {
  const limits = characterLimits[key];
  if (
    !limits &&
    !['name', 'className', 'armor', 'description', 'notes', 'status'].includes(
      key,
    )
  )
    return;
  let value: string | number = input;
  if (limits) {
    const number = Number(input);
    if (!Number.isFinite(number)) return;
    value = Math.max(limits[0], Math.min(limits[1], Math.trunc(number)));
  }
  if (key === 'status' && !['alive', 'dead'].includes(String(value))) return;
  Object.assign(c, { [key]: value });
  c.sources = { ...c.sources, [key]: source };
  if (key === 'className') c.classSource = source;
  if (key === 'toughness' && isClassless(c)) updateCharacterHpFromToughness(c);
}
export function rerollCharacterField(c: Character, key: string): void {
  if (!isClassless(c) && key !== 'name') return;
  if (key === 'hp' || key === 'maxHp') {
    const die = rollDie(8);
    c.generation = {
      ...c.generation,
      system: 'core-classless',
      rolls: { ...c.generation?.rolls, hpDie: die },
    };
    c.maxHp = c.hp = Math.max(1, c.toughness + die);
    c.sources = {
      ...c.sources,
      hp: coreRule(29, '초기 HP = 최대 HP'),
      maxHp: coreRule(29, `max(1, Toughness + d8) · d8=${die}`),
    };
  } else {
    const result = characterFieldRoll(key, c);
    patchCharacterScalar(c, key, result.value, result.source);
  }
}
export function generateCharacter(
  campaignId: string,
  blank = false,
): Character {
  const c: Character = {
    id: id(),
    campaignId,
    name: '',
    className: 'Classless',
    classSource: coreRule(21, '기본 캐릭터'),
    hp: 1,
    maxHp: 1,
    strength: 0,
    agility: 0,
    presence: 0,
    toughness: 0,
    omens: 0,
    silver: 0,
    armor: '',
    weapons: [],
    equipment: [],
    traits: [],
    description: '',
    status: 'alive',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    sources: {},
    generation: { system: 'core-classless', rolls: {} },
  };
  if (blank) return c;
  for (const key of ['name', ...abilityKeys, 'hp', 'omens', 'silver'])
    rerollCharacterField(c, key);
  c.equipment = ['waterskin', 'food', 'container', 'gearA', 'gearB'].map(
    (slot) => rollEquipmentSlot(slot, c),
  );
  c.weapons = [rollWeapon(c)];
  const armor = rollArmor(c);
  c.armor = String(armor.value);
  c.sources!.armor = armor.source;
  c.traits = [rollTrait(), rollTrait(), rollTrait('core.bodies')];
  return c;
}
export function rerollCharacterItem(
  c: Character,
  kind: 'weapons' | 'equipment' | 'traits',
  itemId: string,
): void {
  const item = c[kind].find((e) => e.id === itemId);
  if (!item || (kind !== 'traits' && !isClassless(c))) return;
  if (
    kind === 'equipment' &&
    !['food', 'container', 'gearA', 'gearB'].includes(item.slot ?? '')
  )
    return;
  const replacement =
    kind === 'weapons'
      ? rollWeapon(c)
      : kind === 'equipment'
        ? rollEquipmentSlot(item.slot!, c)
        : rollTrait(item.tableId);
  Object.assign(item, replacement, { id: itemId });
}
