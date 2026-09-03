import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import {
  readPrivateData,
  writePrivateData,
  type PrivateData,
} from './privateData';
import { importPrivateData, parsePrivateData } from './privateDataImport';
import { loadRules, type RulesPack } from './rulesStore';
import { loadOraclePack } from './oracleStore';
import { loadFateChart } from './fateChartStore';
import { mergeRuleTranslations } from './ruleTranslations';
import type { OraclePack } from '../domain/oracle';
import {
  parseUpdateConnection,
  privateImportGeneration,
  type UpdateConnection,
} from './privateUpdateConnection';

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  file: z.string().regex(/^\/private-updates\/[a-f0-9]{64}\.json$/),
});
const envelopeSchema = z.object({
  schemaVersion: z.literal(1),
  iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
  data: z.string().min(24).max(28_000_000),
});
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export function updateAAD(revision: number) {
  return new TextEncoder().encode(`morkborg-private-update:v1:${revision}`);
}
export async function decryptPrivateUpdate(
  input: unknown,
  connection: UpdateConnection,
  revision: number,
) {
  const envelope = envelopeSchema.parse(input);
  const key = await crypto.subtle.importKey(
    'raw',
    bytes(connection.key),
    'AES-GCM',
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: bytes(envelope.iv),
      additionalData: updateAAD(revision),
      tagLength: 128,
    },
    key,
    bytes(envelope.data),
  );
  const payload = JSON.parse(new TextDecoder().decode(plain));
  if (payload.revision !== revision)
    throw new Error('자료 버전이 일치하지 않습니다.');
  const parsed = parsePrivateData(payload.bundle);
  // Only the locally imported file may change the download connection.
  delete parsed.updateConnection;
  return parsed;
}
export function mergeOracleTranslations(
  current: OraclePack,
  incoming: OraclePack,
): OraclePack {
  const tables = new Map(incoming.tables.map((t) => [t.id, t]));
  return {
    ...current,
    tables: current.tables.map((table) => {
      const entries = new Map(
        tables.get(table.id)?.entries.map((e) => [e.id, e]),
      );
      return {
        ...table,
        entries: table.entries.map((entry) => {
          const match = entries.get(entry.id);
          return match?.text === entry.text &&
            typeof match.metadata?.ko === 'string'
            ? {
                ...entry,
                metadata: { ...entry.metadata, ko: match.metadata.ko },
              }
            : entry;
        }),
      };
    }),
  };
}

export function mergePrivateLibraryUpdate(
  current: RulesPack,
  incoming: RulesPack,
): RulesPack {
  const translated = mergeRuleTranslations(current, incoming);
  const identity = (r: Record<string, unknown>) =>
    r.id ?? `${String(r.book)}:${String(r.pdfPage)}:${String(r.name)}`;
  return {
    ...translated,
    creatures: [
      ...current.creatures,
      ...incoming.creatures.filter(
        (record) =>
          !current.creatures.some(
            (existing) => identity(existing) === identity(record),
          ),
      ),
    ],
    notes: {
      ...translated.notes,
      ...(incoming.notes.eatPreyKill
        ? { eatPreyKill: incoming.notes.eatPreyKill }
        : {}),
    },
  };
}

