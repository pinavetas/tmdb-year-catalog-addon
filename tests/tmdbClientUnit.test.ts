import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TmdbClient, TmdbError } from '../src/services/tmdbClient.js';
import { cacheService } from '../src/services/cacheService.js';
import { installFakeTmdb, type FakeTmdb } from './helpers.js';

let fake: FakeTmdb | undefined;

beforeEach(() => cacheService.clearAll());
afterEach(() => {
  fake?.restore();
  fake = undefined;
});

function discoverPages(calls: URL[], suffix: string): number[] {
  return calls
    .filter((u) => u.pathname.endsWith(suffix))
    .map((u) => Number(u.searchParams.get('page')))
    .sort((a, b) => a - b);
}

test('TmdbClient (mock): returns a 100-item block from 5 TMDB pages with IMDb IDs', async () => {
  fake = installFakeTmdb({ totalResults: 300 });
  const client = new TmdbClient('fakekey1234567890');

  const metas = await client.getCatalog('movie', { skip: 0 });
  assert.equal(metas.length, 100);
  assert.equal(metas[0].id, 'tt0000001');
  assert.equal(metas[0].type, 'movie');
  assert.equal(metas[0].releaseInfo, '2024 · TMDB 8.1');
  assert.equal(metas[0].imdbRating, '8.1');
  assert.ok(metas[0].description?.includes('⭐ TMDB: 8.1/10 (900 votes)'));
  assert.equal(metas[0].poster, 'https://image.tmdb.org/t/p/w500/p.jpg');
  assert.deepEqual(discoverPages(fake.calls, '/discover/movie'), [1, 2, 3, 4, 5]);
});

test('TmdbClient (mock): skip maps to the next block and tolerates dropped items', async () => {
  fake = installFakeTmdb({ totalResults: 300 });
  const client = new TmdbClient('fakekey1234567890');

  // stremio-core envía skip = nº de elementos recibidos (ej. 97 si se descartaron 3)
  const metas = await client.getCatalog('movie', { skip: 97 });
  assert.equal(metas[0].id, 'tt0000101');
  assert.deepEqual(discoverPages(fake.calls, '/discover/movie'), [6, 7, 8, 9, 10]);
});

test('TmdbClient (mock): stops at the last TMDB page', async () => {
  fake = installFakeTmdb({ totalResults: 30 });
  const client = new TmdbClient('fakekey1234567890');

  const metas = await client.getCatalog('series', { skip: 0 });
  assert.equal(metas.length, 30);
  assert.equal(metas[0].type, 'series');
  assert.equal(metas[0].poster, undefined);
  assert.deepEqual(discoverPages(fake.calls, '/discover/tv'), [1, 2]);
});

test('TmdbClient (mock): drops items without IMDb ID', async () => {
  fake = installFakeTmdb({ totalResults: 20, withoutImdb: new Set([2, 5]) });
  const client = new TmdbClient('fakekey1234567890');

  const metas = await client.getCatalog('movie', { skip: 0 });
  assert.equal(metas.length, 18);
  assert.ok(metas.every((m) => /^tt\d+$/.test(m.id)));
});

test('TmdbClient (mock): builds discover params (countries OR, rating, year capped at today)', async () => {
  fake = installFakeTmdb({ totalResults: 5 });
  const client = new TmdbClient('fakekey1234567890');
  const year = new Date().getFullYear();

  await client.getCatalog('movie', { skip: 0, countries: ['SE', 'NO'], voteAverageGte: 7.5, year }, { minVotesMovie: 321 });
  const url = fake.calls.find((u) => u.pathname.endsWith('/discover/movie'))!;
  assert.equal(url.searchParams.get('with_origin_country'), 'SE|NO');
  assert.equal(url.searchParams.get('vote_average.gte'), '7.5');
  assert.equal(url.searchParams.get('vote_count.gte'), '321');
  assert.equal(url.searchParams.get('sort_by'), 'vote_average.desc');
  assert.equal(url.searchParams.get('primary_release_date.gte'), `${year}-01-01`);
  const lte = url.searchParams.get('primary_release_date.lte')!;
  assert.ok(lte <= new Date().toISOString().slice(0, 10), 'no debe incluir estrenos futuros');
  assert.equal(url.searchParams.get('api_key'), 'fakekey1234567890');
});

