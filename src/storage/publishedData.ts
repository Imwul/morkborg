import { useSyncExternalStore } from 'react';
import { createPublishedRuntime } from './publishedDataRuntime';
import { readPrivateData, writePrivateData } from './privateData';
import { privateImportGeneration } from './privateUpdateConnection';
import {
  createPublishedDataClient,
  initialPublishedState,
  PUBLISHED_DATA_INTERVAL,
  type PublishedDataState,
  type PublishedPacks,
} from './publishedDataClient';

let state: PublishedDataState = initialPublishedState;
const listeners = new Set<() => void>();
export const usePublishedData = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => state,
  );
export const getPublishedDataState = () => state;
async function fetchPublishedJSON(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(path, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Rulebook service unavailable.');
    const text = await response.text();
    if (text.length > 20_000_000)
      throw new Error('Rulebook response too large.');
    return JSON.parse(text) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

// Load store adapters lazily so their initial loaders can all share this request.
const runWithClient = createPublishedRuntime(async () => {
      const [imports, rules, oracles, fate, updates, registry, validation] =
        await Promise.all([
          import('./privateDataImport'),
          import('./rulesStore'),
          import('./oracleStore'),
          import('./fateChartStore'),
          import('./publishedDataMerge'),
          import('../data/oracles'),
          import('../validation/oracleValidation'),
        ]);
      return createPublishedDataClient({
        read: readPrivateData,
        persist: writePrivateData,
        fetch: fetchPublishedJSON,
        generation: privateImportGeneration,
        active: () => ({
          ...(rules.getRules() ? { library: rules.getRules()! } : {}),
          ...(oracles.getOraclePack()
            ? { oracles: oracles.getOraclePack()! }
            : {}),
          ...(fate.getFateChart() ? { fateChart: fate.getFateChart()! } : {}),
        }),
        parse(input) {
          const parsed = imports.parsePrivateData(input);
          const packs: PublishedPacks = {};
          if (parsed.library) packs.library = parsed.library;
          if (parsed.oracles) packs.oracles = parsed.oracles;
          if (parsed.fateChart) packs.fateChart = parsed.fateChart;
          return packs;
        },
        merge: updates.mergePublishedPacks,
        validate(packs) {
          const issues = validation.validateOracleRegistry(
            registry.buildOracleRegistry(
              packs.library ?? null,
              packs.oracles ?? null,
            ),
          );
          if (issues.length)
            throw new Error('Invalid combined rulebook registry.');
        },
        activate(packs) {
          if (packs.library) rules.setRules(packs.library);
          if (packs.oracles) oracles.setOraclePack(packs.oracles);
          if (packs.fateChart) fate.setFateChart(packs.fateChart);
        },
        onState(next) {
          state = next;
          listeners.forEach((listener) => listener());
        },
      });
}, () => {
  state = {
    ...state, busy: false, connected: false, message: '',
    error: '자료를 준비하지 못했습니다. 네트워크를 확인한 뒤 지금 확인을 다시 누르세요.',
  };
  listeners.forEach((listener) => listener());
});
export async function loadPublishedData() {
  await runWithClient((ready) => ready.check(false, true));
}
export async function checkPublishedData(force = false) {
  await runWithClient((ready) => ready.check(force));
}
export async function setPublishedUpdatesEnabled(enabled: boolean) {
  await runWithClient((ready) => ready.setEnabled(enabled));
}
export function startPublishedDataUpdates() {
  void checkPublishedData();
  const check = () => {
    if (document.visibilityState === 'visible') void checkPublishedData();
  };
  const imported = () => {
    void runWithClient((ready) => ready.afterImport());
  };
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  window.addEventListener('private-data-imported', imported);
  const interval = window.setInterval(check, PUBLISHED_DATA_INTERVAL);
  return () => {
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('online', check);
    window.removeEventListener('private-data-imported', imported);
    window.clearInterval(interval);
  };
}
