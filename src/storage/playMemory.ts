import { playContextSchema, type PlayContext } from '../domain/playContext';
import { replaySchema, type RollReplay } from '../domain/rollReplay';
export const PLAY_MEMORY_KEY = 'morkborg-play-memory:v1';
export interface PlayMemory {
  schemaVersion: 1;
  contexts: PlayContext[];
  replays: RollReplay[];
}
export const emptyPlayMemory = (): PlayMemory => ({
  schemaVersion: 1,
  contexts: [],
  replays: [],
});
export function readPlayMemory(storage?: Pick<Storage, 'getItem'>): PlayMemory {
  try {
    const raw = JSON.parse(
      (storage ?? sessionStorage).getItem(PLAY_MEMORY_KEY) ?? '{}',
    );
    if (raw?.schemaVersion !== 1) return emptyPlayMemory();
    return {
      schemaVersion: 1,
      contexts: (Array.isArray(raw.contexts)
        ? raw.contexts.slice(0, 5)
        : []
      ).flatMap((v: unknown) => {
        const r = playContextSchema.safeParse(v);
        return r.success ? [r.data] : [];
      }),
      replays: (Array.isArray(raw.replays)
        ? raw.replays.slice(0, 10)
        : []
      ).flatMap((v: unknown) => {
        const r = replaySchema.safeParse(v);
        return r.success ? [r.data] : [];
      }),
    };
  } catch {
    return emptyPlayMemory();
  }
}
export function writePlayMemory(
  value: PlayMemory,
  storage?: Pick<Storage, 'setItem'>,
) {
  (storage ?? sessionStorage).setItem(PLAY_MEMORY_KEY, JSON.stringify(value));
}
