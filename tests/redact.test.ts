import test from 'node:test';
import assert from 'node:assert/strict';
import { redactConfigSegment } from '../src/utils/redact.js';

test('redactConfigSegment: hides the user config segment in log lines', () => {
  const cfg = 'eyJ0bWRiQXBpS2V5IjoiYWJjZGVmMTIzNDU2Nzg5MCJ9';
  assert.equal(redactConfigSegment(`<-- GET /${cfg}/manifest.json`), '<-- GET /<config>/manifest.json');
  assert.equal(
    redactConfigSegment(`--> GET /${cfg}/catalog/movie/tmdb_movies.json 200 3ms`),
    '--> GET /<config>/catalog/movie/tmdb_movies.json 200 3ms'
  );
  assert.equal(redactConfigSegment(`<-- GET /${cfg}/configure`), '<-- GET /<config>/configure');
});

test('redactConfigSegment: leaves paths without config untouched', () => {
  const line = '<-- GET /catalog/movie/tmdb_search_movies/search=interstellar%202014.json';
  assert.equal(redactConfigSegment(line), line);
  assert.equal(redactConfigSegment('<-- GET /manifest.json'), '<-- GET /manifest.json');
});
