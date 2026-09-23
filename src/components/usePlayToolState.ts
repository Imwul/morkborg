import { useState } from 'react';
import { useReferenceDesk } from './ReferenceContext';
/** One current tool value per reader in this document; never localStorage or a journal. */
export function usePlayToolState<T>(key: string, initial: T) {
  const cache = useReferenceDesk()?.toolState;
  const [value, setValue] = useState<T>(() =>
    cache?.has(key) ? (cache.get(key) as T) : initial,
  );
  function update(next: T) {
    cache?.set(key, next);
    setValue(next);
  }
  return [value, update] as const;
}
