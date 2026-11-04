export interface ParsedFilters {
  voteAverageGte?: number;
  voteAverageLte?: number;
  year?: number;
  yearGte?: number;
  yearLte?: number;
  country?: string;
  /** Lista de códigos ISO 3166-1 para filtros multi-país (ej. Nórdicos: SE, NO, DK, FI) */
  countries?: string[];
  searchTitle?: string;
  skip: number;
}

export class QueryParser {
  /**
   * Parsea la cadena `extra` recibida de Stremio.
   */
  static parseExtra(extraStr?: string): ParsedFilters {
    const filters: ParsedFilters = { skip: 0 };
    if (!extraStr) return filters;

    let decoded = extraStr;
    try {
      decoded = decodeURIComponent(extraStr);
    } catch {
      // Usar tal cual si falla
    }

    const parts = decoded.split('&');
    const params = new Map<string, string>();

    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx !== -1) {
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        params.set(key, value);
      }
    }

    // 1. Manejo de paginación (skip)
    const skipVal = params.get('skip');
    if (skipVal) {
      filters.skip = Math.max(0, parseInt(skipVal, 10) || 0);
    }

    // 2. Manejo de opción seleccionada en el desplegable (genre)
    const genreVal = params.get('genre');
    if (genreVal) {
      this.applyGenreFilter(genreVal, filters);
    }

    // 3. Manejo de búsqueda por texto libre (search)
    const searchVal = params.get('search');
    if (searchVal) {
      this.applySearchFilter(searchVal, filters);
    }

    return filters;
  }

  /**
   * Mapea las opciones predefinidas del desplegable a filtros TMDB (Países, Notas, Años)
   */
  static applyGenreFilter(option: string, filters: ParsedFilters): void {
    const clean = option.trim();

    // 1. Países (un solo código ISO 3166-1 por opción, excepto Nórdicos)
    if (clean.includes('España')) filters.country = 'ES';
    else if (clean.includes('Estados Unidos')) filters.country = 'US';
    else if (clean.includes('Reino Unido')) filters.country = 'GB';
    else if (clean.includes('Francia')) filters.country = 'FR';
    else if (clean.includes('Japón')) filters.country = 'JP';
    else if (clean.includes('Corea')) filters.country = 'KR';
    else if (clean.includes('Italia')) filters.country = 'IT';
    else if (clean.includes('Alemania')) filters.country = 'DE';
    else if (clean.includes('Argentina')) filters.country = 'AR';
    else if (clean.includes('México')) filters.country = 'MX';
    else if (clean.includes('Canadá')) filters.country = 'CA';
    else if (clean.includes('Australia')) filters.country = 'AU';
    else if (clean.includes('India')) filters.country = 'IN';
    else if (clean.includes('Brasil')) filters.country = 'BR';
    else if (clean.includes('Suecia') || clean.includes('Nórdicos')) {
      // TMDB no admite múltiples países en with_origin_country,
      // así que usamos peticiones paralelas por cada país nórdico.
      filters.countries = ['SE', 'NO', 'DK', 'FI'];
    }

    // 2. Puntuaciones
    if (clean.includes('8.5')) filters.voteAverageGte = 8.5;
    else if (clean.includes('8.0')) filters.voteAverageGte = 8.0;
    else if (clean.includes('7.5')) filters.voteAverageGte = 7.5;
    else if (clean.includes('7.0')) filters.voteAverageGte = 7.0;

    // 3. Años específicos
    const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch && !clean.includes('-') && !clean.includes('Década') && !clean.includes('Años') && !clean.includes('Clásicos')) {
      filters.year = parseInt(yearMatch[1], 10);
      return;
    }

    // 4. Rangos de años y épocas
    if (clean.includes('2015 - 2019')) {
      filters.yearGte = 2015;
      filters.yearLte = 2019;
    } else if (clean.includes('2010 - 2014')) {
      filters.yearGte = 2010;
      filters.yearLte = 2014;
    } else if (clean.includes('Década 2000')) {
      filters.yearGte = 2000;
      filters.yearLte = 2009;
    } else if (clean.includes('Años 90')) {
      filters.yearGte = 1990;
      filters.yearLte = 1999;
    } else if (clean.includes('Años 80')) {
      filters.yearGte = 1980;
      filters.yearLte = 1989;
    } else if (clean.includes('Años 70')) {
      filters.yearGte = 1970;
      filters.yearLte = 1979;
    } else if (clean.includes('Clásicos')) {
      filters.yearLte = 1969;
    }
  }

  /**
   * Parsea cadenas de búsqueda en lenguaje natural
   */
  static applySearchFilter(query: string, filters: ParsedFilters): void {
    let remaining = query.trim();

    // 1. Extraer comando explícito tipo year:2022 o rating:8.0
    const explicitYear = remaining.match(/\byear:(\d{4})\b/i);
    if (explicitYear) {
      filters.year = parseInt(explicitYear[1], 10);
      remaining = remaining.replace(explicitYear[0], '').trim();
    }

    const explicitRating = remaining.match(/\brating:([0-9.]+)\b/i);
    if (explicitRating) {
      filters.voteAverageGte = parseFloat(explicitRating[1]);
      remaining = remaining.replace(explicitRating[0], '').trim();
    }

    // 2. Extraer notas tipo ">8.0", "8+", "7.5+", "8.0+"
    const ratingPattern = /(?:>|>=)\s*([6-9](?:\.\d)?)|([6-9](?:\.\d)?)\s*(?:\+|>=|>)/;
    const ratingMatch = remaining.match(ratingPattern);
    if (ratingMatch) {
      const val = ratingMatch[1] || ratingMatch[2];
      if (val) filters.voteAverageGte = parseFloat(val);
      remaining = remaining.replace(ratingMatch[0], '').trim();
    }

    // 3. Extraer año libre (1900-2099)
    const yearMatch = remaining.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch && !filters.year) {
      filters.year = parseInt(yearMatch[1], 10);
      remaining = remaining.replace(yearMatch[0], '').trim();
    }

    // 4. Lo que quede es el título a buscar
    if (remaining.length > 0) {
      filters.searchTitle = remaining;
    }
  }
}
