import { useSyncExternalStore } from 'react';
import { z } from 'zod';
export interface RuleEntry {
  text: string;
  weight: number;
  meta: Record<string, unknown>;
  followup?: RuleEntry[];
}
export interface RuleTable {
  book: string;
  title: string;
  pages: number[];
  dice: string | string[];
  entries: RuleEntry[];
}
export interface RuleBook {
  id: string;
  title: string;
  fileName: string;
  status: string;
}
export interface RulesPack {
  schemaVersion: 1;
  books: RuleBook[];
  tables: Record<string, RuleTable>;
  creatures: Record<string, unknown>[];
  outcasts: Record<string, unknown>[];
  notes: Record<string, unknown>;
}
const entry: z.ZodType<RuleEntry> = z.lazy(() =>
  z.object({
    text: z.string(),
    weight: z.number().positive(),
    meta: z.record(z.string(), z.unknown()),
    followup: z.array(entry).optional(),
  }),
);
const schema = z.object({
  schemaVersion: z.literal(1),
  books: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      fileName: z.string(),
      status: z.string(),
    }),
  ),
  tables: z.record(
    z.string(),
    z.object({
      book: z.string(),
      title: z.string(),
      pages: z.array(z.number()),
      dice: z.union([z.string(), z.array(z.string())]),
      entries: z.array(entry).min(1),
    }),
  ),
  creatures: z.array(z.record(z.string(), z.unknown())),
  outcasts: z.array(z.record(z.string(), z.unknown())),
  notes: z.record(z.string(), z.unknown()),
});
const requiredTables = [
  'core.names',
  'core.titleA',
  'core.titleB',
  'core.containers',
  'core.gearA',
  'core.gearB',
  'core.sacred',
  'core.unclean',
  'core.weapons',
  'core.armor',
  'core.traits',
  'core.bodies',
  'feretory.A',
  'feretory.B',
  'feretory.C',
  'feretory.desire',
  'feretory.trait',
  'sd.stockCreatures',
  'sd.npc.profession',
  'sd.npc.disposition',
  'reclvse.strangeMeeting',
  'reclvse.immediateGoal',
  'reclvse.entranceSigns',
  'reclvse.socialComplication',
  'reclvse.encounterAftermath',
  'reclvse.npcAppearance',
  'reclvse.npcMotivation',
];
function validateGeneratorTables(pack: RulesPack) {
  const missing = requiredTables.filter((key) => !pack.tables[key]);
  if (missing.length)
    throw new Error(
      `생성기에 필요한 원문 표가 없습니다: ${missing.join(', ')}`,
    );
  for (const [key, min] of Object.entries({
    'core.weapons': 10,
    'core.armor': 4,
    'feretory.A': 12,
    'feretory.B': 12,
    'feretory.C': 12,
    'sd.stockCreatures': 12,
  })) {
    if (pack.tables[key].entries.length < min)
      throw new Error(`${key}: 원문 표의 항목이 부족합니다.`);
  }
  for (const entry of pack.tables['reclvse.contentsCategory']?.entries ?? []) {
    const sub = String(entry.meta.subtableId);
    if (
      !['roomHazard', 'roomEncounter', 'roomLoot', 'roomDiscovery'].includes(
        sub,
      ) ||
      !pack.tables['reclvse.' + sub]
    )
      throw new Error(`연결된 방 내용 표를 확인하세요: ${sub}`);
  }
  for (const key of ['core.gearA', 'core.gearB'])
    for (const entry of pack.tables[key].entries) {
      if (
        entry.meta.scrollTable &&
        !(
          typeof entry.meta.scrollTable === 'string' &&
          ['sacred', 'unclean'].includes(entry.meta.scrollTable)
        )
      )
        throw new Error('장비 표의 두루마리 연결을 확인하세요.');
    }
}
let state: { pack: RulesPack | null; error: string | null; loading: boolean } =
  { pack: null, error: null, loading: true };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const useRules = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
export const getRules = () => state.pack;
export function setRules(input: unknown, persist = false) {
  const pack = schema.parse(input);
  validateGeneratorTables(pack);
  if (persist) localStorage.setItem('morkborg-rules:v1', JSON.stringify(pack));
  state = { pack, error: null, loading: false };
  emit();
}
export async function loadRules() {
  try {
    const local = localStorage.getItem('morkborg-rules:v1');
    if (local) {
      setRules(JSON.parse(local));
      return;
    }
  } catch {
    /* A valid local source pack can still be loaded below. */
  }
  try {
    const response = await fetch('/rules/library.json');
    if (!response.ok) throw new Error();
    setRules(await response.json());
  } catch {
    state = {
      pack: null,
      error: '책 자료를 불러오세요. 원문 생성표는 개인 자료로 별도 보관됩니다.',
      loading: false,
    };
    emit();
  }
}
export function sourceCitation(tableId: string): string {
  const table = state.pack?.tables[tableId];
  if (!table) return '원문 표 없음 · 직접 작성';
  const book = state.pack?.books.find((b) => b.id === table.book);
  return `${book?.title ?? table.book} · PDF ${table.pages.join(', ')}쪽 · ${table.title}`;
}
