import { createDecipheriv, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  file: z.string().regex(/^\/private-updates\/[a-f0-9]{64}\.json$/),
});
const envelopeSchema = z.object({
  schemaVersion: z.literal(1),
  iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
  data: z
    .string()
    .min(24)
    .max(28_000_000)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
const pack = z.record(z.string(), z.unknown());
const bundleSchema = z.object({
  kind: z.literal('morkborg-private-data'),
  schemaVersion: z.literal(1),
  library: pack,
  oracles: pack,
  fateChart: pack,
});
export interface PublishedDataOptions {
  root: string;
  key?: string;
}

/** The key stays in the server environment; responses contain only rulebook packs. */
export async function readPublishedRulebook(
  { root, key }: PublishedDataOptions,
  knownRevision = 0,
) {
  if (!key || !/^[A-Za-z0-9+/]{43}=$/.test(key))
    throw new Error('Rulebook service is not configured.');
  const manifest = manifestSchema.parse(
    JSON.parse(
      await readFile(join(root, 'public/private-updates/latest.json'), 'utf8'),
    ),
  );
  if (knownRevision >= manifest.revision)
    return { schemaVersion: 1 as const, revision: manifest.revision };
  const encoded = await readFile(join(root, 'public', manifest.file), 'utf8');
  if (
    createHash('sha256').update(encoded).digest('hex') !==
    manifest.file.split('/').at(-1)!.slice(0, -5)
  )
    throw new Error('Rulebook asset is damaged.');
  const envelope = envelopeSchema.parse(JSON.parse(encoded));
  const encrypted = Buffer.from(envelope.data, 'base64');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'base64'),
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAAD(
    Buffer.from(`morkborg-private-update:v1:${manifest.revision}`),
  );
  decipher.setAuthTag(encrypted.subarray(-16));
  const plain = Buffer.concat([
    decipher.update(encrypted.subarray(0, -16)),
    decipher.final(),
  ]);
  const payload = JSON.parse(plain.toString('utf8'));
  if (payload.revision !== manifest.revision)
    throw new Error('Rulebook revisions differ.');
  // Zod strips updateConnection and all other non-pack fields, including keys.
  const bundle = bundleSchema.parse(payload.bundle);
  return { schemaVersion: 1 as const, revision: manifest.revision, bundle };
}

export async function handlePublishedRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: PublishedDataOptions,
) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET');
    response.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }
  try {
    const raw = new URL(
      request.url ?? '/',
      'https://localhost',
    ).searchParams.get('revision');
    const revision = raw && /^\d{1,16}$/.test(raw) ? Number(raw) : 0;
    const data = await readPublishedRulebook(
      options,
      Number.isSafeInteger(revision) ? revision : 0,
    );
    response.statusCode = 200;
    response.end(JSON.stringify(data));
  } catch {
    response.statusCode = 503;
    response.end(
      JSON.stringify({
        error: '룰북 자료를 불러오지 못했습니다. 잠시 후 다시 시도하세요.',
      }),
    );
  }
}
