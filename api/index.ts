import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestListener } from '@hono/node-server';
import app from '../src/app.js';

const requestListener = getRequestListener(app.fetch);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string') {
    const queryIndex = req.url ? req.url.indexOf('?') : -1;
    const query = queryIndex !== -1 ? req.url!.slice(queryIndex) : '';
    req.url = matchedPath.includes('?') ? matchedPath : matchedPath + query;
  }
  return requestListener(req, res);
}
