/** Coalesce lazy adapter loading, but retry the loader after a failed attempt. */
export function createPublishedRuntime<T>(
  load: () => Promise<T>,
  onError: () => void,
) {
  let client: Promise<T> | null = null;
  const getClient = () => {
    if (!client)
      client = Promise.resolve().then(load).catch((error: unknown) => {
        client = null;
        throw error;
      });
    return client;
  };
  // Used by both explicit Retry and fire-and-forget startup/online/import checks.
  return async (task: (ready: T) => Promise<void>): Promise<void> => {
    try {
      await task(await getClient());
    } catch {
      onError();
    }
  };
}
