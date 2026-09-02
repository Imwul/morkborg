import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { FATE_ODDS, type FateChart } from '../domain/mythic';
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
export async function loadFateChart() {
  if (state.chart) return;
  if (inFlight) return inFlight;
  state = { ...state, loading: true, error: null };
  listeners.forEach((f) => f());
  inFlight = (async () => {
    try {
      const response = await fetch('/rules/mythic-fate.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      state = {
        chart: parseFateChart(await response.json()),
        loading: false,
        error: null,
      };
    } catch {
      state = {
        chart: null,
        loading: false,
        error:
          '원문 Fate Chart 자료를 불러오지 못했습니다. 다시 불러오거나 Fate Check를 사용하세요.',
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
