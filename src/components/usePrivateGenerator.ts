import { useEffect, useState } from 'react';
import {
  isPrivateDngngenHost,
  loadPrivateGenerator,
  type PrivateGeneratorState,
} from '../storage/privateGeneratorClient';

/** In memory only. Refocus asks the private host for the current snapshot. */
export function usePrivateGenerator<T>(
  endpoint: '/__private/scvmbirther' | '/__private/monster',
  parse: (input: unknown) => T,
  active: boolean,
) {
  const [state, setState] = useState<PrivateGeneratorState<T>>({ status: 'public' });
  useEffect(() => {
    if (!active || !isPrivateDngngenHost(document)) return;
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const next = new AbortController();
      controller = next;
      setState({ status: 'loading' });
      void loadPrivateGenerator(endpoint, parse, true, fetch, next.signal).then((value) => {
        if (!next.signal.aborted) setState(value);
      });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      controller?.abort();
      window.removeEventListener('focus', refresh);
    };
  }, [active, endpoint, parse]);
  return state;
}
