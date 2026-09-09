import type { OracleDefinition, OracleRegistry } from './oracle';
import type { ReferenceEntry } from './references';
import type { ReferenceReading } from './referenceReading';
import { readingFromOracleRolls } from './manualReferenceRoll';
import { rollOracle } from '../generators/oracleRoller';
import { npcTablesFor, rerollNPC } from '../generators/content';
import {
  npcReferenceReading,
  executeReference,
  type ReferenceExecutionOptions,
} from './referenceExecution';
import { oracleLibraryRollIds } from '../data/oracles/library';
import { appPolicy } from './generationAuthority';

export type ComponentRelation =
  | 'INDEPENDENT'
  | 'DEPENDENT'
  | 'PARENT'
  | 'CHILD';
export interface HoldComponent {
  id: string;
  label: string;
  value: string;
  relation: ComponentRelation;
}
const INDEPENDENT_PROCEDURES = new Set([
  'reclvse.action-theme',
  'sd.room-description',
  'sd.material',
  'sd.sound',
  'heretic.graves-loot-bodies',
]);
/** Deliberate allowlist of existing independent pairings. Unknown procedures are atomic. */
export function independentTables(
  entry: ReferenceEntry,
  registry: OracleRegistry,
): OracleDefinition[] {
  const a = entry.action;
  const ids =
    a?.kind === 'oracle'
      ? a.oracleIds
      : a?.kind === 'procedure'
        ? registry.procedures.find((p) => p.id === a.procedureId)?.oracleIds
        : undefined;
  if (
    !ids?.length ||
    ids.some(
      (id) =>
        id.startsWith('feretory.') &&
        ['feretory.A', 'feretory.B', 'feretory.C'].includes(id),
    )
  )
    return [];
  if (a?.kind === 'procedure' && !INDEPENDENT_PROCEDURES.has(a.procedureId))
    return [];
  if (
    a?.kind === 'oracle' &&
    ids.length > 1 &&
    JSON.stringify(oracleLibraryRollIds(ids[0])) !== JSON.stringify(ids)
  )
    return [];
  if (ids.includes('aitc.notable-artefact-type')) return []; // parent-controlled follow-up procedure
  const tables = ids.map((id) => registry.tables.find((t) => t.id === id));
  return tables.every(
    (t): t is OracleDefinition =>
      !!t && t.sourceVerified && t.rollable !== false,
  )
    ? tables
    : [];
}
const NPC_LABELS = {
  name: 'Name · 이름',
  archetype: 'Profession · 직업',
  appearance: 'Appearance · 외모',
  behaviour: 'Behaviour · 행동',
  personality: 'Personality · 성격',
  wants: 'Wants · 원하는 것',
  reaction: 'Reaction · 반응',
};
export function holdComponents(
  entry: ReferenceEntry,
  reading: ReferenceReading | undefined,
  registry: OracleRegistry,
): HoldComponent[] {
  if (!reading) return [];
  if (reading.npcSnapshot)
    return Object.entries(NPC_LABELS)
      .filter(
        ([key]) =>
          npcTablesFor(key, reading.npcSnapshot!.region, registry).length,
      )
      .map(([key, label]) => ({
        id: key,
        label,
        value: reading.npcSnapshot![key as keyof typeof NPC_LABELS],
        relation: 'INDEPENDENT',
      }));
  const tables = independentTables(entry, registry);
  if (tables.length > 1 && reading.oracle?.rolls.length === tables.length)
    return reading.oracle.rolls.map((r, n) => ({
      id: String(n),
      label: r.title,
      value: r.text,
      relation: 'INDEPENDENT',
    }));
  if (reading.rareMonster)
    return reading.rareMonster.components.map((c, n) => ({
      id: String(n),
      label: c.title,
      value: c.text,
      relation: n < 2 ? 'PARENT' : 'CHILD',
    }));
  if (reading.oracle?.rolls.some((r) => r.oracleId === 'feretory.hp'))
    return reading.oracle.rolls.map((r, n) => ({
      id: String(n),
      label: r.title,
      value: r.text,
      relation: r.oracleId === 'feretory.hp' ? 'CHILD' : 'PARENT',
    }));
  return [];
}
export function rerollHeldReference(
  entry: ReferenceEntry,
  reading: ReferenceReading,
  held: string[],
  options: ReferenceExecutionOptions,
  only?: string,
): ReferenceReading {
  const components = holdComponents(entry, reading, options.registry),
    independent = components.filter((c) => c.relation === 'INDEPENDENT');
  if (only && held.includes(only)) return reading;
  if (!independent.length) {
    if (held.length || only)
      throw new Error(
        '서로 종속된 결과는 부분 재굴림할 수 없습니다. 전체 절차를 다시 실행하세요.',
      );
    return executeReference(entry, options) ?? reading;
  }
  if (
    held.some((key) => !independent.some((c) => c.id === key)) ||
    (only && !independent.some((c) => c.id === only))
  )
    throw new Error('이 결과에 없는 고정 항목입니다.');
  const changing = independent.filter(
    (c) => !held.includes(c.id) && (!only || only === c.id),
  );
  if (!changing.length) return reading;
  if (reading.npcSnapshot) {
    const npc = structuredClone(reading.npcSnapshot);
    for (const c of changing) {
      if (
        npc.fieldProvenance?.[c.id]?.origin === 'source-edited' ||
        npc.fieldProvenance?.[c.id]?.origin === 'manual'
      )
        continue;
      rerollNPC(npc, c.id, options.registry, options.rng);
    }
    return {
      ...npcReferenceReading(npc),
      rollMethod: { kind: 'APP_ROLL' },
      authority: [appPolicy('workbench.npc'), appPolicy('app.held-results')],
    };
  }
  const rolls = [...reading.oracle!.rolls];
  for (const c of changing) {
    const n = Number(c.id);
    const original = reading.oracle!.rolls[n];
    const rolled = rollOracle(
      options.registry.tables.find((t) => t.id === original.oracleId)!,
      options.registry,
      options.rng,
    );
    rolls[n] = {
      ...rolled,
      title: original.title,
      metadata: { ...rolled.metadata, rollOrigin: 'APP_ROLL' },
    };
  }
  const anyManual = rolls.some((r) => r.metadata?.rollOrigin === 'USER_ROLL');
  return {
    ...readingFromOracleRolls(reading.title, rolls, options.registry),
    rollMethod: { kind: anyManual ? 'MIXED' : 'APP_ROLL' },
    authority: [
      ...(reading.authority ?? []).filter(
        (a) => a.id !== 'app.held-results' && a.id !== 'app.physical-roll',
      ),
      ...(anyManual ? [appPolicy('app.physical-roll')] : []),
      appPolicy('app.held-results'),
    ],
  };
}
export function suppressRollShortcut(target: EventTarget | null) {
  return (
    typeof Element !== 'undefined' &&
    target instanceof Element &&
    !!target.closest(
      'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]',
    )
  );
}
export function recipeRunnable(entry: ReferenceEntry) {
  const a = entry.action;
  return (
    entry.available &&
    !!a &&
    (a.kind === 'oracle' ||
      a.kind === 'regional-monster' ||
      a.kind === 'regional-table' ||
      (a.kind === 'procedure' &&
        ![
          'workbench.city',
          'workbench.stock-room',
          'depths.encounter-level',
        ].includes(a.procedureId)))
  );
}
export interface RecipeResult {
  referenceId: string;
  reading?: ReferenceReading;
  error?: string;
  held: boolean;
  manualText?: string;
}
/** Recipes are independent calls. No source sequence or text is inferred across steps. */
export function runRecipeSteps(
  ids: string[],
  byId: Record<string, ReferenceEntry>,
  previous: RecipeResult[],
  run: (entry: ReferenceEntry) => ReferenceReading | undefined,
  only?: number,
): RecipeResult[] {
  return ids.map((referenceId, n) => {
    const old =
      previous[n]?.referenceId === referenceId ? previous[n] : undefined;
    if (
      old &&
      (old.held ||
        old.manualText !== undefined ||
        (only !== undefined && only !== n))
    )
      return old;
    const entry = byId[referenceId];
    if (!entry || !recipeRunnable(entry))
      return {
        referenceId,
        held: false,
        error: '현재 자료로 실행할 수 없습니다. 참조를 직접 열어 주세요.',
      };
    try {
      const reading = run(entry);
      return {
        referenceId,
        held: false,
        ...(reading
          ? { reading }
          : { error: '이 절차는 필요한 선택을 먼저 확인하세요.' }),
      };
    } catch (e) {
      return {
        referenceId,
        held: false,
        error: e instanceof Error ? e.message : '원문 자료를 확인하세요.',
      };
    }
  });
}
