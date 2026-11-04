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
  assert.ok(html.includes('Buscador IMDb y Año'));
  assert.ok(html.includes('id="tmdbKey"'));
  assert.ok(html.includes('id="minVotesMovie"'));
  assert.ok(html.includes('id="installStremioBtn"'));
});

test('Config serialization: encodeConfig and decodeConfig roundtrip', () => {
  const original = {
    tmdbApiKey: 'testkey12345',
    minVotesMovie: 350,
    minVotesSeries: 80,
    enableMovies: true,
    enableSeries: false,
    enableTopMovies8: true,
    enableTopSeries8: false,
    enableRecentReleases: true
  };

  const encoded = encodeConfig(original);
  assert.ok(typeof encoded === 'string');
  assert.ok(encoded.length > 0);

  const decoded = decodeConfig(encoded);
  assert.equal(decoded.tmdbApiKey, 'testkey12345');
  assert.equal(decoded.minVotesMovie, 350);
  assert.equal(decoded.minVotesSeries, 80);
  assert.equal(decoded.enableMovies, true);
  assert.equal(decoded.enableSeries, false);
  assert.equal(decoded.enableTopMovies8, true);
  assert.equal(decoded.enableRecentReleases, true);
});

test('Config validation: decodeConfig sanitizes out-of-range values', () => {
  // Negative minVotes
  const encoded1 = encodeConfig({ minVotesMovie: -100, minVotesSeries: 99999 });
  const decoded1 = decodeConfig(encoded1);
  assert.ok(decoded1.minVotesMovie! >= 1, 'minVotesMovie should be >= 1');
  assert.ok(decoded1.minVotesSeries! <= 2000, 'minVotesSeries should be <= 2000');

  // Invalid config string
  const decoded2 = decodeConfig('not_valid_base64!!!');
  assert.equal(decoded2.enableMovies, true, 'Should return defaults for invalid input');
  assert.equal(decoded2.minVotesMovie, 200);
});

test('Config validation: decodeConfig rejects non-alphanumeric API keys', () => {
  const encoded = Buffer.from(JSON.stringify({ tmdbApiKey: 'key with spaces!' })).toString('base64url');
  const decoded = decodeConfig(encoded);
  assert.equal(decoded.tmdbApiKey, undefined, 'Should reject API key with invalid chars');
});

test('Custom Manifest: GET /:config/manifest.json adapts catalogs dynamically', async () => {
  const customConfig = encodeConfig({
    enableMovies: true,
    enableSeries: false, // User disabled series
    enableTopMovies8: true, // User enabled preset
    enableRecentReleases: true
  });

  const res = await app.request(`/${customConfig}/manifest.json`);
  assert.equal(res.status, 200);

  const manifest = (await res.json()) as Manifest;
  // Should NOT have series catalog
  const hasSeries = manifest.catalogs.some(c => c.type === 'series');
  assert.equal(hasSeries, false);

  // Should have top_movies_8
  const hasTop8 = manifest.catalogs.some(c => c.id === 'top_movies_8');
  assert.equal(hasTop8, true);

  // Should have recent_releases
  const hasRecent = manifest.catalogs.some(c => c.id === 'recent_releases');
  assert.equal(hasRecent, true);
});
