import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';
import {
  parseDngngenPack,
  dngngenPackPayload,
  type DngngenPack,
} from '../src/domain/dngngenPack.js';
import {
  parseScvmPack,
  scvmPackPayload,
  type ScvmPack,
} from '../src/domain/scvmPack.js';
import {
  parseMonsterSitePack,
  monsterSitePackPayload,
  type MonsterSitePack,
} from '../src/domain/monsterSitePack.js';

export const HOSTED_GENERATOR_NAMES = [
  'dngngen',
  'scvmbirther',
  'monster',
] as const;
export type HostedGeneratorName = (typeof HOSTED_GENERATOR_NAMES)[number];
export interface HostedGeneratorPacks {
  dngngen: DngngenPack;
  scvmbirther: ScvmPack;
  monster: MonsterSitePack;
}
const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().positive(),
    file: z.string().regex(/^\/hosted-generators\/[a-f0-9]{64}\.json$/),
  })
  .strict();
const envelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
    data: z
      .string()
      .min(24)
      .max(12_000_000)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .strict();
const keyBytes = (key?: string) => {
  if (!key || !/^[A-Za-z0-9+/]{43}=$/.test(key))
    throw new Error('Hosted generators are not configured.');
  return Buffer.from(key, 'base64');
};
const aad = (revision: number) =>
  Buffer.from(`reference-desk.hosted-generators:v1:${revision}`);

/** Verify the original English snapshot after decrypting; helpers cannot replace its checksum. */
export function validateHostedGenerator<K extends HostedGeneratorName>(
  name: K,
  input: unknown,
  allowSynthetic = false,
): HostedGeneratorPacks[K] {
  const options = { allowSynthetic };
  const pack =
    name === 'dngngen'
      ? parseDngngenPack(input, options)
      : name === 'scvmbirther'
        ? parseScvmPack(input, options)
        : parseMonsterSitePack(input, options);
  const payload =
    name === 'dngngen'
      ? dngngenPackPayload(pack as DngngenPack)
      : name === 'scvmbirther'
        ? scvmPackPayload(pack as ScvmPack)
        : monsterSitePackPayload(pack as MonsterSitePack);
  if (
    createHash('sha256').update(payload).digest('hex') !==
    pack.integrity.payloadSha256
  )
    throw new Error('Generator snapshot is damaged.');
  return pack as HostedGeneratorPacks[K];
}

/** Only ciphertext and a hash-named manifest are deployment assets. */
export function encryptHostedGenerators(
  packs: HostedGeneratorPacks,
  key: string,
  revision: number,
  allowSynthetic = false,
) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error('Invalid revision.');
  const verified = Object.fromEntries(
    HOSTED_GENERATOR_NAMES.map((name) => [
      name,
      validateHostedGenerator(name, packs[name], allowSynthetic),
    ]),
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(key), iv);
  cipher.setAAD(aad(revision));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ revision, generators: verified })),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const encoded = JSON.stringify({
    schemaVersion: 1,
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
  });
  const file = `/hosted-generators/${createHash('sha256').update(encoded).digest('hex')}.json`;
  return { encoded, manifest: { schemaVersion: 1 as const, revision, file } };
}

export interface HostedGeneratorOptions {
  root: string;
  key?: string;
  /** Enable only on a deployment protected by Vercel Authentication for All Deployments. */
  enabled: boolean;
  allowSynthetic?: boolean;
}

export async function readHostedGenerator<K extends HostedGeneratorName>(
  options: HostedGeneratorOptions,
  name: K,
) {
  if (!options.enabled) throw new Error('Hosted generators are disabled.');
  const key = keyBytes(options.key);
  const manifest = manifestSchema.parse(
    JSON.parse(
      await readFile(
        join(options.root, 'public/hosted-generators/latest.json'),
        'utf8',
      ),
    ),
  );
  const encoded = await readFile(
    join(options.root, 'public', manifest.file),
    'utf8',
  );
  if (
    createHash('sha256').update(encoded).digest('hex') !==
    manifest.file.split('/').at(-1)!.slice(0, -5)
  )
    throw new Error('Hosted generator asset is damaged.');
  const envelope = envelopeSchema.parse(JSON.parse(encoded));
  const encrypted = Buffer.from(envelope.data, 'base64');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAAD(aad(manifest.revision));
  decipher.setAuthTag(encrypted.subarray(-16));
  const plain = Buffer.concat([
    decipher.update(encrypted.subarray(0, -16)),
    decipher.final(),
  ]);
  const payload: unknown = JSON.parse(plain.toString('utf8'));
  const data = z
    .object({
      revision: z.literal(manifest.revision),
      generators: z.record(z.string(), z.unknown()),
    })
    .parse(payload);
  return {
    status: 'ready' as const,
    pack: validateHostedGenerator(
      name,
      data.generators[name],
      options.allowSynthetic,
    ),
  };
}

export async function handleHostedGeneratorRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: HostedGeneratorOptions,
) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  const send = (status: number, value: unknown) => {
    response.statusCode = status;
    response.end(JSON.stringify(value));
  };
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    send(405, { error: 'Method not allowed.' });
    return;
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') {
    send(403, { error: 'Not allowed.' });
    return;
  }
  if (!options.enabled) {
    send(404, { status: 'unavailable', reason: 'missing' });
    return;
  }
  try {
    const url = new URL(request.url ?? '/', 'https://request.invalid');
    const raw = url.pathname.startsWith('/__private/')
      ? url.pathname.slice('/__private/'.length)
      : url.searchParams.get('generator');
    if (
      !HOSTED_GENERATOR_NAMES.some((name) => name === raw) ||
      url.searchParams.getAll('generator').length > 1
    ) {
      send(404, { error: 'Not found.' });
      return;
    }
    send(200, await readHostedGenerator(options, raw as HostedGeneratorName));
  } catch {
    send(503, { status: 'unavailable', reason: 'invalid' });
  }
}

/** Development/preview uses the same encrypted assets and handler as the hosted site. */
export function hostedGeneratorMiddleware(
  options: () => HostedGeneratorOptions,
) {
  return (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const path = new URL(request.url ?? '/', 'https://request.invalid')
      .pathname;
    if (
      path === '/api/private-generator' ||
      /^\/__private\/(?:dngngen|scvmbirther|monster)$/.test(path)
    ) {
      void handleHostedGeneratorRequest(request, response, options());
      return;
    }
    next();
  };
}
