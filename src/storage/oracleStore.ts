import { useMemo, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { ORACLE_CATEGORIES, type OraclePack } from '../domain/oracle';
import { buildOracleRegistry } from '../data/oracles';
import { useRules } from './rulesStore';
import { validateOracleRegistry } from '../validation/oracleValidation';
import { readPrivateData } from './privateData';
const tableSchema = z.object({
  id: z.string().min(1),
  sourceBookId: z.string().min(1),
  sourcePage: z.union([
    z.number().int().positive(),
    z.array(z.number().int().positive()),
    z.null(),
  ]),
  title: z.string().min(1),
  category: z.enum(ORACLE_CATEGORIES),
  dice: z.string(),
  originalDice: z.string().optional(),
  printedPage: z.union([z.number(), z.string(), z.null()]).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  sourceVerified: z.boolean(),
  section: z.string().optional(),
  sourceNote: z.string().optional(),
  licenseNote: z.string().optional(),
  duplicatePages: z.array(z.number().int().positive()).optional(),
  rollable: z.boolean().optional(),
  allowedGaps: z.array(z.number().int()).optional(),
  allowOverlap: z.boolean().optional(),
  entries: z
    .array(
      z.object({
        id: z.string().min(1),
        min: z.number().int(),
        max: z.number().int(),
        text: z.string(),
        tags: z.array(z.string()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        sourceUnclear: z.boolean().optional(),
      }),
    )
    .min(1),
});
const schema = z.object({
  schemaVersion: z.literal(1),
  books: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      fileName: z.string().optional(),
    }),
  ),
  tables: z.array(tableSchema),
  procedures: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      oracleIds: z.array(z.string()).min(1),
      description: z.string().optional(),
      rollLabels: z.array(z.string()).optional(),
    }),
  ),
  overrides: z
    .record(z.string(), tableSchema.omit({ id: true, entries: true }).partial())
    .optional(),
  entrySelectors: z
    .record(
      z.string(),
      z.array(z.object({ min: z.number().int(), max: z.number().int() })),
    )
    .optional(),
});
export function parseOraclePack(input: unknown): OraclePack {
  return schema.parse(input);
}
let state: { pack: OraclePack | null; loading: boolean; error: string | null } =
  { pack: null, loading: true, error: null };
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const emit = () => listeners.forEach((fn) => fn());
export const getOraclePack = () => state.pack;
export function setOraclePack(input: unknown) {
  const pack = parseOraclePack(input);
  state = { pack, loading: false, error: null };
  emit();
}
export async function loadOraclePack() {
  if (state.pack) return;
  if (inFlight) return inFlight;
  state = { ...state, loading: true, error: null };
  emit();
  inFlight = (async () => {
    try {
      const local =
        typeof indexedDB === 'undefined'
          ? undefined
          : await readPrivateData('oracles');
      if (local && !state.pack) setOraclePack(local);
      if (state.pack) return;
    } catch {
      /* Keep the source fallback available if a stored pack is damaged. */
    }
    if (state.pack) return;
    try {
      const response = await fetch('/rules/oracles.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!state.pack) setOraclePack(data);
    } catch (e) {
      if (!state.pack)
        state = {
          pack: null,
          loading: false,
          error: `이 브라우저에 Oracle 자료가 없습니다. 개인 자료 JSON을 가져오세요. ${e instanceof Error ? e.message : ''}`,
        };
    }
    emit();
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
export function useOracleRegistry() {
  const rules = useRules();
  const extra = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  const registry = useMemo(
    () => buildOracleRegistry(rules.pack, extra.pack),
    [rules.pack, extra.pack],
  );
  const issues = useMemo(() => validateOracleRegistry(registry), [registry]);
  return {
    registry,
    issues,
    loading: rules.loading || extra.loading,
    error: extra.error ?? rules.error,
  };
}
if (typeof window !== 'undefined') void loadOraclePack();
