import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('HTTP GET /manifest.json returns 200 with CORS and valid JSON', async () => {
  const res = await app.request('/manifest.json');
  
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('application/json'), true);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');

  const json = await res.json();
  assert.equal(json.id, 'community.imdb-year-catalog');
  assert.equal(json.catalogs.length, 2);
});

test('HTTP GET / returns HTML welcome card', async () => {
  const res = await app.request('/');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('text/html'), true);
  const text = await res.text();
  assert.ok(text.includes('Buscador IMDb & Año Addon'));
});
