import { z } from 'zod';

export const UPDATE_MANIFEST = '/private-updates/latest.json';
export const updateConnectionSchema = z.object({
  schemaVersion: z.literal(1),
  manifest: z.literal(UPDATE_MANIFEST),
  key: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
  revision: z.number().int().nonnegative(),
  enabled: z.boolean().default(true),
});
export type UpdateConnection = z.infer<typeof updateConnectionSchema>;
export const parseUpdateConnection = (input: unknown): UpdateConnection =>
  updateConnectionSchema.parse(input);

// A successful manual import invalidates any update that is still downloading.
let importGeneration = 0;
export const privateImportGeneration = () => importGeneration;
export function privateImportCompleted(announce = true) {
  importGeneration++;
  if (announce && typeof window !== 'undefined')
    window.dispatchEvent(new Event('private-data-imported'));
}
