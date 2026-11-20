/**
 * Llamadas a servicios de terceros (APIs de metadatos, resolvers…), común a la familia.
 * Origen: el cliente de TMDB de los catálogos (tiempo límite, reintentos acotados, sin reintentar
 * errores deterministas y concurrencia limitada).
 *
 * Cada addon elige `retries` según su ruta crítica: un catálogo puede permitirse reintentar un 429;
 * una petición de streams que espera la TV, no (retries: 0, y su propio plazo global).
 */

export class UpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  /** Tiempo límite de cada intento (ms). */
  timeoutMs?: number;
  /** Reintentos ante 429, 5xx o error de red (los 4xx no se reintentan). */
  retries?: number;
  /** Tope de espera de un Retry-After (s). */
  maxRetryAfterS?: number;
  /** Etiqueta para los mensajes de error (p. ej. «TMDB /discover/movie»). */
  label?: string;
  signal?: AbortSignal;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET JSON con tiempo límite y reintentos acotados. Lanza UpstreamError si no hay respuesta válida. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { headers, timeoutMs = 8000, retries = 2, maxRetryAfterS = 5, label = new URL(url).host } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
      const res = await fetch(url, { headers, signal });

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '', 10);
        const waitS = Number.isFinite(retryAfter) ? Math.min(Math.max(retryAfter, 1), maxRetryAfterS) : attempt + 1;
        await res.body?.cancel();
        await sleep(waitS * 1000);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new UpstreamError(`${label} ${res.status}: ${body.slice(0, 200)}`, res.status);
      }

      return (await res.json()) as T;
    } catch (err) {
      // Errores HTTP deterministas (4xx) y cancelaciones del llamante: sin reintentos
      if (err instanceof UpstreamError || options.signal?.aborted) throw err;
      lastError = err;
      if (attempt < retries) await sleep(500 * (attempt + 1));
    }
  }

  throw new UpstreamError(`${label} unreachable: ${String(lastError)}`);
}

/** Ejecuta `fn` sobre `items` con una concurrencia máxima, preservando el orden. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(0, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
