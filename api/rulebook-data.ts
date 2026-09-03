import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlePublishedRequest } from '../server/publishedRulebook.js';

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  return handlePublishedRequest(request, response, {
    root: process.cwd(),
    key: process.env.MORKBORG_DATA_KEY,
  });
}
