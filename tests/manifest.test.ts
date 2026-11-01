import test from 'node:test';
import assert from 'node:assert/strict';
import { getManifest } from '../src/routes/manifest.js';

test('getManifest should return a valid Stremio v3 manifest', () => {
  const manifest = getManifest();

  // Basic required fields
  assert.equal(manifest.id, 'community.imdb-year-catalog');
  assert.equal(manifest.version, '1.0.0');
  assert.ok(manifest.name.length > 0);
  assert.ok(manifest.description.length > 0);
  assert.ok(manifest.resources.includes('catalog'));
  assert.ok(manifest.types.includes('movie'));
  assert.ok(manifest.types.includes('series'));

  // Catalog assertions
  assert.equal(manifest.catalogs.length, 2);
  
  const movieCatalog = manifest.catalogs.find(c => c.type === 'movie');
  assert.ok(movieCatalog, 'Movie catalog must exist');
  assert.equal(movieCatalog.id, 'imdb_year_movies');
  assert.ok(movieCatalog.extra && movieCatalog.extra.length >= 3);

  const seriesCatalog = manifest.catalogs.find(c => c.type === 'series');
  assert.ok(seriesCatalog, 'Series catalog must exist');
  assert.equal(seriesCatalog.id, 'imdb_year_series');

  // Verify genre filter options exist
  const genreExtra = movieCatalog.extra?.find(e => e.name === 'genre');
  assert.ok(genreExtra, 'Genre extra option must exist');
  assert.ok(Array.isArray(genreExtra.options));
  assert.ok(genreExtra.options.length > 0);

  // Check behavior hints
  assert.equal(manifest.behaviorHints?.configurable, true);
  assert.equal(manifest.behaviorHints?.configurationRequired, false);
});
