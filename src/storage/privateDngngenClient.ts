import { parseDngngenPack, type DngngenPack } from '../domain/dngngenPack';

export type PrivateDngngenState =
  | { status: 'public' | 'loading' }
  | { status: 'unavailable'; reason: 'missing' | 'invalid' | 'connection' }
  | { status: 'ready'; pack: DngngenPack };

/** Local hosts and protected hosted builds opt in; ordinary public pages never probe these APIs. */
export function isPrivateDngngenHost(
  document: Pick<Document, 'querySelector'>,
) {
  return (
    document
      .querySelector(
        'meta[name="reference-desk-private"], meta[name="reference-desk-hosted-generators"]',
      )
      ?.getAttribute('content') === 'enabled'
  );
}

export async function loadPrivateDngngen(
  enabled: boolean,
  request: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<PrivateDngngenState> {
  if (!enabled) return { status: 'public' };
  try {
    const response = await request('/__private/dngngen', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { status: 'unavailable', reason: 'connection' };
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object')
      return { status: 'unavailable', reason: 'invalid' };
    if ('status' in value && value.status === 'ready' && 'pack' in value) {
      try {
        return {
          status: 'ready',
          pack: parseDngngenPack(value.pack, { allowSynthetic: true }),
        };
      } catch {
        return { status: 'unavailable', reason: 'invalid' };
      }
    }
    return {
      status: 'unavailable',
      reason:
        'reason' in value && value.reason === 'missing' ? 'missing' : 'invalid',
    };
  } catch {
    return { status: 'unavailable', reason: 'connection' };
  }
}
