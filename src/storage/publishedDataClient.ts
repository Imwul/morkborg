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
    return deps.parse({
      kind: 'morkborg-private-data',
      schemaVersion: 1,
      [key]: value,
    });
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
      let usableCache = false;
      let rejectedCache = false;
      let versionMismatch = false;
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
        let current: PublishedPacks = {};
        for (const source of [deps.active(), expected])
          for (const key of keys) {
            try {
              Object.assign(current, parseOne(key, source[key]));
            } catch {
              rejectedCache = true;
            }
          }
        if (keys.every((key) => !!current[key])) {
          try {
            deps.validate(current);
            usableCache = true;
          } catch {
            rejectedCache = true;
            current = {};
          }
        }
        // Only a complete, jointly validated cache may activate on a production reload.
        if (
          usableCache &&
          generation === deps.generation() &&
          JSON.stringify(current) !== JSON.stringify(deps.active())
        )
          deps.activate(current);
        const missing = !usableCache || rejectedCache;
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
        if (response.revision < connection.revision) {
          versionMismatch = true;
          throw new Error(
            'Server revision is older than the accepted revision.',
          );
        }
        if (!missing && response.revision === connection.revision) {
          emit({ connected: true, message: '최신 자료입니다.' });
          return;
        }
        const incoming = deps.parse(response.bundle);
        if (keys.some((key) => !incoming[key]))
          throw new Error('Incomplete server bundle.');
        deps.validate(incoming);
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
            connected: false,
            error: versionMismatch
              ? '서버 자료의 버전이 저장된 버전보다 이전입니다. 자료를 바꾸지 않았습니다. 서버 배포를 확인하세요.'
              : usableCache
                ? '서버 자료를 확인하지 못했습니다. 저장된 자료는 그대로 사용할 수 있습니다.'
                : rejectedCache
                  ? '저장된 자료가 손상되었거나 서로 맞지 않습니다. 서버 자료 다시 확인 또는 개인 자료 가져오기로 복구하세요.'
                  : '룰북 자료를 불러오지 못했습니다. 서버 자료 다시 확인 또는 개인 자료 가져오기를 사용하세요.',
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
