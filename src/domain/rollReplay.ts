import { z } from 'zod';
import type { ReferenceReading } from './referenceReading';
import { copyReferenceReading } from './referenceReading';
import type { RecipeResult } from './heldReferenceResults';
import type { OracleRegistry } from './oracle';
import type { ReferenceRegistry } from './references';
import { CARD_RANKS, CARD_SUITS } from './depthsProcedures';
import { executionParametersSchema } from '../storage/conveniencePreferences';

const text = z.string().max(50000);
const source = z.object({
  role: z.enum(['primary', 'routing']).optional(),
  status: z.enum(['VERIFIED', 'PARTIAL', 'CONFLICT', 'UNAVAILABLE']).optional(),
  field: text.optional(),
  bookId: text.optional(),
  bookTitle: text.optional(),
  tableId: text.optional(),
  tableTitle: text.optional(),
  pdfPage: z.union([z.number(), z.array(z.number()), z.null()]).optional(),
  printedPage: z.union([z.number(), text, z.null()]).optional(),
  note: text.optional(),
  roll: z.number().optional(),
  entryId: text.nullable().optional(),
});
const block = z.object({
  title: text,
  text,
  dice: text.optional(),
  translation: z
    .object({ ko: text.optional(), titleKo: text.optional() })
    .optional(),
});
const readingSchema = z.object({
  title: text,
  blocks: z.array(block).max(100),
  sourceRefs: z.array(source).max(200),
  copyContent: z
    .object({
      title: text,
      blocks: z.array(z.object({ title: text, text })).max(100),
    })
    .optional(),
});
const rollSchema = z.object({
  origin: z.enum(['APP_ROLL', 'USER_ROLL']).optional(),
  oracleId: text,
  entryId: text.nullable(),
  title: text,
  dice: text,
  roll: z.number(),
  diceValues: z.array(z.number()).max(100),
  text,
  source: text,
});
const componentSchema = z.object({
  title: text,
  text,
  cards: z.array(z.number()),
  source,
  classification: z.enum(['SOURCE_VERBATIM', 'APP_DERIVED']),
});
const resultSchema = z.object({
  referenceId: z.string().max(300),
  reading: readingSchema,
  mode: z.enum(['APP_ROLL', 'USER_ROLL', 'MIXED']),
  inputs: z.record(z.string(), text).optional(),
  rolls: z.array(rollSchema).max(100),
  cards: z
    .array(z.object({ rank: z.enum(CARD_RANKS), suit: z.enum(CARD_SUITS) }))
    .max(6)
    .optional(),
  cardComponents: z.array(componentSchema).max(20).optional(),
  held: z.boolean(),
  manualText: text.optional(),
});
export const replaySchema = z.object({
  id: z.string().max(200),
  timestamp: z.number(),
  kind: z.enum(['reference', 'recipe']),
  referenceId: z.string().max(300),
  title: text,
  parameters: executionParametersSchema.omit({ rareDeck: true }),
  procedureInputs: z
    .record(z.string(), z.union([text, z.number(), z.boolean()]))
    .optional(),
  datasetRevision: z.number().optional(),
  results: z.array(resultSchema).min(1).max(12),
});
export type RollReplay = z.infer<typeof replaySchema>;
export type ReplayResult = RollReplay['results'][number];

