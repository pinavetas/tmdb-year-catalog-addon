import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { tmdbClient } from '../src/services/tmdbClient.js';
import { encodeConfig } from '../src/types/config.js';
import type { CatalogResponse, MetaPreview } from '../src/types/stremio.js';
import type { ParsedFilters } from '../src/services/queryParser.js';

// Se sustituye el cliente TMDB para comprobar el enrutado y los filtros sin red
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
  const res = await app.request('/catalog/movie/imdb_country_movies/genre=%F0%9F%87%AF%F0%9F%87%B5%20Jap%C3%B3n&skip=100.json');
  assert.equal(res.status, 200);
  assert.deepEqual(lastCall?.filters.countries, ['JP']);
  assert.equal(lastCall?.filters.skip, 100);

  const body = (await res.json()) as CatalogResponse;
  assert.equal(body.metas.length, 1);
  assert.equal(typeof body.cacheMaxAge, 'number');
  assert.match(res.headers.get('cache-control') || '', /s-maxage=\d+/);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('Catalog route: keeps encoded "&" inside search terms', async () => {
  await app.request('/catalog/movie/imdb_search_movies/search=fast%20%26%20furious.json');
  assert.equal(lastCall?.filters.searchTitle, 'fast & furious');
});

test('Catalog route: natural language search without title uses discover filters', async () => {
  await app.request('/catalog/series/imdb_search_series/search=2023%208%2B.json');
  assert.equal(lastCall?.type, 'series');
  assert.equal(lastCall?.filters.year, 2023);
  assert.equal(lastCall?.filters.voteAverageGte, 8);
  assert.equal(lastCall?.filters.searchTitle, undefined);
});

test('Catalog route: search catalog without search term returns empty', async () => {
  const res = await app.request('/catalog/movie/imdb_search_movies.json');
  assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  assert.equal(lastCall, undefined);
});

test('Catalog route: catalog defaults (country → ES, year → current year)', async () => {
  await app.request('/catalog/movie/imdb_country_movies.json');
  assert.deepEqual(lastCall?.filters.countries, ['ES']);

  await app.request('/catalog/series/imdb_year_series.json');
  assert.equal(lastCall?.filters.year, new Date().getFullYear());
});

test('Catalog route: presets (top 8.0+, recent releases by popularity)', async () => {
  await app.request('/catalog/series/top_series_8.json');
  assert.equal(lastCall?.filters.voteAverageGte, 8);

  await app.request('/catalog/movie/recent_releases/skip=100.json');
  assert.equal(lastCall?.filters.sortBy, 'popularity.desc');
  assert.match(lastCall?.filters.releaseDateGte || '', /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(lastCall?.filters.skip, 100);
});

test('Catalog route: rejects unknown catalogs and type mismatches', async () => {
  for (const path of ['/catalog/movie/unknown.json', '/catalog/series/imdb_year_movies.json', '/catalog/tv/imdb_year_movies.json']) {
    const res = await app.request(path);
    assert.equal(res.status, 200);
    assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  }
  assert.equal(lastCall, undefined);
});

test('Catalog route: applies user config from the URL', async () => {
  const config = encodeConfig({ minVotesMovie: 777 });
  await app.request(`/${config}/catalog/movie/imdb_rating_movies/genre=%E2%AD%90%20IMDb%208.5%2B%20(Obras%20Maestras).json`);
  assert.equal(lastCall?.minVotesMovie, 777);
  assert.equal(lastCall?.filters.voteAverageGte, 8.5);
});

test('Catalog route: TMDB failures return empty metas with no-store', async () => {
  nextResult = new Error('TMDB down');
  const res = await app.request('/catalog/movie/imdb_year_movies.json');
  assert.equal(res.status, 200);
  assert.deepEqual(((await res.json()) as CatalogResponse).metas, []);
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('Catalog route: incomplete results get a short cache', async () => {
  nextResult = { metas: [{ id: 'tt1', type: 'movie', name: 'x' }], complete: false };
  const res = await app.request('/catalog/movie/imdb_year_movies.json');
  assert.match(res.headers.get('cache-control') || '', /max-age=300,/);
});
