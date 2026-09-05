import type {
  Campaign,
  Dungeon,
  DungeonEncounterKind,
  DungeonEncounterTables,
} from './types';
import {
  contentRegistry,
  createEncounter,
  rerollEncounter,
} from '../generators/content';
import { now, random, rollDie, type RandomSource } from '../generators/random';

export const DUNGEON_ENCOUNTER_KINDS = ['common', 'rare'] as const;
export const emptyDungeonEncounterTables = (): DungeonEncounterTables => ({
  common: Array(6).fill(null),
  rare: Array(6).fill(null),
  dungeonDR: 10,
});
/** Reading an older dungeon never rolls dice or changes its saved content. */
export const dungeonEncounterSlots = (d: Dungeon, kind: DungeonEncounterKind) =>
  d.encounterTables?.[kind] ?? Array<string | null>(6).fill(null);

function dungeon(c: Campaign, dungeonId: string) {
  const d = c.dungeons.find((d) => d.id === dungeonId);
  if (!d) throw new Error('조우표를 사용할 던전을 확인하세요.');
  return d;
}
function tables(d: Dungeon) {
  return (d.encounterTables ??= emptyDungeonEncounterTables());
}
function validSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 5)
    throw new Error('조우표는 1–6번 칸을 사용합니다.');
}
export function setDungeonEncounterDR(
  c: Campaign,
  dungeonId: string,
  dr: number,
) {
  if (!Number.isInteger(dr) || dr < 6 || dr > 14)
    throw new Error('Dungeon DR은 6–14 정수여야 합니다.');
  const d = dungeon(c, dungeonId);
  tables(d).dungeonDR = dr;
  d.updatedAt = now();
}
export function setDungeonEncounterSlot(
  c: Campaign,
  dungeonId: string,
  kind: DungeonEncounterKind,
  slot: number,
  encounterId: string | null,
) {
  validSlot(slot);
  if (encounterId && !c.encounters.some((e) => e.id === encounterId))
    throw new Error('보관함에 없는 조우입니다.');
  const d = dungeon(c, dungeonId);
  tables(d)[kind][slot] = encounterId;
  d.updatedAt = now();
}
/** Generate only empty preparation slots. A failed preparation commits nothing. */
export function prepareDungeonEncounters(
  c: Campaign,
  dungeonId: string,
  kind: DungeonEncounterKind,
  registry = contentRegistry(),
  rng: RandomSource = random,
  slot?: number,
  blank = false,
) {
  if (slot !== undefined) validSlot(slot);
  const d = dungeon(c, dungeonId);
  const current = d.encounterTables ?? emptyDungeonEncounterTables();
  const targets =
    slot === undefined
      ? current[kind].flatMap((entry, i) => (entry ? [] : [i]))
      : [slot];
  const generated = targets.map((index) => {
    const encounter = createEncounter(
      c.id,
      d.region,
      kind,
      current.dungeonDR,
      true,
      registry,
    );
    if (!blank) rerollEncounter(encounter, registry, rng);
    return { index, encounter };
  });
  if (!generated.length) return [];
  const next = tables(d);
  for (const { index, encounter } of generated) {
    c.encounters.push(encounter);
    next[kind][index] = encounter.id;
  }
  d.updatedAt = now();
  return generated.map(({ encounter }) => encounter);
}
/** Playing consults the saved d6 table; it never regenerates, consumes or places entries. */
export function rollDungeonEncounter(
  c: Campaign,
  dungeonId: string,
  kind: DungeonEncounterKind,
  rng: RandomSource = random,
) {
  const d = dungeon(c, dungeonId),
    slots = dungeonEncounterSlots(d, kind);
  if (
    slots.some((entry) => !entry || !c.encounters.some((e) => e.id === entry))
  )
    throw new Error(
      `${kind === 'common' ? 'Common' : 'Rare'} 여섯 칸을 먼저 준비하세요.`,
    );
  const roll = rollDie(6, rng);
  return {
    kind,
    roll,
    encounter: c.encounters.find((e) => e.id === slots[roll - 1])!,
  };
}
