import test from 'node:test';
import assert from 'node:assert/strict';
import { getManifest } from '../src/routes/manifest.js';

test('getManifest should return a valid Stremio v3 manifest with 6 catalogs', () => {
  const manifest = getManifest();

  // Basic required fields
  assert.equal(manifest.id, 'community.imdb-year-catalog');
  assert.equal(manifest.version, '1.0.0');
  assert.ok(manifest.name.length > 0);
  assert.ok(manifest.resources.includes('catalog'));
  assert.ok(manifest.types.includes('movie'));
  assert.ok(manifest.types.includes('series'));

  // Catalog assertions: 3 for movie, 3 for series
  assert.equal(manifest.catalogs.length, 6);
  
  const countryMovies = manifest.catalogs.find(c => c.id === 'imdb_country_movies');
  assert.ok(countryMovies, 'Country movies catalog must exist');
  assert.ok(countryMovies.extra?.some(e => e.name === 'genre'));

  const yearMovies = manifest.catalogs.find(c => c.id === 'imdb_year_movies');
  assert.ok(yearMovies, 'Year movies catalog must exist');

  const ratingMovies = manifest.catalogs.find(c => c.id === 'imdb_rating_movies');
  assert.ok(ratingMovies, 'Rating movies catalog must exist');

  // Check behavior hints
  assert.equal(manifest.behaviorHints?.configurable, true);
  assert.equal(manifest.behaviorHints?.configurationRequired, false);
});
