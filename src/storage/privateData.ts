export type PrivateDataKey =
  | 'library'
  | 'oracles'
  | 'fateChart'
  | 'updateConnection';
export type PrivateData = Partial<Record<PrivateDataKey, unknown>>;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('이 브라우저에서 개인 자료를 저장할 수 없습니다.'));
      return;
    }
    const request = indexedDB.open('morkborg-private-data', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('packs');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('다른 탭을 닫고 자료 저장을 다시 시도하세요.'));
  });
}

export async function readPrivateData(key: PrivateDataKey): Promise<unknown> {
  if (typeof indexedDB === 'undefined') return undefined;
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction('packs', 'readonly')
        .objectStore('packs')
        .get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/** Commit the complete validated import before changing any active store. */
export async function writePrivateData(
  data: PrivateData,
  expected?: PrivateData,
): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('packs', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error ?? new Error('자료 저장이 취소되었습니다.'));
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore('packs');
      const commit = () => {
        for (const [key, value] of Object.entries(data)) store.put(value, key);
      };
      const checks = Object.entries(expected ?? {});
      if (!checks.length) commit();
      let remaining = checks.length;
      for (const [key, value] of checks) {
        const request = store.get(key);
        request.onsuccess = () => {
          if (JSON.stringify(request.result) !== JSON.stringify(value)) {
            // Another tab imported or updated data after this update was prepared.
            tx.abort();
            return;
          }
          if (!--remaining) commit();
        };
      }
    });
  } finally {
    db.close();
  }
}
