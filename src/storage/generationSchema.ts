import { z } from 'zod';
import { REGION_IDS } from '../domain/types';

export const sourceStatusSchema = z.enum([
  'VERIFIED',
  'PARTIAL',
  'CONFLICT',
  'UNAVAILABLE',
]);
export const sourceReferenceSchema = z.object({
  field: z.string().optional(),
  role: z.enum(['primary', 'routing']).optional(),
  status: sourceStatusSchema.optional(),
  bookId: z.string().optional(),
  bookTitle: z.string().optional(),
  tableId: z.string().optional(),
  tableTitle: z.string().optional(),
  pdfPage: z
    .union([
      z.number().int().positive(),
      z.array(z.number().int().positive()),
      z.null(),
    ])
    .optional(),
  printedPage: z.union([z.number(), z.string(), z.null()]).optional(),
  note: z.string().optional(),
  roll: z.number().int().optional(),
  entryId: z.string().nullable().optional(),
});
export const generatedValueSchema = z.object({
  classification: z.enum([
    'SOURCE_VERBATIM',
    'SOURCE_COMPOSED',
    'APP_DERIVED',
    'USER_AUTHORED',
    'UNSOURCED',
  ]),
  origin: z.enum(['source', 'source-edited', 'manual']),
  status: sourceStatusSchema,
  sourceRefs: z.array(sourceReferenceSchema),
  sourceText: z.array(z.string()).optional(),
  rolls: z
    .array(
      z.object({
        tableId: z.string(),
        dice: z.string(),
        value: z.number(),
        entryId: z.string().nullable().optional(),
        diceValues: z.array(z.number()).optional(),
      }),
    )
    .optional(),
  transformation: z.string().optional(),
  procedureId: z.string().optional(),
  datasetVersion: z.string().optional(),
  regionWeighting: z.enum(REGION_IDS).optional(),
  unresolvedSourceIds: z.array(z.string()).optional(),
  derivedFrom: z.array(z.string().min(1)).optional(),
  authority: z
    .array(
      z.object({
        kind: z.enum(['SOURCE_PROCEDURE', 'APP_POLICY']),
        id: z.string().min(1),
        description: z.string().optional(),
        sourceRefs: z.array(sourceReferenceSchema).optional(),
      }),
    )
    .optional(),
});
export const roomComponentSchema = z.object({
  key: z.string(),
  label: z.string(),
  sourceText: z.string(),
  translationKo: z.string().optional(),
  provenance: generatedValueSchema,
});
