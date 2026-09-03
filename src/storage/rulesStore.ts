import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { readPrivateData } from './privateData';
import { mergeRuleTranslations } from './ruleTranslations';
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
  'core.sparks',
  'core.status',
  'core.inhabitants',
  'core.feature',
  'core.danger',
  'core.treasures',
  'core.rooms',
  'core.traps',
  'reclvse.dungeonPurposeThen',
  'reclvse.questEncounterHook',
  'reclvse.dungeonEntrance',
  'reclvse.entranceState',
  'reclvse.arcaneEncounter',
  'reclvse.roomPurpose',
  'reclvse.dressing',
  'reclvse.roomLoot',
  'reclvse.roomEncounter',
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
  if (
    pack.tables['core.treasures']?.entries.some((e) =>
      /^d10\s+Occult treasures$/i.test(e.text.trim()),
    )
  )
    throw new Error(
      '보물 표에 표 제목이 섞여 있습니다. 교정된 개인 자료를 다시 불러오세요.',
    );
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
export function parseRulesPack(input: unknown): RulesPack {
  const pack = schema.parse(input);
  validateGeneratorTables(pack);
  return pack;
}
export function setRules(input: unknown, persist = false) {
  const pack = parseRulesPack(input);
  if (persist) localStorage.setItem('morkborg-rules:v1', JSON.stringify(pack));
  state = { pack, error: null, loading: false };
  emit();
}
let inFlight: Promise<void> | null = null;
let localTranslations: Promise<void> | null = null;
function refreshLocalTranslations(): Promise<void> {
  // Private source files exist only on the local development server.
  if (!import.meta.env?.DEV) return Promise.resolve();
  if (localTranslations) return localTranslations;
  localTranslations = (async () => {
    const previous = state.pack;
    if (!previous) return;
    try {
      const response = await fetch('/rules/library.json', {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const incoming = parseRulesPack(await response.json());
      if (!incoming.notes.translationEdition || state.pack !== previous) return;
      setRules(mergeRuleTranslations(previous, incoming));
    } catch {
      // Keep all saved data usable if the local translation file is unavailable.
    }
  })();
  return localTranslations;
}
export function loadRules(): Promise<void> {
  if (state.pack) return refreshLocalTranslations();
  if (inFlight) return inFlight;
  state = { pack: null, error: null, loading: true };
  emit();
  inFlight = (async () => {
    try {
      const local =
        typeof indexedDB === 'undefined'
          ? undefined
          : await readPrivateData('library');
      if (local && !state.pack) setRules(local);
      if (state.pack) return refreshLocalTranslations();
    } catch {
      /* A damaged private pack must not prevent trying the local source. */
    }
    if (state.pack) return refreshLocalTranslations();
    try {
      const local = localStorage.getItem('morkborg-rules:v1');
      if (local) {
        setRules(JSON.parse(local));
        return refreshLocalTranslations();
      }
    } catch {
      /* Retry the bundled local source if a saved pack is obsolete. */
    }
    try {
      const response = await fetch('/rules/library.json');
      if (!response.ok) throw new Error(`자료 응답: HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!state.pack) setRules(data);
    } catch (error) {
      if (!state.pack) {
        state = {
          pack: null,
          loading: false,
          error: `생성표를 불러오지 못했습니다. 다시 불러오거나 자료 및 규칙에서 개인 자료를 가져오세요. ${error instanceof Error ? error.message : ''}`,
        };
        emit();
      }
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
if (import.meta.hot) {
  const previous = import.meta.hot.data.rulesState as typeof state | undefined;
  if (previous?.pack) {
    try {
      validateGeneratorTables(previous.pack);
      state = previous;
    } catch {
      /* Load the corrected pack below. */
    }
  }
  import.meta.hot.dispose((data) => {
    data.rulesState = state;
  });
}
export function sourceCitation(tableId: string): string {
  const table = state.pack?.tables[tableId];
  if (!table) return '원문 표 없음 · 직접 작성';
  const book = state.pack?.books.find((b) => b.id === table.book);
  return `${book?.title ?? table.book} · PDF ${table.pages.join(', ')}쪽 · ${table.title}`;
}

if (typeof window !== 'undefined') void loadRules();
