import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryParser } from '../src/services/queryParser.js';

test('QueryParser: should parse genre country options', () => {
  assert.deepEqual(QueryParser.parseExtra('genre=🇪🇸 España').countries, ['ES']);
  assert.deepEqual(QueryParser.parseExtra('genre=🇯🇵 Japón').countries, ['JP']);
  assert.deepEqual(QueryParser.parseExtra('genre=🇰🇷 Corea del Sur').countries, ['KR']);
});

test('QueryParser: should parse percent-encoded options as sent by Stremio', () => {
  const f = QueryParser.parseExtra('genre=%F0%9F%87%AA%F0%9F%87%B8%20Espa%C3%B1a&skip=200');
  assert.deepEqual(f.countries, ['ES']);
  assert.equal(f.skip, 200);
});

test('QueryParser: should parse Nordic countries as multi-country array', () => {
  const f = QueryParser.parseExtra('genre=🇸🇪 Suecia / Nórdicos');
  assert.deepEqual(f.countries, ['SE', 'NO', 'DK', 'FI']);
});

test('QueryParser: should parse genre rating options', () => {
  assert.equal(QueryParser.parseExtra('genre=⭐ IMDb 8.5+ (Obras Maestras)').voteAverageGte, 8.5);
  assert.equal(QueryParser.parseExtra('genre=⭐ IMDb 8.0+ (Sobresaliente)').voteAverageGte, 8.0);
  assert.equal(QueryParser.parseExtra('genre=⭐ IMDb 7.0+').voteAverageGte, 7.0);
});

test('QueryParser: should parse genre specific year and decade options', () => {
  const f1 = QueryParser.parseExtra('genre=📅 2024');
  assert.equal(f1.year, 2024);

  const f2 = QueryParser.parseExtra('genre=📅 Años 90');
  assert.equal(f2.yearGte, 1990);
  assert.equal(f2.yearLte, 1999);
  assert.equal(f2.year, undefined);

  const f3 = QueryParser.parseExtra('genre=📅 2015 - 2019');
  assert.equal(f3.yearGte, 2015);
  assert.equal(f3.yearLte, 2019);
  assert.equal(f3.year, undefined);

  const f4 = QueryParser.parseExtra('genre=📅 Clásicos (<1970)');
  assert.equal(f4.yearGte, undefined);
  assert.equal(f4.yearLte, 1969);

  const f5 = QueryParser.parseExtra('genre=📅 Década 2000');
  assert.equal(f5.yearGte, 2000);
  assert.equal(f5.yearLte, 2009);
});

test('QueryParser: should parse search strings with natural language filters', () => {
  const f1 = QueryParser.parseExtra('search=2023 8+');
  assert.equal(f1.year, 2023);
  assert.equal(f1.voteAverageGte, 8.0);
  assert.equal(f1.searchTitle, undefined);

  const f2 = QueryParser.parseExtra('search=matrix 1999');
  assert.equal(f2.year, 1999);
  assert.equal(f2.searchTitle, 'matrix');

  const f3 = QueryParser.parseExtra('search=year:2021 rating:7.5');
  assert.equal(f3.year, 2021);
  assert.equal(f3.voteAverageGte, 7.5);
  assert.equal(f3.searchTitle, undefined);

  const f4 = QueryParser.parseExtra('search=>7.5 terror');
  assert.equal(f4.voteAverageGte, 7.5);
  assert.equal(f4.searchTitle, 'terror');
});

test('QueryParser: search keeps encoded separators and tolerates "+" as space', () => {
  assert.equal(QueryParser.parseExtra('search=fast%20%26%20furious').searchTitle, 'fast & furious');

  const plus = QueryParser.parseExtra('search=dune+2024');
  assert.equal(plus.searchTitle, 'dune');
  assert.equal(plus.year, 2024);

  // Porcentajes sueltos no rompen el parser
  assert.equal(QueryParser.parseExtra('search=100% love').searchTitle, '100% love');
});

test('QueryParser: should parse and clamp skip pagination parameter', () => {
  const f1 = QueryParser.parseExtra('genre=📅 2024&skip=40');
  assert.equal(f1.year, 2024);
  assert.equal(f1.skip, 40);

  assert.equal(QueryParser.parseExtra('skip=-5').skip, 0);
  assert.equal(QueryParser.parseExtra('skip=abc').skip, 0);
  assert.equal(QueryParser.parseExtra('skip=99999999').skip, 10000);
});

test('QueryParser: should return default filters for empty input', () => {
  const f = QueryParser.parseExtra(undefined);
  assert.equal(f.skip, 0);
  assert.equal(f.countries, undefined);
  assert.equal(f.year, undefined);
  assert.equal(f.voteAverageGte, undefined);
});
