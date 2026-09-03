import { z } from 'zod';

export const publishedConnectionSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  enabled: z.boolean(),
});
export type PublishedConnection = z.infer<typeof publishedConnectionSchema>;
export const defaultPublishedConnection: PublishedConnection = {
  schemaVersion: 1,
  revision: 0,
  enabled: true,
};
