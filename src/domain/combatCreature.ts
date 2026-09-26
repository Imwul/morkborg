import { id } from '../generators/random';
import {
  combatFormula,
  changeCombat,
  type Combatant,
  type CombatSession,
} from './combatTool';
import { findReferenceCreature, type ReferenceEntry } from './references';
import type { RulesPack } from '../storage/rulesStore';

const text = (v: unknown, limit = 500) =>
  typeof v === 'string'
    ? v.trim().slice(0, limit)
    : typeof v === 'number' && Number.isFinite(v)
      ? String(v)
      : '';
const stat = (v: unknown, min = -9999) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= 9999
    ? v
    : null;
function formula(v: unknown): string {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  try {
    return combatFormula(String(v)).notation;
  } catch {
    return '';
  }
}
export function creatureDamage(v: unknown): string {
  const direct = formula(v);
  if (direct) return direct;
  const fixed = typeof v === 'string' ? /^(\d+) damage$/i.exec(v.trim()) : null;
  return fixed ? formula(fixed[1]) : '';
}
/** Normalize only the explicit armor stat's reduction suffix. Conditional stats stay blank. */
export function creatureArmor(v: unknown): string {
  if (typeof v === 'number') return formula(v);
  if (typeof v !== 'string') return '';
  const value = v.trim();
  if (/^(?:no armor|none)$/i.test(value)) return '0';
  const direct = formula(value);
  if (direct) return direct;
  const reduction = /^(?:[^\d\n]+?\s+)?[-−](d\d+)$/i.exec(value);
  return reduction ? formula(reduction[1]) : '';
}
/** No generated defaults or prose parsing. The source record remains immutable. */
export function creatureCombatant(
  entry: ReferenceEntry,
  rules: RulesPack | null,
): Combatant {
  if (
    !entry.available ||
    entry.kind !== 'creature' ||
    entry.action?.kind !== 'creature'
  )
    throw new Error('사용 가능한 생물 참조를 선택하세요.');
  const source = findReferenceCreature(rules, entry.action.creatureId);
  if (!source || source.sourceVerified === false || !text(source.name))
    throw new Error('확인된 생물 원문이 없습니다.');
  const table =
    source.attackTable && typeof source.attackTable === 'object'
      ? (source.attackTable as Record<string, unknown>)
      : null;
  const candidates =
    Array.isArray(source.attackOptions) && source.attackOptions.length
      ? source.attackOptions
      : Array.isArray(table?.entries)
        ? table.entries
        : [];
  const weapons = candidates.slice(0, 20).flatMap((raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const w = raw as Record<string, unknown>;
    const name = text(w.attack ?? w.name, 100),
      sourceDamage = text(w.damage);
    return name || sourceDamage
      ? [{ name, damage: creatureDamage(w.damage), sourceDamage }]
      : [];
  });
  const hp = stat(source.hp, 1);
  const result: Combatant = {
    id: id(),
    name: text(source.name, 100),
    side: 'enemy',
    hp,
    maxHp: hp,
    morale:
      stat(source.morale, 0) ??
      (typeof source.moraleDisplay === 'string' &&
      /^\d{1,4}$/.test(source.moraleDisplay.trim())
        ? stat(Number(source.moraleDisplay), 0)
        : null),
    strength: stat(source.strength),
    agility: stat(source.agility),
    presence: stat(source.presence),
    omens: stat(source.omens, 0),
    defencePenalty: stat(source.defencePenalty),
    weaponName:
      weapons.length === 1
        ? weapons[0].name
        : weapons.length
          ? ''
          : text(source.attack, 100),
    weapon:
      weapons.length === 1
        ? weapons[0].damage
        : weapons.length
          ? ''
          : creatureDamage(source.damage),
    armor: creatureArmor(source.armor),
    armorTier: null,
    shield: false,
    active: true,
    notes: '',
    sourceReferenceId: entry.id,
    sourceStats: {
      hp: text(source.hp),
      armor: text(source.armor),
      damage: text(source.damage),
    },
    ...(weapons.length ? { weapons } : {}),
  };
  return result;
}
export function addCreatureToCombat(
  session: CombatSession,
  entry: ReferenceEntry,
  rules: RulesPack | null,
): CombatSession {
  const fighter = creatureCombatant(entry, rules);
  return changeCombat(
    session,
    `${fighter.name} · 생물 참조에서 추가`,
    (frame) => {
      if (frame.fighters.length >= 40)
        throw new Error('한 전투에 40명까지 참가할 수 있습니다.');
      frame.fighters.push(fighter);
    },
  );
}