/** Show the parameters consumed by the existing executor, not every workbench setting. */
export function replayParameterLines(
  entry: RollReplay,
  index: ReferenceRegistry,
): [string, string | number | boolean][] {
  const ids = entry.results.map((r) => r.referenceId);
  const actions = ids.map((id) => index.byId[id]?.action);
  const lines: [string, string | number | boolean][] = [];
  if (ids.includes('procedure:depths.encounter-level'))
    lines.push(['Encounter region · 지역', entry.parameters.encounterRegion]);
  if (
    actions.some(
      (a) => a?.kind === 'regional-monster' || a?.kind === 'regional-table',
    ) ||
    ids.some((id) =>
      /^procedure:workbench\.(stock-room|npc|encounter)$/.test(id),
    )
  )
    lines.push(['Region · 지역', entry.parameters.region]);
  if (ids.includes('procedure:workbench.stock-room'))
    lines.push(
      ['Stock · 방 채우기', entry.parameters.stockKind],
      ['DR · 난이도', entry.parameters.stockDR],
    );
  if (ids.some((id) => id.startsWith('procedure:aitc.')))
    lines.push(
      ['Large city · 큰 도시', entry.parameters.cityLarge],
      ['Exits · 출구 포함', entry.parameters.cityExits],
    );
  const labels: Record<string, string> = {
    move: 'Move · 판정',
    mode: 'Mode · 방식',
    dr: 'DR · 난이도',
    modifier: 'Modifier · 보정',
    allMet: '모든 목표 완료',
    place: '기도 장소',
    allObjectivesMet: '모든 목표 완료',
  };
  for (const [key, value] of Object.entries(entry.procedureInputs ?? {}))
    lines.push([labels[key] ?? key, value]);
  return lines;
}

export function replayResult(
  referenceId: string,
  reading: ReferenceReading,
  edit?: Pick<RecipeResult, 'held' | 'manualText'>,
): ReplayResult {
  return resultSchema.parse({
    referenceId,
    reading: {
      ...reading,
      blocks: reading.blocks.map((b, i) => ({
        ...b,
        translation:
          b.translation ??
          (typeof reading.oracle?.rolls[i]?.metadata?.ko === 'string'
            ? { ko: reading.oracle.rolls[i].metadata!.ko }
            : undefined),
      })),
    },
    mode: reading.rollMethod?.kind ?? 'APP_ROLL',
    inputs: reading.rollMethod?.inputs,
    rolls:
      reading.oracle?.rolls.map((r) => ({
        ...r,
        origin:
          r.metadata?.rollOrigin === 'USER_ROLL' ? 'USER_ROLL' : 'APP_ROLL',
      })) ?? [],
    cards: reading.rareMonster?.cards,
    cardComponents: reading.rareMonster?.components,
    held: edit?.held ?? false,
    manualText: edit?.manualText,
  });
}
/** Detached, validated snapshot. Never stores the canonical registry, NPC save or active deck. */
export function createReplay(
  value: Omit<RollReplay, 'id' | 'timestamp'>,
): RollReplay {
  return replaySchema.parse({
    ...value,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
}
export const appendReplay = (history: RollReplay[], entry: RollReplay) =>
  [entry, ...history].slice(0, 10);
export function copyReplay(entry: RollReplay, withSource = false) {
  return entry.results
    .map((result) =>
      result.manualText === undefined
        ? copyReferenceReading(result.reading, withSource)
        : result.manualText +
          (withSource
            ? '\n\nEdited manually · 직접 수정됨\n' +
              copyReferenceReading(
                {
                  ...result.reading,
                  title: '',
                  blocks: [],
                  copyContent: undefined,
                },
                true,
              ).trim()
            : ''),
    )
    .join('\n\n');
}
/** Current citations may resolve; historical text and cards are never recomputed. */
export function replaySources(
  result: ReplayResult,
  index: ReferenceRegistry,
  registry: OracleRegistry,
) {
  const entry = index.byId[result.referenceId];
  return result.reading.sourceRefs.map((ref) => {
    const table =
      ref.tableId && registry.tables.find((t) => t.id === ref.tableId);
    if (table)
      return {
        ...ref,
        bookId: table.sourceBookId,
        tableTitle: table.title,
        pdfPage: table.sourcePage,
        printedPage: table.printedPage,
        status:
          ref.entryId && !table.entries.some((e) => e.id === ref.entryId)
            ? ('UNAVAILABLE' as const)
            : (table.sourceStatus ??
              (table.sourceVerified
                ? ('VERIFIED' as const)
                : ('PARTIAL' as const))),
      };
    const current = entry?.sourceRefs.find(
      (s) => s.tableId === ref.tableId && s.bookId === ref.bookId,
    );
    return current
      ? { ...current, roll: ref.roll, entryId: ref.entryId }
      : { ...ref, status: 'UNAVAILABLE' as const };
  });
}
