import { z } from 'zod';
import { REGION_IDS } from '../domain/types';
import { CARD_RANKS, CARD_SUITS } from '../domain/depthsProcedures';

export const CONVENIENCE_KEY = 'morkborg-convenience:v1';
export const PLAY_SESSION_KEY = 'morkborg-play-session:v1';
const referenceId = z.string().min(1).max(250);
const recipeSchema = z.object({
  id: referenceId,
  name: z.string().trim().min(1).max(80),
  referenceIds: z.array(referenceId).min(1).max(12),
  createdAt: z.string().max(40),
});
const packSchema = z.object({
  id: referenceId,
  name: z.string().trim().min(1).max(80),
  referenceIds: z.array(referenceId).min(1).max(60),
  userCreated: z.literal(true),
});
export const executionParametersSchema = z.object({
  region: z.enum(REGION_IDS).default('sarkash'),
  stockKind: z.enum(['common', 'rare', 'room']).default('common'),
  stockDR: z.number().int().min(1).max(99).default(10),
  cityLarge: z.boolean().default(false),
  cityExits: z.boolean().default(true),
  encounterRegion: z.string().max(100).default('sarkash'),
  rareDeck: z
    .array(z.object({ rank: z.enum(CARD_RANKS), suit: z.enum(CARD_SUITS) }))
    .max(52)
    .optional(),
});
export type ExecutionParameters = z.infer<typeof executionParametersSchema>;
const lastRollSchema = z.object({
  kind: z.enum(['reference', 'recipe']),
  id: referenceId,
  mode: z.enum(['APP_ROLL', 'USER_ROLL', 'OPEN']),
  parameters: executionParametersSchema,
  inputs: z.record(z.string(), z.string().max(300)).optional(),
});
export type LastRoll = z.infer<typeof lastRollSchema>;
export type ReferenceRecipe = z.infer<typeof recipeSchema>;
export type ReferencePack = Omit<z.infer<typeof packSchema>, 'userCreated'> & {
  userCreated: boolean;
};
export interface ConveniencePreferences {
  schemaVersion: 1;
  recipes: ReferenceRecipe[];
  packs: ReferencePack[];
  activePackId: string | null;
}
export interface PlaySession {
  schemaVersion: 1;
  tray: string[];
  scratch: string;
  lastRoll: LastRoll | null;
}
export const emptyConvenience = (): ConveniencePreferences => ({
  schemaVersion: 1,
  recipes: [],
  packs: [],
  activePackId: null,
});
export const emptyPlaySession = (): PlaySession => ({
  schemaVersion: 1,
  tray: [],
  scratch: '',
  lastRoll: null,
});
type Reader = Pick<Storage, 'getItem'>;
function parsed(storage: Reader, key: string): Record<string, unknown> {
  const value: unknown = JSON.parse(storage.getItem(key) ?? '{}');
  return value &&
    typeof value === 'object' &&
    'schemaVersion' in value &&
    value.schemaVersion === 1
    ? (value as Record<string, unknown>)
    : {};
}
export function readConveniencePreferences(
  storage?: Reader,
): ConveniencePreferences {
  try {
    const v = parsed(storage ?? localStorage, CONVENIENCE_KEY);
    const valid = <T>(items: unknown, schema: z.ZodType<T>): T[] =>
      Array.isArray(items)
        ? items.slice(0, 20).flatMap((item) => {
            const result = schema.safeParse(item);
            return result.success ? [result.data] : [];
          })
        : [];
    return {
      schemaVersion: 1,
      recipes: valid(v.recipes, recipeSchema),
      packs: valid(v.packs, packSchema),
      activePackId:
        referenceId.nullable().safeParse(v.activePackId).data ?? null,
    };
  } catch {
    return emptyConvenience();
  }
}
export function readPlaySession(storage?: Reader): PlaySession {
  try {
    const v = parsed(storage ?? sessionStorage, PLAY_SESSION_KEY);
    const tray = z.array(referenceId).safeParse(v.tray).data ?? [];
    return {
      schemaVersion: 1,
      tray: [...new Set(tray)].slice(0, 12),
      scratch: typeof v.scratch === 'string' ? v.scratch.slice(0, 12000) : '',
      lastRoll: lastRollSchema.nullable().safeParse(v.lastRoll).data ?? null,
    };
  } catch {
    return emptyPlaySession();
  }
}
export function writeConveniencePreferences(
  value: ConveniencePreferences,
  storage?: Pick<Storage, 'setItem'>,
) {
  (storage ?? localStorage).setItem(CONVENIENCE_KEY, JSON.stringify(value));
}
export function writePlaySession(
  value: PlaySession,
  storage?: Pick<Storage, 'setItem'>,
) {
  (storage ?? sessionStorage).setItem(PLAY_SESSION_KEY, JSON.stringify(value));
}
export function addToTray(state: PlaySession, id: string): PlaySession {
  if (state.tray.includes(id)) return state;
  if (state.tray.length >= 12)
    throw new Error('Play Tray에는 최대 12개까지 둘 수 있습니다.');
  return { ...state, tray: [...state.tray, id] };
}
export function appendScratch(state: PlaySession, text: string): PlaySession {
  const scratch = [state.scratch, text].filter(Boolean).join('\n\n');
  if (scratch.length > 12000)
    throw new Error('스크랩이 가득 찼습니다. 복사한 뒤 비워 주세요.');
  return { ...state, scratch };
}
