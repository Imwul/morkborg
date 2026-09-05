import { z } from 'zod';
import { OBJECT_KINDS, EVENT_TYPES } from '../domain/chronicle';
const text = z.string(),
  uuid = z.uuid(),
  time = z.iso.datetime();
export const hiddenInformationSchema = {
  visibility: z.enum(['gm', 'players']).optional(),
  gmNotes: text.optional(),
};
export const dungeonPlayStateSchema = z.enum([
  'unknown',
  'discovered',
  'active',
  'cleared',
  'abandoned',
]);
export const roomPlayStateSchema = z.enum([
  'hidden',
  'discovered',
  'visited',
  'cleared',
]);
export const placementPlayStateSchema = z.enum([
  'unknown',
  'encountered',
  'defeated',
  'fled',
  'dead',
  'removed',
]);
export const objectLinkSchema = z
  .object({
    kind: z.enum(OBJECT_KINDS),
    id: uuid,
    dungeonId: uuid.optional(),
    relation: text.optional(),
    quantity: z.number().int().min(1).max(999999).optional(),
  })
  .refine(
    (link) => (link.kind === 'room' ? !!link.dungeonId : !link.dungeonId),
    'Room references require their Dungeon ID; other references must not have one.',
  );
const source = z.object({
  field: text.optional(),
  bookId: text.optional(),
  bookTitle: text.optional(),
  tableId: text.optional(),
  tableTitle: text.optional(),
  pdfPage: z
    .union([
      z.number().int().positive(),
      z.array(z.number().int().positive()),
      z.null(),
    ])
    .optional(),
  printedPage: z.union([z.number(), text, z.null()]).optional(),
  note: text.optional(),
  roll: z.number().int().optional(),
  entryId: text.nullable().optional(),
});
const record = {
  id: uuid,
  title: text,
  notes: text,
  links: z.array(objectLinkSchema),
  createdAt: time,
  updatedAt: time,
  ...hiddenInformationSchema,
};
const sessionEncounter = z
  .object({
    id: uuid,
    monsterId: uuid,
    placementId: uuid.nullable(),
    quantity: z.number().int().min(1).max(999999),
    remaining: z.number().int().min(0).max(999999),
    morale: z.union([text, z.number().int().min(0).max(12)]),
    notes: text,
    state: placementPlayStateSchema,
  })
  .refine(
    (e) => e.remaining <= e.quantity,
    'Remaining creatures cannot exceed the starting quantity.',
  );
const session = z.object({
  ...record,
  number: z.number().int().min(1).optional(),
  date: z.iso.date(),
  inWorldDate: text,
  characterIds: z.array(uuid),
  summary: text,
  status: z.enum(['planned', 'active', 'ended']),
  encounters: z.array(sessionEncounter),
});
const oracle = z.object({
  id: uuid,
  title: text,
  rolls: z
    .array(
      z.object({
        oracleId: text,
        title: text,
        dice: text,
        roll: z.number().int(),
        diceValues: z.array(z.number().int()),
        entryId: text.nullable(),
        text,
        source: text,
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1),
});
const event = z.object({
  id: uuid,
  type: z.enum(EVENT_TYPES),
  title: text,
  description: text,
  date: z.iso.date(),
  inWorldDate: text,
  sessionId: uuid.nullable(),
  links: z.array(objectLinkSchema),
  sourceRefs: z.array(source),
  oracle: oracle.optional(),
  createdAt: time,
  updatedAt: time,
});
const misery = z.object({
  id: uuid,
  roll: z
    .number()
    .int()
    .nullable()
    .refine(
      (roll) =>
        roll === null ||
        roll === 77 ||
        (roll >= 11 && roll <= 66 && roll % 10 >= 1 && roll % 10 <= 6),
    ),
  result: text,
  sourceRefs: z.array(source),
  date: z.iso.date(),
  inWorldDate: text,
  sessionId: uuid.nullable(),
  notes: text,
  terminal: z.boolean(),
  createdAt: time,
  updatedAt: time,
});
/** Missing collections are additive v5 migration defaults; malformed present data is rejected. */
export const chronicleSchemaFields = {
  sessions: z.array(session).default([]),
  timeline: z.array(event).default([]),
  threads: z
    .array(
      z.object({
        ...record,
        description: text,
        status: z.enum(['open', 'resolved', 'failed', 'abandoned']),
      }),
    )
    .default([]),
  rumors: z
    .array(
      z.object({
        ...record,
        description: text,
        status: z.enum(['unknown', 'heard', 'confirmed', 'false', 'resolved']),
      }),
    )
    .default([]),
  relics: z
    .array(
      z.object({
        ...record,
        description: text,
        holder: objectLinkSchema.nullable(),
        origin: objectLinkSchema.nullable(),
      }),
    )
    .default([]),
  journalNotes: z.array(z.object({ ...record, text })).default([]),
  miseries: z.array(misery).max(7).default([]),
  currentSessionId: uuid.nullable().default(null),
  campaignDay: z.number().int().min(1).max(9999999).default(1),
  apocalypseDie: z
    .union([
      z.literal(2),
      z.literal(6),
      z.literal(10),
      z.literal(20),
      z.literal(100),
    ])
    .optional(),
};
