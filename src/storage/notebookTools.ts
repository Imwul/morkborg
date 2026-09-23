import { useSyncExternalStore } from 'react';
import { emptyMythicLists, validateMythicLists } from '../domain/mythicLists';
import { emptyObjectShelf, validateObjectShelf } from '../domain/savedObjects';

/** Small opt-in tools only. Never reads, migrates or overwrites legacy Campaign storage. */
function localTool<T>(
  key: string,
  empty: () => T,
  validate: (value: unknown) => T,
) {
  const initial = empty();
  let cache: T | undefined;
  let error = '';
  const listeners = new Set<() => void>();
  function read() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? validate(JSON.parse(raw)) : empty();
    } catch {
      error = '저장된 자료를 읽지 못했습니다. 원본은 보존되어 있습니다.';
      cache = empty();
    }
    return cache;
  }
  function update(change: (current: T) => T) {
    const current = read();
    if (error) throw new Error(error);
    const next = validate(change(structuredClone(current)));
    localStorage.setItem(key, JSON.stringify(next));
    cache = next;
    listeners.forEach((fn) => fn());
  }
  if (typeof window !== 'undefined')
    window.addEventListener('storage', (event) => {
      if (event.key !== key && event.key !== null) return;
      cache = undefined;
      error = '';
      read();
      listeners.forEach((fn) => fn());
    });
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  };
  return {
    use: () => ({
      value: useSyncExternalStore(subscribe, read, () => initial),
      update,
      error,
    }),
  };
}
export const objectShelfStore = localTool(
  'morkborg-object-shelf:v1',
  emptyObjectShelf,
  validateObjectShelf,
);
export const mythicListsStore = localTool(
  'morkborg-mythic-lists:v1',
  emptyMythicLists,
  validateMythicLists,
);
