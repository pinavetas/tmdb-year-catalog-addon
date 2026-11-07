import test from 'node:test';
import assert from 'node:assert/strict';
import { getManifest, ADDON_VERSION, CATALOG_SPECS } from '../src/routes/manifest.js';
import { buildYearOptions } from '../src/config.js';
import { encodeConfig } from '../src/types/config.js';

test('getManifest returns a valid Stremio v3 manifest with 8 catalogs by default', () => {
  const manifest = getManifest();

  // Campos obligatorios
  assert.equal(manifest.id, 'community.imdb-year-catalog');
  assert.equal(manifest.version, ADDON_VERSION);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.name.length > 0);
  assert.ok(manifest.description.length > 0);
  assert.deepEqual(manifest.resources, ['catalog']);
  assert.ok(manifest.types.includes('movie'));
  assert.ok(manifest.types.includes('series'));

  // 3 películas + 3 series + 2 búsquedas
  assert.equal(manifest.catalogs.length, 8);

  const countryMovies = manifest.catalogs.find((c) => c.id === 'imdb_country_movies');
  assert.ok(countryMovies, 'Country movies catalog must exist');
  assert.ok(countryMovies.extra?.some((e) => e.name === 'genre' && e.options && e.options.length > 0));
  assert.ok(countryMovies.extra?.some((e) => e.name === 'skip'), 'skip extra needed for pagination');
  assert.ok(!countryMovies.extra?.some((e) => e.name === 'search'), 'browse catalogs must not duplicate search rows');

  assert.ok(manifest.catalogs.find((c) => c.id === 'imdb_year_movies'));
  assert.ok(manifest.catalogs.find((c) => c.id === 'imdb_rating_movies'));

  // Búsqueda: solo en catálogos dedicados con search obligatorio
  const searchCatalogs = manifest.catalogs.filter((c) => c.extra?.some((e) => e.name === 'search'));
  assert.deepEqual(searchCatalogs.map((c) => c.id).sort(), ['imdb_search_movies', 'imdb_search_series']);
  for (const c of searchCatalogs) {
    assert.equal(c.extra?.find((e) => e.name === 'search')?.isRequired, true);
  }

  // Todos los catálogos del manifiesto existen en el registro de la ruta de catálogo
  for (const c of manifest.catalogs) {
    assert.equal(CATALOG_SPECS[c.id]?.type, c.type, `catalog ${c.id} must be routable`);
  }

  assert.equal(manifest.behaviorHints?.configurable, true);
  assert.equal(manifest.behaviorHints?.configurationRequired, false);
  assert.equal(manifest.background, undefined, 'no background unless an image is served');
});

test('getManifest builds an absolute logo URL from the base URL', () => {
  const manifest = getManifest(undefined, 'https://addon.example.com/');
  assert.equal(manifest.logo, 'https://addon.example.com/logo.png');
});

test('getManifest with config adapts catalogs dynamically', () => {
  const configStr = encodeConfig({
    enableMovies: true,
    enableSeries: false,
    enableSearch: false,
    enableTopMovies8: true,
    enableRecentReleases: true
  });

  const manifest = getManifest(configStr);

  assert.equal(manifest.catalogs.some((c) => c.type === 'series'), false);
  assert.deepEqual(manifest.types, ['movie']);
  assert.equal(manifest.catalogs.some((c) => c.id === 'top_movies_8'), true);
  assert.equal(manifest.catalogs.some((c) => c.id === 'recent_releases'), true);
  assert.equal(manifest.catalogs.some((c) => c.id.startsWith('imdb_search')), false);
});

test('buildYearOptions keeps the year dropdown up to date', () => {
  const options2030 = buildYearOptions(2030);
  assert.equal(options2030[0], '📅 2030');
  assert.ok(options2030.includes('📅 2020'));
  assert.ok(!options2030.includes('📅 2019'));
  assert.ok(options2030.includes('📅 2015 - 2019'));
  assert.equal(options2030.at(-1), '📅 Clásicos (<1970)');
});
