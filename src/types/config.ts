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
 * Codifica la configuración en Base64 seguro para URLs
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
 * Decodifica una cadena Base64 a configuración de usuario con fallbacks
 */
export function decodeConfig(configStr?: string): AddonUserConfig {
  if (!configStr) return { ...DEFAULT_USER_CONFIG };

  try {
    // Soportar tanto base64url como base64 estándar
    const json = Buffer.from(configStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    return {
      ...DEFAULT_USER_CONFIG,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_USER_CONFIG };
  }
}
