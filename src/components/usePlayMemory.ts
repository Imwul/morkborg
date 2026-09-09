import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  readPlayMemory,
  writePlayMemory,
  type PlayMemory,
} from '../storage/playMemory';
import {
  pushContext,
  validContext,
  type PlayContext,
} from '../domain/playContext';
import {
  appendReplay,
  createReplay,
  type RollReplay,
} from '../domain/rollReplay';
import type { AppSave } from '../domain/types';
import { getPublishedDataState } from '../storage/publishedData';

let sessionMemory = readPlayMemory();
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
export function usePlayMemory(
  save: AppSave,
  current: PlayContext | null,
  notify: (text: string) => void,
) {
  const memory = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [replayId, setReplayId] = useState<string | null>(null);
  const [returnedRoomId, setReturnedRoomId] = useState<string | null>(
    () =>
      memory.contexts.find((c) => c.kind === 'room' && validContext(c, save))
        ?.objectId ?? null,
  );
  function update(fn: (p: PlayMemory) => PlayMemory) {
    changeMemory((p) => {
      const next = fn(p);
      if (JSON.stringify(next) === JSON.stringify(p)) return p;
      try {
        writePlayMemory(next);
      } catch {
        notify('임시 기억을 저장하지 못했습니다. 이 화면에서만 유지합니다.');
      }
      return next;
    });
  }
  const signature = JSON.stringify(current);
  useEffect(() => {
    const next = signature
      ? (JSON.parse(signature) as PlayContext | null)
      : null;
    if (next)
      changeMemory((p) => {
        const origin = p.contexts.find((c) => c.kind !== 'desk');
        // A native Room ledger expansion does not change the app route. Retain that
        // more specific context when the same parent view mounts again after reload.
        if (
          next.kind === 'dungeon' &&
          next.dungeonTab === 'overview' &&
          origin?.kind === 'room' &&
          origin.campaignId === next.campaignId &&
          origin.dungeonId === next.dungeonId
        )
          return p;
        const contexts = pushContext(p.contexts, next);
        if (JSON.stringify(contexts) === JSON.stringify(p.contexts)) return p;
        const updated = { ...p, contexts };
        try {
          writePlayMemory(updated);
        } catch {
          /* Volatile memory still works. */
        }
        return updated;
      });
  }, [signature]);
  const contexts = memory.contexts.filter((c) => validContext(c, save));
  function rememberContext(context: PlayContext) {
    if (validContext(context, save))
      update((p) => ({ ...p, contexts: pushContext(p.contexts, context) }));
  }
  function record(value: Omit<RollReplay, 'id' | 'timestamp'>) {
    const entry = createReplay({
      ...value,
      datasetRevision: getPublishedDataState().revision || undefined,
    });
    update((p) => ({ ...p, replays: appendReplay(p.replays, entry) }));
  }
  return {
    memory,
    contexts,
    update,
    rememberContext,
    record,
    replayId,
    setReplayId,
    returnedRoomId,
    setReturnedRoomId,
  };
}
export type PlayMemoryTools = ReturnType<typeof usePlayMemory>;
