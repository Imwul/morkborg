import { random, rollDie, type RandomSource } from '../generators/random';

export type MythicListKind = 'characters' | 'threads';
export interface MythicLists {
  characters: string[];
  threads: string[];
}
export const emptyMythicLists = (): MythicLists => ({
  characters: Array(25).fill(''),
  threads: Array(25).fill(''),
});
export function validateMythicLists(value: unknown): MythicLists {
  const lists = value as MythicLists;
  for (const kind of ['characters', 'threads'] as const) {
    if (
      !Array.isArray(lists?.[kind]) ||
      lists[kind].length !== 25 ||
      lists[kind].some((v) => typeof v !== 'string' || v.length > 160)
    )
      throw new Error('Mythic 목록 형식을 확인하세요.');
    const counts = new Map<string, number>();
    for (const text of lists[kind]) {
      const key = text.trim().toLocaleLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (counts.get(key)! > 3)
        throw new Error('같은 항목은 최대 세 칸까지 적습니다.');
    }
  }
  return structuredClone(lists);
}
/** GME2 PDF 45–47: preserve empty slots; they mean Choose, not an automatic reroll. */
export function mythicListSections(slots: string[]): number {
  return Math.ceil((slots.findLastIndex((s) => s.trim()) + 1) / 5);
}
export interface MythicListDraw {
  kind: 'element' | 'choose' | 'context';
  sectionDice?: number;
  sectionRoll?: number;
  lineRoll?: number;
  slot?: number;
  text: string;
}
export function resolveMythicList(
  slots: string[],
  sectionRoll?: number,
  lineRoll?: number,
): MythicListDraw {
  if (slots.length !== 25) throw new Error('목록은 25칸입니다.');
  const sections = mythicListSections(slots);
  if (!sections)
    return {
      kind: 'context',
      text: '목록이 비었습니다. Event Focus를 Current Context로 해석하세요.',
    };
  const sides = sections === 1 ? undefined : sections * 2;
  if (
    sides &&
    (!Number.isInteger(sectionRoll) || sectionRoll! < 1 || sectionRoll! > sides)
  )
    throw new Error('구역 주사위 범위를 확인하세요.');
  if (!Number.isInteger(lineRoll) || lineRoll! < 1 || lineRoll! > 10)
    throw new Error('행 주사위는 d10, 1–10입니다.');
  const section = sides ? Math.ceil(sectionRoll! / 2) - 1 : 0;
  const slot = section * 5 + Math.ceil(lineRoll! / 2) - 1;
  return {
    kind: slots[slot].trim() ? 'element' : 'choose',
    sectionDice: sides,
    sectionRoll: sides ? sectionRoll : undefined,
    lineRoll,
    slot,
    text:
      slots[slot].trim() ||
      'CHOOSE · 맥락에 맞는 항목을 직접 선택하거나 다시 굴리세요.',
  };
}
export function rollMythicList(
  slots: string[],
  rng: RandomSource = random,
): MythicListDraw {
  const sections = mythicListSections(slots);
  if (!sections) return resolveMythicList(slots);
  return resolveMythicList(
    slots,
    sections > 1 ? rollDie(sections * 2, rng) : undefined,
    rollDie(10, rng),
  );
}
/** GME2 PDF 38, Focus table: new NPC and PC focuses do not select from Characters. */
export function mythicFocusList(roll: number): MythicListKind | null {
  if (!Number.isInteger(roll) || roll < 1 || roll > 100) return null;
  return roll >= 21 && roll <= 50
    ? 'characters'
    : roll >= 51 && roll <= 70
      ? 'threads'
      : null;
}
/** GME2 PDF 114: fresh sheet, three occurrences become two, all others one. Explicit only. */
export function tidyMythicList(slots: string[]): string[] {
  const entries = new Map<string, { text: string; count: number }>();
  for (const text of slots) {
    const key = text.trim().toLocaleLowerCase();
    if (key)
      entries.set(key, {
        text: entries.get(key)?.text ?? text.trim(),
        count: (entries.get(key)?.count ?? 0) + 1,
      });
  }
  const result = [...entries.values()].flatMap((e) =>
    Array(e.count >= 3 ? 2 : 1).fill(e.text),
  );
  return [...result, ...Array(25 - result.length).fill('')];
}
