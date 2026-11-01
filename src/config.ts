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

  // Predefined filter options shown in Stremio's 'genre' dropdown
  FILTER_OPTIONS: [
    // Calificación / Rating
    '⭐ IMDb 8.5+',
    '⭐ IMDb 8.0+',
    '⭐ IMDb 7.5+',
    '⭐ IMDb 7.0+',
    // Años Recientes
    '📅 2026',
    '📅 2025',
    '📅 2024',
    '📅 2023',
    '📅 2022',
    '📅 2021',
    '📅 2020',
    // Rangos por Décadas
    '📅 2015 - 2019',
    '📅 2010 - 2014',
    '📅 Década 2000',
    '📅 Años 90',
    '📅 Años 80',
    '📅 Clásicos (<1980)'
  ]
};
