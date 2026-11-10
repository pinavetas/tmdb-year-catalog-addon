import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { tmdbClient } from '../src/services/tmdbClient.js';
import { encodeConfig } from '../src/types/config.js';
import type { CatalogResponse, MetaPreview } from '../src/types/stremio.js';
import type { ParsedFilters } from '../src/services/queryParser.js';

// Replaces TMDB client to verify routing and filters without network
const original = tmdbClient.getCatalogResult;
let lastCall: { type: string; filters: ParsedFilters; minVotesMovie?: number } | undefined;
let nextResult: { metas: MetaPreview[]; complete: boolean } | Error;

beforeEach(() => {
  lastCall = undefined;
  nextResult = { metas: [{ id: 'tt0111161', type: 'movie', name: 'Test' }], complete: true };
  tmdbClient.getCatalogResult = async (type, filters, userConfig) => {
    lastCall = { type, filters, minVotesMovie: userConfig?.minVotesMovie };
    if (nextResult instanceof Error) throw nextResult;
    return nextResult;
  };
});

afterEach(() => {
  tmdbClient.getCatalogResult = original;
});

test('Catalog route: parses encoded genre and skip from the raw path', async () => {
  const res = await app.request('/catalog/movie/tmdb_movies/genre=2024&skip=100.json');
  assert.equal(res.status, 200);
  assert.equal(lastCall?.filters.year, 2024);
  assert.equal(lastCall?.filters.skip, 100);

  const body = (await res.json()) as CatalogResponse;
  assert.equal(body.metas.length, 1);
  assert.equal(typeof body.cacheMaxAge, 'number');
  assert.match(res.headers.get('cache-control') || '', /s-maxage=\d+/);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('Catalog route: backward-compatibility alias imdb_movies routes correctly', async () => {
  const res = await app.request('/catalog/movie/imdb_movies/genre=2024&skip=100.json');
  assert.equal(res.status, 200);
  assert.equal(lastCall?.filters.year, 2024);
  assert.equal(lastCall?.filters.skip, 100);
});

test('Catalog route: keeps encoded "&" inside search terms', async () => {
  await app.request('/catalog/movie/tmdb_search_movies/search=fast%20%26%20furious.json');
  assert.equal(lastCall?.filters.searchTitle, 'fast & furious');
});

test('Catalog route: natural language search without title uses discover filters', async () => {
  await app.request('/catalog/series/tmdb_search_series/search=2023%208%2B.json');
  assert.equal(lastCall?.type, 'series');
  assert.equal(lastCall?.filters.year, 2023);
  assert.equal(lastCall?.filters.voteAverageGte, 8);
  assert.equal(lastCall?.filters.searchTitle, undefined);
});

test('Catalog route: search catalog without search term returns empty', async () => {
  const res = await app.request('/catalog/movie/tmdb_search_movies.json');
  assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  assert.equal(lastCall, undefined);
});

test('Catalog route: catalog defaults (year → current year, minRating → 7.0, default regions)', async () => {
  await app.request('/catalog/movie/tmdb_movies.json');
  assert.equal(lastCall?.filters.year, new Date().getFullYear());
  assert.equal(lastCall?.filters.voteAverageGte, 7.0);
  assert.equal(lastCall?.filters.sortBy, 'vote_average.desc');
  assert.ok(lastCall?.filters.countries && lastCall.filters.countries.includes('ES'));
});

test('Catalog route: custom user config applies regions and minRating', async () => {
  const customConfig = encodeConfig({
    regions: ['spain'],
    minRating: 8.5
  });
  await app.request(`/${customConfig}/catalog/movie/tmdb_movies.json`);
  assert.deepEqual(lastCall?.filters.countries, ['ES']);
  assert.equal(lastCall?.filters.voteAverageGte, 8.5);
});

test('Catalog route: rejects unknown catalogs and type mismatches', async () => {
  for (const path of ['/catalog/movie/unknown.json', '/catalog/series/tmdb_movies.json', '/catalog/tv/tmdb_movies.json']) {
    const res = await app.request(path);
    assert.equal(res.status, 200);
    assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  }
  assert.equal(lastCall, undefined);
});

test('Catalog route: applies user config from the URL', async () => {
  const config = encodeConfig({ minVotesMovie: 777 });
  await app.request(`/${config}/catalog/movie/tmdb_movies/genre=2022.json`);
  assert.equal(lastCall?.minVotesMovie, 777);
  assert.equal(lastCall?.filters.year, 2022);
});

test('Catalog route: TMDB failures return empty metas with no-store', async () => {
  nextResult = new Error('TMDB down');
  const res = await app.request('/catalog/movie/tmdb_movies.json');
  assert.equal(res.status, 200);
  assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('Catalog route: incomplete results get a short cache', async () => {
  nextResult = { metas: [{ id: 'tt1', type: 'movie', name: 'x' }], complete: false };
  const res = await app.request('/catalog/movie/tmdb_movies.json');
  assert.match(res.headers.get('cache-control') || '', /max-age=300,/);
});
