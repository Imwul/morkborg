import { useEffect, useState } from 'react';
import {
  isPrivateDngngenHost,
  loadPrivateDngngen,
  type PrivateDngngenState,
} from '../storage/privateDngngenClient';

/** In-memory only. Re-entering preparation or refocusing revalidates the host's snapshot. */
export function usePrivateDngngen(preparing: boolean, referenceId?: string | null) {
  const [state, setState] = useState<PrivateDngngenState>({ status: 'public' });
  useEffect(() => {
    if (!preparing || !isPrivateDngngenHost(document)) return;
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const next = new AbortController();
      controller = next;
      setState({ status: 'loading' });
      void loadPrivateDngngen(true, fetch, next.signal).then((value) => {
        if (!next.signal.aborted) setState(value);
      });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      controller?.abort();
      window.removeEventListener('focus', refresh);
    };
  }, [preparing, referenceId]);
  return state;
}
