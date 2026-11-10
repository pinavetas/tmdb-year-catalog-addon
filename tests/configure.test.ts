import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { encodeConfig, decodeConfig } from '../src/types/config.js';
import type { Manifest } from '../src/types/stremio.js';

test('Configure Route: GET /configure returns HTML with inputs', async () => {
  const res = await app.request('/configure');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('text/html'), true);

  const html = await res.text();
  assert.ok(html.includes('Catálogo TMDB: Año, País y Calidad'));
  assert.ok(html.includes('id="tmdbKey"'));
  assert.ok(!html.includes('Obligatoria'));
  assert.ok(!html.includes('Obligatorio'));
  assert.ok(html.includes('themoviedb.org/settings/api'));
  assert.ok(html.includes('id="minRating"'));
  assert.ok(html.includes('id="region_europe"'));
  assert.ok(html.includes('id="minVotesMovie"'));
  assert.ok(html.includes('id="enableSearch"'));
  assert.ok(html.includes('id="installStremioBtn"'));
  assert.ok(html.includes('id="installWebBtn"'));
});

test('Configure Route: GET /:config/configure works for already configured addons', async () => {
  const config = encodeConfig({ enableSeries: false });
  const res = await app.request(`/${config}/configure`);
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes('id="configForm"'));
});

test('Config serialization: encodeConfig and decodeConfig roundtrip', () => {
  const original = {
    tmdbApiKey: 'testkey1234567890',
    language: 'en' as const,
    regions: ['europe', 'us'],
    minRating: 7.5,
    minVotesMovie: 350,
    minVotesSeries: 80,
    enableMovies: true,
    enableSeries: false,
    enableSearch: false
  };

  const decoded = decodeConfig(encodeConfig(original));
  assert.deepEqual(decoded, original);
});

test('Config defaults: min votes are left to the server environment', () => {
  const decoded = decodeConfig(encodeConfig({ enableMovies: true }));
  assert.equal(decoded.minVotesMovie, undefined);
  assert.equal(decoded.minVotesSeries, undefined);
  assert.equal(decoded.enableSearch, true);
});

test('Config validation: decodeConfig sanitizes out-of-range values', () => {
  const decoded1 = decodeConfig(encodeConfig({ minVotesMovie: -100, minVotesSeries: 99999 }));
  assert.equal(decoded1.minVotesMovie, 1);
  assert.equal(decoded1.minVotesSeries, 2000);

  const decoded2 = decodeConfig('not_valid_base64!!!');
  assert.equal(decoded2.enableMovies, true, 'Should return defaults for invalid input');
  assert.equal(decoded2.minVotesMovie, undefined);

  const decoded3 = decodeConfig('a'.repeat(5000));
  assert.equal(decoded3.enableMovies, true, 'Oversized config must be ignored');
});

test('Config validation: decodeConfig accepts v3 keys and v4 tokens but rejects invalid chars', () => {
  const bad = decodeConfig(Buffer.from(JSON.stringify({ tmdbApiKey: 'key with spaces!' })).toString('base64url'));
  assert.equal(bad.tmdbApiKey, undefined);

  const v3 = decodeConfig(encodeConfig({ tmdbApiKey: '0123456789abcdef0123456789abcdef' }));
  assert.equal(v3.tmdbApiKey, '0123456789abcdef0123456789abcdef');

  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ4In0.abc-DEF_123';
  assert.equal(decodeConfig(encodeConfig({ tmdbApiKey: token })).tmdbApiKey, token);
});

test('Config decoding accepts standard base64 as well as base64url', () => {
  const std = Buffer.from(JSON.stringify({ enableSeries: false })).toString('base64');
  assert.equal(decodeConfig(std).enableSeries, false);
});

test('Custom Manifest: GET /:config/manifest.json adapts catalogs dynamically', async () => {
  const customConfig = encodeConfig({
    enableMovies: true,
    enableSeries: false,
    enableSearch: false
  });

  const res = await app.request(`/${customConfig}/manifest.json`);
  assert.equal(res.status, 200);

  const manifest = (await res.json()) as Manifest;
  assert.equal(manifest.catalogs.some((c) => c.type === 'series'), false);
  assert.equal(manifest.catalogs.some((c) => c.id === 'imdb_movies'), true);
  assert.equal(manifest.catalogs.length, 1);
});
