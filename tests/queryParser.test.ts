import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryParser } from '../src/services/queryParser.js';

test('QueryParser: should parse genre country options', () => {
  const f1 = QueryParser.parseExtra('genre=🇪🇸 España');
  assert.equal(f1.country, 'ES');

  const f2 = QueryParser.parseExtra('genre=🇯🇵 Japón');
  assert.equal(f2.country, 'JP');

  const f3 = QueryParser.parseExtra('genre=🇰🇷 Corea del Sur');
  assert.equal(f3.country, 'KR');
});

test('QueryParser: should parse genre rating options', () => {
  const f1 = QueryParser.parseExtra('genre=⭐ IMDb 8.5+');
  assert.equal(f1.voteAverageGte, 8.5);

  const f2 = QueryParser.parseExtra('genre=⭐ IMDb 7.0+');
  assert.equal(f2.voteAverageGte, 7.0);
});

test('QueryParser: should parse genre specific year and decade options', () => {
  const f1 = QueryParser.parseExtra('genre=📅 2024');
  assert.equal(f1.year, 2024);

  const f2 = QueryParser.parseExtra('genre=📅 Años 90');
  assert.equal(f2.yearGte, 1990);
  assert.equal(f2.yearLte, 1999);

  const f3 = QueryParser.parseExtra('genre=📅 2015 - 2019');
  assert.equal(f3.yearGte, 2015);
  assert.equal(f3.yearLte, 2019);

  const f4 = QueryParser.parseExtra('genre=📅 Clásicos (<1970)');
  assert.equal(f4.yearLte, 1969);
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
});

test('QueryParser: should parse skip pagination parameter', () => {
  const f1 = QueryParser.parseExtra('genre=📅 2024&skip=40');
  assert.equal(f1.year, 2024);
  assert.equal(f1.skip, 40);
});
