import type {
  DngngenEntry,
  DngngenPack,
  DngngenTemplatePart,
  DngngenValue,
  DngngenValueRecipe,
} from '../domain/dngngenPack';
import { random, type RandomSource } from './random';

export type DngngenRoomSlot = 1 | 2 | 3 | 4;
export interface DngngenRoomResult {
  readonly source: 'DNGNGEN';
  readonly snapshotId: string;
  /** Private transient identity; never added to canonical registry/search/storage. */
  readonly packIdentity: string;
  readonly slot: DngngenRoomSlot;
  readonly components: readonly {
    readonly entryId: string;
    readonly values: Readonly<Record<string, DngngenValue>>;
    readonly text: string;
  }[];
  readonly text: string;
  readonly synthetic: boolean;
  readonly attribution: string;
  readonly sourceUrl: string;
}
function drawIndex(length: number, rng: RandomSource): number {
  if (!length) throw new Error('DNGNGEN has no eligible descriptions.');
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('Invalid random value.');
  return Math.floor(value * length);
}
function evaluate(recipe: DngngenValueRecipe, rng: RandomSource): DngngenValue {
  switch (recipe.op) {
    case 'literal':
      return recipe.value;
    case 'int':
      return recipe.min + drawIndex(recipe.max - recipe.min + 1, rng);
    case 'sample':
      return recipe.values[drawIndex(recipe.values.length, rng)];
    case 'sum':
      return recipe.terms.reduce(
        (sum, term) => sum + (evaluate(term, rng) as number),
        0,
      );
  }
}
function render(
  pack: DngngenPack,
  parts: readonly DngngenTemplatePart[],
  values: Readonly<Record<string, DngngenValue>>,
): string {
  return parts
    .map((part): string => {
      switch (part.type) {
        case 'text':
          return part.text;
        case 'message':
          return render(pack, pack.messages[part.id], values);
        case 'value':
          return part.format === 'message'
            ? render(pack, pack.messages[String(values[part.name])], values)
            : String(values[part.name]);
        case 'select':
          return render(
            pack,
            Object.hasOwn(part.cases, String(values[part.name]))
              ? part.cases[String(values[part.name])]
              : part.other,
            values,
          );
      }
    })
    .join('');
}
/** Array views retain source order and multiplicity. No RNG is used here. */
export function dngngenRoomPools(
  pack: DngngenPack,
  slot: DngngenRoomSlot,
): readonly (readonly DngngenEntry[])[] {
  const { A, B, C, D } = pack.pools;
  switch (slot) {
    case 1:
      return [A, B];
    case 2:
      return [A, C];
    case 3:
      return [B, D];
    case 4:
      return [
        [...A, ...B],
        [...C, ...D],
      ];
    default:
      throw new Error('Invalid DNGNGEN room slot.');
  }
}
/** A selection's values are evaluated before the next component selection. */
export function rollDngngenRoom(
  pack: DngngenPack,
  slot: DngngenRoomSlot,
  currentRooms: readonly DngngenRoomResult[] = [],
  rng: RandomSource = random,
): DngngenRoomResult {
  const excluded = new Set(
    currentRooms
      .filter(
        (room) =>
          room.source === 'DNGNGEN' &&
          room.slot !== slot &&
          room.packIdentity === pack.integrity.payloadSha256 &&
          room.snapshotId === pack.snapshot.id,
      )
      .flatMap((room) => room.components.map((component) => component.entryId)),
  );
  const eligible = dngngenRoomPools(pack, slot).map((pool) =>
    pool.filter((entry) => !excluded.has(entry.id)),
  );
  // Reject before drawing anything; never disguise an incomplete room as Core.
  if (eligible.some((pool) => !pool.length))
    throw new Error('DNGNGEN has no eligible descriptions.');
  const components = eligible.map((pool) => {
    const entry = pool[drawIndex(pool.length, rng)];
    const values: Record<string, DngngenValue> = Object.create(null);
    for (const value of entry.values)
      values[value.name] = evaluate(value.recipe, rng);
    return Object.freeze({
      entryId: entry.id,
      values: Object.freeze(values),
      text: render(pack, pack.messages[entry.messageId], values),
    });
  });
  return Object.freeze({
    source: 'DNGNGEN',
    snapshotId: pack.snapshot.id,
    packIdentity: pack.integrity.payloadSha256,
    slot,
    components: Object.freeze(components),
    text: components.map((component) => component.text).join('\n'),
    synthetic: pack.profile === 'synthetic',
    attribution: pack.source.attribution,
    sourceUrl: pack.source.url,
  });
}
/** Full replacement deliberately excludes no stale results from an older batch. */
export function rollDngngenRooms(
  pack: DngngenPack,
  rng: RandomSource = random,
): readonly DngngenRoomResult[] {
  const rooms: DngngenRoomResult[] = [];
  for (const slot of [1, 2, 3, 4] as const)
    rooms.push(rollDngngenRoom(pack, slot, rooms, rng));
  return Object.freeze(rooms);
}
