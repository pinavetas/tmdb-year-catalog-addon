/**
 * Utilidades de test: mock de `fetch` para simular la API de TMDB sin red.
 */
export interface FakeTmdbOptions {
  /** Nº de resultados totales de discover/search (paginados de 20 en 20) */
  totalResults?: number;
  /** IDs de TMDB que no tienen IMDb ID */
  withoutImdb?: Set<number>;
  /** IDs de TMDB cuyo external_ids devuelve 500 */
  failingExternalIds?: Set<number>;
  /** Estado HTTP forzado para discover/search */
  listStatus?: number;
}

export interface FakeTmdb {
  calls: URL[];
  restore: () => void;
}

export function installFakeTmdb(options: FakeTmdbOptions = {}): FakeTmdb {
  const original = globalThis.fetch;
  const calls: URL[] = [];
  const total = options.totalResults ?? 60;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    calls.push(url);

    const external = url.pathname.match(/\/3\/(movie|tv)\/(\d+)\/external_ids$/);
    if (external) {
      const id = Number(external[2]);
      if (options.failingExternalIds?.has(id)) return new Response('boom', { status: 404 });
      const imdb = options.withoutImdb?.has(id) ? null : `tt${String(id).padStart(7, '0')}`;
      return Response.json({ id, imdb_id: imdb });
    }

    if (/\/3\/(discover|search)\/(movie|tv)$/.test(url.pathname)) {
      if (options.listStatus && options.listStatus !== 200) {
        return new Response('{"status_message":"error"}', { status: options.listStatus });
      }
      const isMovie = url.pathname.endsWith('/movie');
      const page = Number(url.searchParams.get('page') || '1');
      const totalPages = Math.ceil(total / 20);
      const start = (page - 1) * 20;
      const count = Math.max(0, Math.min(20, total - start));
      const results = Array.from({ length: count }, (_, i) => {
        const id = start + i + 1;
        return isMovie
          ? { id, title: `Movie ${id}`, original_title: `Movie ${id}`, overview: `Overview of movie ${id}`, poster_path: '/p.jpg', backdrop_path: '/b.jpg', release_date: '2024-05-01', vote_average: 8.1, vote_count: 900, popularity: 10, genre_ids: [28, 878] }
          : { id, name: `Show ${id}`, original_name: `Show ${id}`, overview: `Overview of show ${id}`, poster_path: null, backdrop_path: null, first_air_date: '2023-01-01', vote_average: 7.2, vote_count: 300, popularity: 5, genre_ids: [18] };
      });
      return Response.json({ page, results, total_pages: totalPages, total_results: total });
    }

    return new Response('not found', { status: 404 });
  }) as typeof fetch;

  return { calls, restore: () => { globalThis.fetch = original; } };
}