let state: {
  connected: boolean;
  enabled: boolean;
  busy: boolean;
  message: string;
  error: string;
} = { connected: false, enabled: false, busy: false, message: '', error: '' };
const listeners = new Set<() => void>();
const emit = (patch: Partial<typeof state>) => {
  state = { ...state, ...patch };
  listeners.forEach((f) => f());
};
export const usePrivateUpdates = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
async function fetchJSON(path: string) {
  // Neither the decryption key nor private data is ever sent to the server.
  const response = await fetch(path, {
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('갱신 자료에 연결할 수 없습니다.');
  const text = await response.text();
  if (text.length > 28_000_000) throw new Error('갱신 자료가 너무 큽니다.');
  return JSON.parse(text) as unknown;
}
let inFlight: Promise<void> | null = null;
let lastCheck = 0;
export function checkPrivateUpdates(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastCheck < 5 * 60 * 1000)
    return Promise.resolve();
  lastCheck = Date.now();
  inFlight = (async () => {
    try {
      const saved = await readPrivateData('updateConnection');
      if (!saved) {
        emit({ connected: false, enabled: false });
        return;
      }
      const connection = parseUpdateConnection(saved);
      emit({ connected: true, enabled: connection.enabled });
      if (!connection.enabled && !force) return;
      emit({ busy: true, error: '', message: '' });
      const generation = privateImportGeneration();
      const manifest = manifestSchema.parse(
        await fetchJSON(connection.manifest),
      );
      if (manifest.revision <= connection.revision) {
        emit({ message: '최신 자료입니다.' });
        return;
      }
      const incoming = await decryptPrivateUpdate(
        await fetchJSON(manifest.file),
        connection,
        manifest.revision,
      );
      await Promise.allSettled([
        loadRules(),
        loadOraclePack(),
        loadFateChart(),
      ]);
      const expected: PrivateData = { updateConnection: saved };
      for (const key of ['library', 'oracles', 'fateChart'] as const)
        expected[key] = await readPrivateData(key);
      if (generation !== privateImportGeneration()) return;
      const current = parsePrivateData({
        kind: 'morkborg-private-data',
        schemaVersion: 1,
        ...Object.fromEntries(
          Object.entries(expected).filter(
            ([key, value]) => key !== 'updateConnection' && value !== undefined,
          ),
        ),
      });
      const merged = {
        ...current,
        ...(incoming.library
          ? {
              library: current.library
                ? mergePrivateLibraryUpdate(current.library, incoming.library)
                : incoming.library,
            }
          : {}),
        ...(incoming.oracles
          ? {
              oracles: current.oracles
                ? mergeOracleTranslations(current.oracles, incoming.oracles)
                : incoming.oracles,
            }
          : {}),
        ...(!current.fateChart && incoming.fateChart
          ? { fateChart: incoming.fateChart }
          : {}),
        updateConnection: { ...connection, revision: manifest.revision },
      };
      await importPrivateData(
        [{ kind: 'morkborg-private-data', schemaVersion: 1, ...merged }],
        (data) => {
          if (generation !== privateImportGeneration())
            throw new Error('새로 가져온 자료를 유지합니다.');
          return writePrivateData(data, expected);
        },
        false,
      );
      emit({ message: '새 번역 자료를 적용했습니다.' });
    } catch {
      emit({
        error:
          '갱신을 마치지 못했습니다. 저장된 자료는 그대로 사용할 수 있습니다.',
      });
    } finally {
      emit({ busy: false });
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
export async function setPrivateUpdatesEnabled(enabled: boolean) {
  try {
    const saved = await readPrivateData('updateConnection');
    if (!saved) return;
    const connection = parseUpdateConnection(saved);
    await writePrivateData(
      { updateConnection: { ...connection, enabled } },
      { updateConnection: saved },
    );
    emit({ enabled, error: '' });
    if (enabled) await checkPrivateUpdates(true);
  } catch {
    emit({ error: '갱신 설정을 저장하지 못했습니다. 다시 시도하세요.' });
  }
}

export function startPrivateUpdates() {
  void checkPrivateUpdates();
  const check = () => {
    if (document.visibilityState === 'visible') void checkPrivateUpdates();
  };
  const imported = () => {
    // An import can finish while the startup check is still reading its old state.
    if (inFlight) {
      void inFlight.then(() => {
        lastCheck = 0;
        void checkPrivateUpdates();
      });
    } else {
      lastCheck = 0;
      void checkPrivateUpdates();
    }
  };
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  window.addEventListener('private-data-imported', imported);
  const interval = window.setInterval(check, 5 * 60 * 1000);
  return () => {
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('online', check);
    window.removeEventListener('private-data-imported', imported);
    window.clearInterval(interval);
  };
}
