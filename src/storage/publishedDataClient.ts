import { z } from 'zod';
import type { PrivateData, PrivateDataKey } from './privateData';
import type { ParsedPrivateData } from './privateDataImport';
import {
  defaultPublishedConnection,
  publishedConnectionSchema,
} from './publishedDataConnection';

export type PublishedPacks = Pick<
  ParsedPrivateData,
  'library' | 'oracles' | 'fateChart'
>;
export const PUBLISHED_DATA_INTERVAL = 5 * 60 * 1000;
const keys = ['library', 'oracles', 'fateChart'] as const;
const responseSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  bundle: z.unknown().optional(),
});
export interface PublishedDataState {
  enabled: boolean;
  connected: boolean;
  busy: boolean;
  revision: number;
  message: string;
  error: string;
}
export const initialPublishedState: PublishedDataState = {
  enabled: true,
  connected: false,
  busy: false,
  revision: 0,
  message: '',
  error: '',
};
interface Dependencies {
  read: (key: PrivateDataKey) => Promise<unknown>;
  persist: (data: PrivateData, expected: PrivateData) => Promise<void>;
  fetch: (path: string) => Promise<unknown>;
  active: () => PublishedPacks;
  parse: (input: unknown) => PublishedPacks;
  merge: (current: PublishedPacks, incoming: PublishedPacks) => PublishedPacks;
  validate: (packs: PublishedPacks) => void;
  activate: (packs: PublishedPacks) => void;
  generation: () => number;
  now?: () => number;
  onState?: (state: PublishedDataState) => void;
}

/** One read/validate/commit for all loaders; never writes campaign storage. */
export function createPublishedDataClient(deps: Dependencies) {
  let state = { ...initialPublishedState };
  let inFlight: Promise<void> | null = null;
  let lastCheck: number | null = null;
  const now = deps.now ?? Date.now;
  const emit = (patch: Partial<PublishedDataState>) => {
    state = { ...state, ...patch };
    deps.onState?.(state);
  };
  const parseOne = (key: (typeof keys)[number], value: unknown) => {
    if (value === undefined) return {};
    try {
      return deps.parse({
        kind: 'morkborg-private-data',
        schemaVersion: 1,
        [key]: value,
      });
    } catch {
      return {};
    }
  };
  const check = (force = false, fillMissing = false): Promise<void> => {
    if (inFlight) return inFlight;
    if (
      !force &&
      !fillMissing &&
      lastCheck !== null &&
      now() - lastCheck < PUBLISHED_DATA_INTERVAL
    )
      return Promise.resolve();
    const generation = deps.generation();
    inFlight = (async () => {
      try {
        const expected: PrivateData = Object.fromEntries(
          await Promise.all(
            [...keys, 'serverConnection' as const].map(async (key) => [
              key,
              await deps.read(key),
            ]),
          ),
        );
        const connection =
          publishedConnectionSchema.safeParse(expected.serverConnection).data ??
          defaultPublishedConnection;
        const current: PublishedPacks = { ...deps.active() };
        for (const key of keys)
          Object.assign(current, parseOne(key, expected[key]));
        const missing = keys.some((key) => !current[key]);
        emit({ enabled: connection.enabled, revision: connection.revision });
        if (!connection.enabled && !force && !(fillMissing && missing)) return;
        lastCheck = now();
        emit({ busy: true, error: '', message: '' });
        const response = responseSchema.parse(
          await deps.fetch(
            `/api/rulebook-data?revision=${missing ? 0 : connection.revision}`,
          ),
        );
        if (generation !== deps.generation()) return;
        if (!missing && response.revision <= connection.revision) {
          emit({ connected: true, message: '최신 자료입니다.' });
          return;
        }
        const incoming = deps.parse(response.bundle);
        if (keys.some((key) => !incoming[key]))
          throw new Error('Incomplete server bundle.');
        // With updates paused, a missing pack can still be loaded for first use.
        const merged =
          !connection.enabled && !force
            ? { ...incoming, ...current }
            : deps.merge(current, incoming);
        deps.validate(merged);
        if (generation !== deps.generation()) return;
        const nextConnection = {
          ...connection,
          revision:
            connection.enabled || force
              ? response.revision
              : connection.revision,
        };
        await deps.persist(
          { ...merged, serverConnection: nextConnection },
          expected,
        );
        if (generation !== deps.generation()) return;
        deps.activate(merged);
        emit({
          connected: true,
          revision: nextConnection.revision,
          message: missing
            ? '룰북·Oracle·Fate Chart 자료를 불러왔습니다.'
            : '새 자료와 번역을 적용했습니다.',
        });
      } catch {
        if (generation === deps.generation())
          emit({
            error:
              '서버 자료를 확인하지 못했습니다. 저장된 자료는 그대로 사용할 수 있습니다.',
          });
      } finally {
        emit({ busy: false });
      }
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
  const setEnabled = async (enabled: boolean) => {
    try {
      const saved = await deps.read('serverConnection');
      const previous =
        publishedConnectionSchema.safeParse(saved).data ??
        defaultPublishedConnection;
      await deps.persist(
        { serverConnection: { ...previous, enabled } },
        { serverConnection: saved },
      );
      emit({ enabled, error: '' });
      if (enabled) {
        if (inFlight) await inFlight;
        await check(true);
      }
    } catch {
      emit({ error: '자동 확인 설정을 저장하지 못했습니다. 다시 시도하세요.' });
    }
  };
  return {
    check,
    setEnabled,
    getState: () => state,
    async afterImport() {
      if (inFlight) await inFlight;
      lastCheck = null;
      await check();
    },
  };
}
