import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  handlePublishedRequest,
  type PublishedDataOptions,
} from './publishedRulebook.js';

/** Shared by Vite's production preview and dev server; the API uses the same handler as Vercel. */
export function publishedMiddleware(
  options: () => PublishedDataOptions,
  production = true,
) {
  return (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const pathname = new URL(request.url ?? '/', 'https://request.invalid')
      .pathname;
    if (pathname === '/api/rulebook-data') {
      void handlePublishedRequest(request, response, options());
      return;
    }
    if (
      /^\/api(?:\/|$)/.test(pathname) ||
      (production && /^\/(?:rules|outputs|work)(?:\/|$)/.test(pathname))
    ) {
      response.statusCode = 404;
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ error: 'Not found.' }));
      return;
    }
    next();
  };
}
