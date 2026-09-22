import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import { readPrivateDngngenPack } from './privateDngngenPack.js';
import { readPrivateGeneratorPack } from './privateGeneratorPack.js';
import { parseScvmPack, scvmPackPayload } from '../src/domain/scvmPack.js';
import { parseMonsterSitePack, monsterSitePackPayload } from '../src/domain/monsterSitePack.js';
import { handlePublishedRequest } from './publishedRulebook.js';

export const PRIVATE_PACK_ENDPOINT = '/__private/dngngen';
export const PRIVATE_SCVM_ENDPOINT = '/__private/scvmbirther';
export const PRIVATE_MONSTER_ENDPOINT = '/__private/monster';
export const PRIVATE_MODE_MARKER = '<meta name="reference-desk-private" content="enabled">';
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

export function isTailscaleIPv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((v) => /^\d{1,3}$/.test(v) && Number(v) <= 255) &&
    Number(parts[0]) === 100 && Number(parts[1]) >= 64 && Number(parts[1]) <= 127;
}

export function privateBindHost(
  host = '127.0.0.1',
  interfaces = networkInterfaces(),
): string {
  if (host === '127.0.0.1') return host;
  if (isTailscaleIPv4(host) && Object.values(interfaces).some((entries) =>
    entries?.some((entry) => entry.address === host && entry.family === 'IPv4')))
    return host;
  throw new Error('PRIVATE_HOST must be loopback or this computer’s Tailscale IPv4 address.');
}

export function privateOrigin(value?: string): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.ts.net') ||
      url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash)
    throw new Error('PRIVATE_ORIGIN must be the exact HTTPS Tailscale Serve origin.');
  return url.origin;
}

export interface PrivateServerOptions {
  root: string;
  packPath: string;
  scvmPath?: string;
  monsterPath?: string;
  allowSynthetic?: boolean;
  host?: string;
  origin?: string;
  rulebookKey?: string;
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(value));
}

function allowedRequest(request: IncomingMessage, host: string, origin?: string) {
  const authority = request.headers.host;
  if (!authority || /[\s,@/\\]/.test(authority)) return false;
  let parsed;
  try { parsed = new URL(`http://${authority}`); } catch { return false; }
  const names = new Set([host, ...(host === '127.0.0.1' ? ['localhost'] : [])]);
  if (origin) names.add(new URL(origin).hostname);
  if (!names.has(parsed.hostname)) return false;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const source = request.headers.origin;
  return !source || source === `http://${authority}` || source === origin;
}

/** Production assets only: no Vite filesystem service, uploads, or path-driven file API. */
export function createPrivateDngngenServer(options: PrivateServerOptions) {
  const host = privateBindHost(options.host);
  const origin = privateOrigin(options.origin);
  const dist = resolve(options.root, 'dist');
  return createServer((request, response) => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    const run = async () => {
      if (!allowedRequest(request, host, origin)) {
        json(response, 403, { error: 'Request is not from the private application.' });
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        json(response, 405, { error: 'Method not allowed.' });
        return;
      }
      const raw = request.url ?? '/';
      let path: string;
      try { path = decodeURIComponent(raw.split('?')[0]); } catch {
        json(response, 400, { error: 'Invalid request.' }); return;
      }
      if (!path.startsWith('/') || path.includes('\\') || path.includes('\0') ||
          path.split('/').some((part) => part === '.' || part === '..')) {
        json(response, 404, { error: 'Not found.' }); return;
      }
      if (path === PRIVATE_PACK_ENDPOINT || path === PRIVATE_SCVM_ENDPOINT || path === PRIVATE_MONSTER_ENDPOINT) {
        if (request.method !== 'GET') {
          response.setHeader('Allow', 'GET');
          json(response, 405, { error: 'Method not allowed.' }); return;
        }
        // Revalidate the current file on every read: replacements cannot reuse stale data.
        if (path === PRIVATE_PACK_ENDPOINT) {
          json(response, 200, await readPrivateDngngenPack(options.packPath, options.allowSynthetic));
          return;
        }
        if (path === PRIVATE_SCVM_ENDPOINT) {
          json(response, 200, options.scvmPath
            ? await readPrivateGeneratorPack(options.scvmPath, parseScvmPack, scvmPackPayload, options.allowSynthetic)
            : { status: 'unavailable', reason: 'missing' });
          return;
        }
        json(response, 200, options.monsterPath
          ? await readPrivateGeneratorPack(options.monsterPath, parseMonsterSitePack, monsterSitePackPayload, options.allowSynthetic)
          : { status: 'unavailable', reason: 'missing' });
        return;
      }
      if (path === '/api/rulebook-data') {
        await handlePublishedRequest(request, response, { root: options.root, key: options.rulebookKey });
        return;
      }
      if (/^\/(?:__private|api|private|outputs|work|rules|server|scripts|src|node_modules)(?:\/|$)/.test(path) ||
          path.split('/').some((part) => part.startsWith('.'))) {
        json(response, 404, { error: 'Not found.' }); return;
      }
      let file = join(dist, path === '/' ? 'index.html' : path);
      try {
        if (!(await stat(file)).isFile()) throw new Error('Not a file');
      } catch {
        if (extname(path) || path.startsWith('/assets/')) {
          json(response, 404, { error: 'Not found.' }); return;
        }
        file = join(dist, 'index.html');
      }
      const [actual, actualDist] = await Promise.all([realpath(file), realpath(dist)]);
      const within = relative(actualDist, actual);
      if (within === '..' || within.startsWith(`..${sep}`) || within.startsWith(sep)) {
        json(response, 404, { error: 'Not found.' }); return;
      }
      const extension = extname(actual).toLowerCase();
      if (!mime[extension]) { json(response, 404, { error: 'Not found.' }); return; }
      let body = await readFile(actual);
      if (actual === join(actualDist, 'index.html'))
        body = Buffer.from(body.toString('utf8').replace('</head>', `${PRIVATE_MODE_MARKER}</head>`));
      response.statusCode = 200;
      response.setHeader('Content-Type', mime[extension]);
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    void run().catch(() => {
      if (!response.headersSent) json(response, 503, { error: 'Private service unavailable.' });
      else response.end();
    });
  });
}
