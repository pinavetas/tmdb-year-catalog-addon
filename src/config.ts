import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '7000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  TMDB_API_KEY: process.env.TMDB_API_KEY || '',
  DEFAULT_MIN_VOTES_MOVIE: parseInt(process.env.DEFAULT_MIN_VOTES_MOVIE || '200', 10),
  DEFAULT_MIN_VOTES_SERIES: parseInt(process.env.DEFAULT_MIN_VOTES_SERIES || '50', 10),
  
  // Cache TTLs in milliseconds
  CACHE_TTL_CATALOG_MS: 6 * 60 * 60 * 1000, // 6 hours
  CACHE_TTL_IDS_MS: 7 * 24 * 60 * 60 * 1000,  // 7 days

  // Opciones para el catálogo de Países
  COUNTRY_OPTIONS: [
    '🇪🇸 España',
    '🇺🇸 Estados Unidos',
    '🇬🇧 Reino Unido',
    '🇫🇷 Francia',
    '🇯🇵 Japón',
    '🇰🇷 Corea del Sur',
    '🇮🇹 Italia',
    '🇩🇪 Alemania',
    '🇦🇷 Argentina',
    '🇲🇽 México',
    '🇨🇦 Canadá',
    '🇦🇺 Australia',
    '🇮🇳 India',
    '🇧🇷 Brasil',
    '🇸🇪 Suecia / Nórdicos'
  ],

  // Opciones para el catálogo de Años y Épocas
  YEAR_OPTIONS: [
    '📅 2026',
    '📅 2025',
    '📅 2024',
    '📅 2023',
    '📅 2022',
    '📅 2021',
    '📅 2020',
    '📅 2015 - 2019',
    '📅 2010 - 2014',
    '📅 Década 2000',
    '📅 Años 90',
    '📅 Años 80',
    '📅 Años 70',
    '📅 Clásicos (<1970)'
  ],

  // Opciones para el catálogo de Puntuaciones
  RATING_OPTIONS: [
    '⭐ IMDb 8.5+ (Obras Maestras)',
    '⭐ IMDb 8.0+ (Sobresaliente)',
    '⭐ IMDb 7.5+ (Notable Alto)',
    '⭐ IMDb 7.0+ (Notable)'
  ]
};
