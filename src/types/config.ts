export interface AddonUserConfig {
  tmdbApiKey?: string;
  minVotesMovie?: number;
  minVotesSeries?: number;
  enableMovies?: boolean;
  enableSeries?: boolean;
  enableTopMovies8?: boolean;
  enableTopSeries8?: boolean;
  enableRecentReleases?: boolean;
}

export const DEFAULT_USER_CONFIG: AddonUserConfig = {
  minVotesMovie: 200,
  minVotesSeries: 50,
  enableMovies: true,
  enableSeries: true,
  enableTopMovies8: false,
  enableTopSeries8: false,
  enableRecentReleases: false
};

/**
 * Codifica la configuración en Base64 seguro para URLs.
 *
 * IMPORTANTE: Base64 NO es encriptación. Si el usuario proporciona su propia
 * API key de TMDB, esta será visible en la URL del manifiesto. Esto es una
 * limitación inherente al protocolo de addons de Stremio, que requiere que
 * la configuración viaje en la URL.
 */
export function encodeConfig(config: AddonUserConfig): string {
  try {
    const json = JSON.stringify(config);
    return Buffer.from(json).toString('base64url');
  } catch {
    return '';
  }
}

/**
 * Decodifica una cadena Base64 a configuración de usuario con validación y fallbacks seguros.
 */
export function decodeConfig(configStr?: string): AddonUserConfig {
  if (!configStr) return { ...DEFAULT_USER_CONFIG };

  try {
    // Soportar tanto base64url como base64 estándar
    const json = Buffer.from(configStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);

    // Rechazar si no es un objeto plano
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_USER_CONFIG };
    }

    const config: AddonUserConfig = { ...DEFAULT_USER_CONFIG };

    // Sanitizar API key (solo strings alfanuméricas)
    if (typeof parsed.tmdbApiKey === 'string' && /^[a-zA-Z0-9]+$/.test(parsed.tmdbApiKey)) {
      config.tmdbApiKey = parsed.tmdbApiKey;
    }

    // Sanitizar valores numéricos con rangos válidos
    if (parsed.minVotesMovie !== undefined) {
      const val = Number(parsed.minVotesMovie);
      config.minVotesMovie = Number.isFinite(val) ? Math.min(5000, Math.max(1, Math.round(val))) : 200;
    }

    if (parsed.minVotesSeries !== undefined) {
      const val = Number(parsed.minVotesSeries);
      config.minVotesSeries = Number.isFinite(val) ? Math.min(2000, Math.max(1, Math.round(val))) : 50;
    }

    // Sanitizar booleanos (solo aceptar boolean real)
    config.enableMovies = typeof parsed.enableMovies === 'boolean' ? parsed.enableMovies : true;
    config.enableSeries = typeof parsed.enableSeries === 'boolean' ? parsed.enableSeries : true;
    config.enableTopMovies8 = typeof parsed.enableTopMovies8 === 'boolean' ? parsed.enableTopMovies8 : false;
    config.enableTopSeries8 = typeof parsed.enableTopSeries8 === 'boolean' ? parsed.enableTopSeries8 : false;
    config.enableRecentReleases = typeof parsed.enableRecentReleases === 'boolean' ? parsed.enableRecentReleases : false;

    return config;
  } catch {
    return { ...DEFAULT_USER_CONFIG };
  }
}
