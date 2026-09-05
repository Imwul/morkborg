import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { FATE_ODDS, type FateChart } from '../domain/mythic';
import { readPrivateData } from './privateData';
import { loadPublishedData } from './publishedData';
const cell = z
  .object({
    exceptionalYes: z.number().int().min(1).max(100).nullable(),
    yes: z.number().int().min(1).max(99),
    exceptionalNo: z.number().int().min(1).max(100).nullable(),
  })
  .refine(
    (c) =>
      (c.exceptionalYes === null || c.exceptionalYes <= c.yes) &&
      (c.exceptionalNo === null || c.exceptionalNo > c.yes),
  );
const schema = z
  .object({
    schemaVersion: z.literal(1),
    sourcePage: z.literal(20),
    printedPage: z.literal(19),
    sourceVerified: z.literal(true),
    rows: z
      .array(
        z.object({
          odds: z.enum(FATE_ODDS.map((o) => o.id)),
          cells: z.array(cell).length(9),
        }),
      )
      .length(9),
  })
  .refine((c) => new Set(c.rows.map((r) => r.odds)).size === 9);
export const parseFateChart = (value: unknown): FateChart =>
  schema.parse(value);
let state: { chart: FateChart | null; loading: boolean; error: string | null } =
  { chart: null, loading: false, error: null };
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
export const getFateChart = () => state.chart;
export function setFateChart(input: unknown) {
  const chart = parseFateChart(input);
  state = { chart, loading: false, error: null };
  listeners.forEach((f) => f());
}
export async function loadFateChart() {
  if (state.chart) return;
  if (inFlight) return inFlight;
  state = { ...state, loading: true, error: null };
  listeners.forEach((f) => f());
  inFlight = (async () => {
    if (typeof window !== 'undefined' && !import.meta.env?.DEV) {
      try {
        await loadPublishedData();
      } catch {
        /* The clear unavailable state below also covers a failed runtime chunk. */
      }
      if (!state.chart) {
        state = {
          ...state,
          loading: false,
          error:
            '검증된 룰북 자료를 불러오지 못했습니다. 서버 자료를 다시 확인하거나 개인 자료를 가져오세요.',
        };
        listeners.forEach((listener) => listener());
      }
      return;
    }
    try {
      const local =
        typeof indexedDB === 'undefined'
          ? undefined
          : await readPrivateData('fateChart');
      if (local && !state.chart) setFateChart(local);
      if (state.chart) return;
    } catch {
      /* Keep the source fallback available if a stored chart is damaged. */
    }
    if (state.chart) return;
    try {
      if (typeof window !== 'undefined') {
        await loadPublishedData();
        if (state.chart) return;
        if (!import.meta.env?.DEV)
          throw new Error('Rulebook service unavailable.');
      }
      const response = await fetch('/rules/mythic-fate.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data: unknown = await response.json();
      if (!state.chart) setFateChart(data);
    } catch {
      if (!state.chart)
        state = {
          chart: null,
          loading: false,
          error:
            'Fate Chart 자료를 불러오지 못했습니다. 서버 자료를 다시 확인해 주세요. Fate Check는 바로 사용할 수 있습니다.',
        };
    }
    listeners.forEach((f) => f());
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
export function useFateChart() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
}
