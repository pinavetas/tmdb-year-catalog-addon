import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import type { Manifest } from '../src/types/stremio.js';

test('HTTP GET /manifest.json returns 200 with CORS and valid JSON', async () => {
  const res = await app.request('/manifest.json');

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('application/json'), true);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');

  const json = (await res.json()) as Manifest;
  assert.equal(json.id, 'community.imdb-year-catalog');
  // 3 películas + 3 series + 2 de búsqueda
  assert.equal(json.catalogs.length, 8);
});

test('HTTP GET /manifest.json builds an absolute PNG logo URL from the forwarded host', async () => {
  const res = await app.request('/manifest.json', {
    headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'addon.example.com' }
  });
  const json = (await res.json()) as Manifest;
  assert.equal(json.logo, 'https://addon.example.com/logo.png');
});

test('HTTP OPTIONS preflight is answered with CORS headers', async () => {
  const res = await app.request('/manifest.json', {
    method: 'OPTIONS',
    headers: { Origin: 'https://web.stremio.com', 'Access-Control-Request-Method': 'GET' }
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('HTTP GET /logo.png serves a 256x256 PNG', async () => {
  const res = await app.request('/logo.png');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  const buf = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(buf.readUInt32BE(16), 256);
  assert.equal(buf.readUInt32BE(20), 256);
});

test('HTTP GET / returns HTML welcome card with escaped manifest URL', async () => {
  const res = await app.request('/', { headers: { host: 'evil"><script>x</script>' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('text/html'), true);
  const text = await res.text();
  assert.ok(text.includes('Buscador IMDb, País y Año'));
  assert.ok(!text.includes('<script>x</script>'), 'host header must be escaped');
});

test('HTTP GET /health returns ok', async () => {
  const res = await app.request('/health');
  assert.equal(res.status, 200);
  const json = (await res.json()) as { status: string };
  assert.equal(json.status, 'ok');
});

test('HTTP unknown routes return JSON 404 with CORS', async () => {
  const res = await app.request('/does/not/exist');
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});
