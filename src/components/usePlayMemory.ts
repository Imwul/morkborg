import { useState, useSyncExternalStore } from 'react';
import {
  appendReplay,
  createReplay,
  type RollReplay,
} from '../domain/rollReplay';
import { getPublishedDataState } from '../storage/publishedData';

// Readings expire with this browser document. Older saved data remains untouched.
interface PlayMemory {
  replays: RollReplay[];
}
let sessionMemory: PlayMemory = { replays: [] };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => sessionMemory;
function changeMemory(fn: (p: PlayMemory) => PlayMemory) {
  const next = fn(sessionMemory);
  if (next === sessionMemory) return;
  sessionMemory = next;
  listeners.forEach((listener) => listener());
}
export function usePlayMemory() {
  const memory = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [replayId, setReplayId] = useState<string | null>(null);
  function update(fn: (p: PlayMemory) => PlayMemory) {
    changeMemory((p) => {
      const next = fn(p);
      if (JSON.stringify(next) === JSON.stringify(p)) return p;
      return next;
    });
  }
  function record(value: Omit<RollReplay, 'id' | 'timestamp'>) {
    const entry = createReplay({
      ...value,
      datasetRevision: getPublishedDataState().revision || undefined,
    });
    changeMemory((p) => ({ ...p, replays: appendReplay(p.replays, entry) }));
  }
  return {
    memory,
    update,
    record,
    replayId,
    setReplayId,
  };
}
export type PlayMemoryTools = ReturnType<typeof usePlayMemory>;
