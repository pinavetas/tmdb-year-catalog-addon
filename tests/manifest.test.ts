import test from 'node:test';
import assert from 'node:assert/strict';
import { getManifest, ADDON_VERSION, CATALOG_SPECS } from '../src/routes/manifest.js';
import { buildYearOptions } from '../src/config.js';
import { encodeConfig } from '../src/types/config.js';

test('getManifest returns a valid Stremio v3 manifest with 4 catalogs by default', () => {
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

  // 1 película + 1 serie + 2 búsquedas
  assert.equal(manifest.catalogs.length, 4);

  const moviesCatalog = manifest.catalogs.find((c) => c.id === 'imdb_movies');
  assert.ok(moviesCatalog, 'Movies catalog must exist');
  assert.ok(moviesCatalog.extra?.some((e) => e.name === 'genre' && e.options && e.options.length > 0));
  assert.ok(moviesCatalog.extra?.some((e) => e.name === 'skip'), 'skip extra needed for pagination');
  assert.ok(!moviesCatalog.extra?.some((e) => e.name === 'search'), 'browse catalogs must not duplicate search rows');

  assert.ok(manifest.catalogs.find((c) => c.id === 'imdb_series'));

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
  assert.equal(manifest.behaviorHints?.configurationRequired, true);
  assert.equal(manifest.background, undefined, 'no background unless an image is served');

  const configured = getManifest(encodeConfig({ tmdbApiKey: '0123456789abcdef0123456789abcdef' }));
  assert.equal(configured.behaviorHints?.configurationRequired, false);
});

test('getManifest builds an absolute logo URL from the base URL', () => {
  const manifest = getManifest(undefined, 'https://addon.example.com/');
  assert.equal(manifest.logo, 'https://addon.example.com/logo.png');
});

test('getManifest with config adapts catalogs dynamically', () => {
  const configStr = encodeConfig({
    enableMovies: true,
    enableSeries: false,
    enableSearch: false
  });

  const manifest = getManifest(configStr);

  assert.equal(manifest.catalogs.some((c) => c.type === 'series'), false);
  assert.deepEqual(manifest.types, ['movie']);
  assert.equal(manifest.catalogs.some((c) => c.id === 'imdb_movies'), true);
  assert.equal(manifest.catalogs.length, 1);
  assert.equal(manifest.catalogs.some((c) => c.id.startsWith('imdb_search')), false);
});

test('getManifest adapts language and catalog names without icons', () => {
  const enManifest = getManifest(encodeConfig({ language: 'en' }));
  assert.equal(enManifest.name, 'TMDB Catalog: Year, Country & Rating');
  assert.equal(enManifest.catalogs.find((c) => c.id === 'imdb_movies')?.name, 'Top Movies');
  assert.equal(enManifest.catalogs.find((c) => c.id === 'imdb_series')?.name, 'Top Series');
  assert.equal(enManifest.catalogs.find((c) => c.id === 'imdb_search_movies')?.name, 'Movies (TMDB)');
  assert.equal(enManifest.catalogs.find((c) => c.id === 'imdb_search_series')?.name, 'Series (TMDB)');

  const esManifest = getManifest(encodeConfig({ language: 'es' }));
  assert.equal(esManifest.name, 'Catálogo TMDB: Año, País y Calidad');
  assert.equal(esManifest.catalogs.find((c) => c.id === 'imdb_movies')?.name, 'Mejores Películas');
  assert.equal(esManifest.catalogs.find((c) => c.id === 'imdb_series')?.name, 'Mejores Series');
  assert.equal(esManifest.catalogs.find((c) => c.id === 'imdb_search_movies')?.name, 'Películas (TMDB)');
  assert.equal(esManifest.catalogs.find((c) => c.id === 'imdb_search_series')?.name, 'Series (TMDB)');

  for (const c of [...enManifest.catalogs, ...esManifest.catalogs]) {
    assert.ok(!/[🎬📺🔎📅]/.test(c.name), `Catalog ${c.name} must not contain icons/emojis`);
  }
});

test('buildYearOptions keeps the year dropdown up to date without emojis', () => {
  const optionsEn = buildYearOptions(2030, 'en');
  assert.equal(optionsEn[0], '2030');
  assert.ok(optionsEn.includes('2020'));
  assert.ok(!optionsEn.includes('2019'));
  assert.ok(optionsEn.includes('2015 - 2019'));
  assert.ok(optionsEn.includes('2000s'));
  assert.equal(optionsEn.at(-1), 'Classics (<1970)');

  const optionsEs = buildYearOptions(2030, 'es');
  assert.equal(optionsEs[0], '2030');
  assert.ok(optionsEs.includes('Década 2000'));
  assert.equal(optionsEs.at(-1), 'Clásicos (<1970)');
});
