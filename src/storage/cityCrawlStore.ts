import { z } from 'zod';
import type {
  CityCrawlConfig,
  CityCrawlState,
} from '../domain/cityCrawlWorkspace';

export const CITY_CRAWL_STORAGE_KEY = 'morkborg-city-current-scene:v1';
export const DEFAULT_CITY_CRAWL_CONFIG: CityCrawlConfig = {
  mode: 'city',
  dr: 10,
  modifier: 0,
  allObjectivesMet: false,
  cityOrMetropolis: false,
  includeExits: false,
};
export interface CityCrawlSnapshot {
  config: CityCrawlConfig;
  state: CityCrawlState | null;
}
const text = z.string().max(50000);
const integer = z.number().int();
const page = z.union([
  integer.positive(),
  z.array(integer.positive()).max(100),
  z.null(),
]);
const source = z.object({
  field: text.optional(),
  bookId: text.optional(),
  bookTitle: text.optional(),
  tableId: text.optional(),
  tableTitle: text.optional(),
  pdfPage: page.optional(),
  printedPage: z.union([integer, text, z.null()]).optional(),
  note: text.optional(),
  roll: integer.optional(),
  entryId: text.nullable().optional(),
});
const configSchema = z.object({
  mode: z.enum(['micro', 'derive', 'city']),
  dr: integer.min(1).max(1000),
  modifier: integer.min(-1000).max(1000),
  allObjectivesMet: z.boolean(),
  cityOrMetropolis: z.boolean(),
  includeExits: z.boolean(),
});
const reading = z.object({
  title: text,
  blocks: z
    .array(
      z.object({
        title: text,
        text,
        dice: text.optional(),
        kind: z.literal('creature').optional(),
      }),
    )
    .max(30),
  sourceRefs: z.array(source).max(100),
  relatedIds: z.array(text).max(100).optional(),
  fixedLookups: z
    .array(z.object({ oracleId: text, roll: integer }))
    .max(100)
    .optional(),
  oracle: z
    .object({
      id: text,
      title: text,
      rolls: z
        .array(
          z.object({
            oracleId: text,
            title: text,
            dice: text,
            roll: integer,
            diceValues: z.array(integer).max(100),
            entryId: text.nullable(),
            text,
            source: text,
            metadata: z.record(z.string(), z.unknown()).optional(),
          }),
        )
        .max(30),
    })
    .optional(),
});
const stateSchema = z
  .object({
    config: configSchema,
    phase: z.enum(['blocked', 'scene', 'ready', 'complete']),
    streetNumber: integer.min(0).max(10000),
    totalStreets: integer.min(1).max(10000).optional(),
    setup: reading.optional(),
    reading,
    move: z
      .object({
        move: z.literal('crawl'),
        mode: z.enum(['city', 'derive']),
        dr: integer.min(1),
        modifier: integer,
        diceValues: z.tuple([integer.min(1).max(20), integer.min(1).max(20)]),
        modifiedValues: z.tuple([integer, integer]),
        outcome: z.enum(['strong', 'weak', 'fail']),
        description: text,
        sourceRefs: z.array(source).max(100),
        metadata: z.object({
          streetAction: z.enum([
            'none',
            'new-street',
            'next-objective',
            'resolve-then-new-street',
          ]),
          requiresResolution: z.boolean(),
          minutesPerStreet: z.literal(5).optional(),
          followUp: z
            .object({
              tableId: text,
              dice: z.enum(['d4', 'd6', '2d6']),
              diceValues: z.array(integer).max(2),
              roll: integer,
              sourceRefs: z.array(source).max(10),
            })
            .optional(),
        }),
      })
      .optional(),
  })
  .refine((state) => {
    if (state.totalStreets != null && state.streetNumber > state.totalStreets)
      return false;
    if (state.phase === 'complete' && state.streetNumber !== state.totalStreets)
      return false;
    if (
      state.phase === 'blocked' &&
      (state.move?.outcome !== 'fail' ||
        state.move.metadata.streetAction !== 'resolve-then-new-street')
    )
      return false;
    if (
      state.config.mode === 'micro' &&
      (state.move || state.totalStreets == null || state.phase === 'blocked')
    )
      return false;
    if (state.config.mode === 'derive' && state.totalStreets == null)
      return false;
    if (state.move && state.config.mode !== state.move.mode) return false;
    return true;
  }, 'Invalid City Crawl phase');
const snapshotSchema = z.object({
  schemaVersion: z.literal(1),
  config: configSchema,
  state: stateSchema.nullable(),
});

export function readCityCrawlWorkspace(
  storage?: Pick<Storage, 'getItem'>,
): CityCrawlSnapshot {
  const empty = (): CityCrawlSnapshot => ({
    config: { ...DEFAULT_CITY_CRAWL_CONFIG },
    state: null,
  });
  try {
    const raw = (storage ?? localStorage).getItem(CITY_CRAWL_STORAGE_KEY);
    if (!raw || raw.length > 1000000) return empty();
    const parsed = snapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? { config: parsed.data.config, state: parsed.data.state }
      : empty();
  } catch {
    return empty();
  }
}

/** One replaceable current scene only; no campaign keys and no history array. */
export function writeCityCrawlWorkspace(
  snapshot: CityCrawlSnapshot,
  storage?: Pick<Storage, 'setItem'>,
): void {
  const parsed = snapshotSchema.parse({ schemaVersion: 1, ...snapshot });
  (storage ?? localStorage).setItem(
    CITY_CRAWL_STORAGE_KEY,
    JSON.stringify(parsed),
  );
}