test('TmdbClient (mock): series use first_air_date filters', async () => {
  fake = installFakeTmdb({ totalResults: 5 });
  const client = new TmdbClient('fakekey1234567890');

  await client.getCatalog('series', { skip: 0, yearGte: 1990, yearLte: 1999 });
  const url = fake.calls.find((u) => u.pathname.endsWith('/discover/tv'))!;
  assert.equal(url.searchParams.get('first_air_date.gte'), '1990-01-01');
  assert.equal(url.searchParams.get('first_air_date.lte'), '1999-12-31');
});

test('TmdbClient (mock): uses /search with title and year', async () => {
  fake = installFakeTmdb({ totalResults: 3 });
  const client = new TmdbClient('fakekey1234567890');

  await client.getCatalog('movie', { skip: 0, searchTitle: 'fast & furious', year: 2009 });
  const url = fake.calls.find((u) => u.pathname.endsWith('/search/movie'))!;
  assert.equal(url.searchParams.get('query'), 'fast & furious');
  assert.equal(url.searchParams.get('primary_release_year'), '2009');
});

test('TmdbClient (mock): v4 read access tokens are sent as Bearer header', async () => {
  const original = globalThis.fetch;
  let auth: string | null = null;
  let apiKeyParam: string | null = 'unset';
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.includes('/discover/')) {
      auth = new Headers(init?.headers).get('authorization');
      apiKeyParam = url.searchParams.get('api_key');
    }
    return Response.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
  }) as typeof fetch;
  try {
    const client = new TmdbClient('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.signature');
    await client.getCatalog('movie', { skip: 0 });
    assert.equal(auth, 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.signature');
    assert.equal(apiKeyParam, null);
  } finally {
    globalThis.fetch = original;
  }
});

test('TmdbClient (mock): caches complete results and does not refetch', async () => {
  fake = installFakeTmdb({ totalResults: 10 });
  const client = new TmdbClient('fakekey1234567890');

  await client.getCatalog('movie', { skip: 0, year: 2020 });
  const callsAfterFirst = fake.calls.length;
  await client.getCatalog('movie', { skip: 0, year: 2020 });
  assert.equal(fake.calls.length, callsAfterFirst, 'la segunda petición idéntica debe salir de caché');
});

test('TmdbClient (mock): incomplete results (external_ids errors) are not cached', async () => {
  fake = installFakeTmdb({ totalResults: 10, failingExternalIds: new Set([3]) });
  const client = new TmdbClient('fakekey1234567890');

  const result = await client.getCatalogResult('movie', { skip: 0 });
  assert.equal(result.complete, false);
  assert.equal(result.metas.length, 9);
  assert.equal(cacheService.getStats().catalogSize, 0);
});

test('TmdbClient (mock): TMDB errors throw TmdbError and are not cached', async () => {
  fake = installFakeTmdb({ listStatus: 401 });
  const client = new TmdbClient('fakekey1234567890');

  await assert.rejects(() => client.getCatalog('movie', { skip: 0 }), TmdbError);
  assert.equal(cacheService.getStats().catalogSize, 0);
});

test('TmdbClient (mock): missing API key throws', async () => {
  const client = new TmdbClient('');
  await assert.rejects(() => client.getCatalog('movie', { skip: 0 }), TmdbError);
});

test('TmdbClient (mock): maps TMDB genres and uses RPDB posters when configured', async () => {
  fake = installFakeTmdb({ totalResults: 20 });
  const client = new TmdbClient('fakekey1234567890');

  const metas = await client.getCatalog('movie', { skip: 0 }, {
    rpdbKey: 't0-free-rpdb',
    language: 'es'
  });

  assert.equal(metas.length, 20);
  const first = metas[0];
  assert.equal(first.poster, 'https://api.ratingposterdb.com/t0-free-rpdb/imdb/poster-default/tt0000001.jpg?fallback=true');
  assert.deepEqual(first.genres, ['Acción', 'Ciencia Ficción']);
});
