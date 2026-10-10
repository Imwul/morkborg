import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleHostedGeneratorRequest } from '../server/hostedGenerators.js';

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  return handleHostedGeneratorRequest(request, response, {
    root: process.cwd(),
    key: process.env.MORKBORG_DATA_KEY,
    enabled: process.env.MORKBORG_HOSTED_GENERATORS === '1',
  });
}
