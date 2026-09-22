import { parseMonsterSitePack, type MonsterSitePack } from '../domain/monsterSitePack';
import { parseScvmPack, type ScvmPack } from '../domain/scvmPack';
import { isPrivateDngngenHost } from './privateDngngenClient';

export const parsePrivateScvm = (input: unknown): ScvmPack =>
  parseScvmPack(input, { allowSynthetic: true });
export const parsePrivateMonster = (input: unknown): MonsterSitePack =>
  parseMonsterSitePack(input, { allowSynthetic: true });

export type PrivateGeneratorState<T> =
  | { status: 'public' | 'loading' }
  | { status: 'unavailable'; reason: 'missing' | 'invalid' | 'connection' }
  | { status: 'ready'; pack: T };

export async function loadPrivateGenerator<T>(
  endpoint: '/__private/scvmbirther' | '/__private/monster',
  parse: (input: unknown) => T,
  enabled: boolean,
  request: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<PrivateGeneratorState<T>> {
  if (!enabled) return { status: 'public' };
  try {
    const response = await request(endpoint, {
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
        return { status: 'ready', pack: parse(value.pack) };
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

export { isPrivateDngngenHost };
