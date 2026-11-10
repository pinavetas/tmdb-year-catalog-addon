export interface ParsedFilters {
  voteAverageGte?: number;
  year?: number;
  yearGte?: number;
  yearLte?: number;
  /** Fecha mínima de estreno exacta (YYYY-MM-DD), usada por presets como "Estrenos Destacados" */
  releaseDateGte?: string;
  /** Criterio de ordenación de TMDB Discover (por defecto `vote_average.desc`) */
  sortBy?: 'vote_average.desc' | 'popularity.desc';
  /** Uno o varios códigos ISO 3166-1 (varios se combinan con OR, ej. nórdicos) */
  countries?: string[];
  searchTitle?: string;
  skip: number;
}

/** Mapeo de opciones de países (inglés y español) a códigos ISO 3166-1 */
const COUNTRY_MAP: Array<[string, string[]]> = [
  ['España', ['ES']],
  ['Spain', ['ES']],
  ['Estados Unidos', ['US']],
  ['United States', ['US']],
  ['Reino Unido', ['GB']],
  ['United Kingdom', ['GB']],
  ['Francia', ['FR']],
  ['France', ['FR']],
  ['Japón', ['JP']],
  ['Japan', ['JP']],
  ['Corea', ['KR']],
  ['Korea', ['KR']],
  ['Italia', ['IT']],
  ['Italy', ['IT']],
  ['Alemania', ['DE']],
  ['Germany', ['DE']],
  ['Argentina', ['AR']],
  ['México', ['MX']],
  ['Mexico', ['MX']],
  ['Canadá', ['CA']],
  ['Canada', ['CA']],
  ['Australia', ['AU']],
  ['India', ['IN']],
  ['Brasil', ['BR']],
  ['Brazil', ['BR']],
  ['Nórdicos', ['SE', 'NO', 'DK', 'FI']],
  ['Nordic', ['SE', 'NO', 'DK', 'FI']],
  ['Suecia', ['SE', 'NO', 'DK', 'FI']],
  ['Sweden', ['SE', 'NO', 'DK', 'FI']]
];

/** Rangos de años y épocas del desplegable (inglés y español) */
const YEAR_RANGES: Array<[string, number | undefined, number]> = [
  ['2015 - 2019', 2015, 2019],
  ['2010 - 2014', 2010, 2014],
  ['Década 2000', 2000, 2009],
  ['2000s', 2000, 2009],
  ['Años 90', 1990, 1999],
  ['90s', 1990, 1999],
  ['Años 80', 1980, 1989],
  ['80s', 1980, 1989],
  ['Años 70', 1970, 1979],
  ['70s', 1970, 1979],
  ['Clásicos', undefined, 1969],
  ['Classics', undefined, 1969]
];

const MAX_SKIP = 10_000;
const MAX_SEARCH_LENGTH = 100;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export class QueryParser {
  /**
   * Parsea el segmento `extra` de una petición de catálogo de Stremio
   * (ej. `genre=%F0%9F%87%AA%F0%9F%87%B8%20Espa%C3%B1a&skip=100`).
   *
   * Debe recibir el segmento SIN decodificar: primero se separa por `&` y `=` y después se
   * decodifica cada clave/valor, de modo que un `%26` dentro de una búsqueda ("Fast & Furious")
   * no se confunda con un separador. También acepta cadenas ya decodificadas sin `&` internos.
   */
  static parseExtra(extraStr?: string): ParsedFilters {
    const filters: ParsedFilters = { skip: 0 };
    if (!extraStr) return filters;

    const params = new Map<string, string>();
    for (const part of extraStr.split('&')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = safeDecode(part.slice(0, idx)).trim();
      const value = safeDecode(part.slice(idx + 1)).trim();
      if (key) params.set(key, value);
    }

    // 1. Paginación (skip)
    const skipVal = params.get('skip');
    if (skipVal) {
      const skip = parseInt(skipVal, 10);
      filters.skip = Number.isFinite(skip) ? Math.min(MAX_SKIP, Math.max(0, skip)) : 0;
    }

    // 2. Opción seleccionada en el desplegable (genre)
    const genreVal = params.get('genre');
    if (genreVal) {
      this.applyGenreFilter(genreVal, filters);
    }

    // 3. Búsqueda por texto libre (search)
    const searchVal = params.get('search');
    if (searchVal) {
      this.applySearchFilter(searchVal.slice(0, MAX_SEARCH_LENGTH), filters);
    }

    return filters;
  }

  /**
   * Mapea las opciones predefinidas del desplegable a filtros TMDB (países, notas, años).
   */
  static applyGenreFilter(option: string, filters: ParsedFilters): void {
    const clean = option.trim();

    // 1. Países
    const country = COUNTRY_MAP.find(([label]) => clean.includes(label));
    if (country) {
      filters.countries = [...country[1]];
      return;
    }

    // 2. Puntuaciones (⭐ IMDb 8.5+ ...)
    const rating = clean.match(/\b([5-9](?:\.\d)?)\s*\+/);
    if (rating) {
      filters.voteAverageGte = parseFloat(rating[1]);
      return;
    }

    // 3. Rangos de años y épocas
    const range = YEAR_RANGES.find(([label]) => clean.includes(label));
    if (range) {
      if (range[1] !== undefined) filters.yearGte = range[1];
      filters.yearLte = range[2];
      return;
    }

    // 4. Año exacto (📅 2024)
    const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      filters.year = parseInt(yearMatch[1], 10);
    }
  }

  /**
   * Parsea cadenas de búsqueda en lenguaje natural:
   * `2023 8+`, `dune 2024`, `year:2021 rating:7.5`, `>7.5 matrix`.
   */
  static applySearchFilter(query: string, filters: ParsedFilters): void {
    let remaining = query.trim();

    // 1. Comandos explícitos year:2022 / rating:8.0
    const explicitYear = remaining.match(/\byear:(\d{4})\b/i);
    if (explicitYear) {
      filters.year = parseInt(explicitYear[1], 10);
      remaining = remaining.replace(explicitYear[0], ' ');
    }

    const explicitRating = remaining.match(/\brating:(\d+(?:\.\d+)?)/i);
    if (explicitRating) {
      const value = parseFloat(explicitRating[1]);
      if (value >= 0 && value <= 10) filters.voteAverageGte = value;
      remaining = remaining.replace(explicitRating[0], ' ');
    }

    // 2. Notas tipo ">8", ">=7.5", "8+", "7.5+"
    const ratingMatch = remaining.match(/(?:>=?)\s*([5-9](?:\.\d)?)\b|\b([5-9](?:\.\d)?)\s*\+/);
    if (ratingMatch) {
      const val = ratingMatch[1] || ratingMatch[2];
      if (val && filters.voteAverageGte === undefined) filters.voteAverageGte = parseFloat(val);
      remaining = remaining.replace(ratingMatch[0], ' ');
    }

    // 3. Año libre (1900-2099)
    const yearMatch = remaining.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch && filters.year === undefined) {
      filters.year = parseInt(yearMatch[1], 10);
      remaining = remaining.replace(yearMatch[0], ' ');
    }

    // 4. Lo que quede es el título a buscar (se normalizan espacios y '+' sueltos)
    remaining = remaining.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
    if (remaining.length > 0) {
      filters.searchTitle = remaining;
    }
  }
}
