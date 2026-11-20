import { timingSafeEqual } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { brandMarkSvg, renderLogoPng } from './glyph.js';
import type { AddonBrand } from './brand.js';
import { redactPath } from './http.js';
import { requestLoggingEnabled } from './runtime.js';
import { getUsageStats } from './usage.js';

/**
 * Aplicación Hono base de cualquier addon de la familia: middlewares y rutas comunes.
 *
 *   GET /                 ➔ 302 a /configure (la raíz siempre lleva a la configuración)
 *   GET /configure        página de configuración (también /:config/configure, engranaje de Stremio)
 *   GET /logo.png         logo 256×256 generado a partir del glifo (manifiesto)
 *   GET /favicon.svg      marca en SVG (/favicon.ico redirige al PNG)
 *   GET /robots.txt       según `noindex`
 *   GET /health           salud superficial (sin llamadas a terceros)
 *   GET /stats.json?key=  métricas agregadas de uso (404 sin STATS_KEY válida)
 *
 * El addon añade después sus rutas del protocolo (manifest, stream, catalog, meta, subtitles…).
 */
export interface AddonAppOptions {
  id: string;
  version: string;
  /** Marca Pina: genera /logo.png y /favicon.svg a partir del glifo. */
  brand?: AddonBrand;
  /** Logo propio (PNG 256×256) para addons sin marca Pina; tiene prioridad sobre el glifo. */
  logoPng?: Uint8Array;
  /** Página de configuración (HTML). */
  configurePage: (c: Context) => string | Promise<string>;
  /** Addon privado: cabecera X-Robots-Tag y robots.txt que lo excluyen de buscadores. */
  noindex?: boolean;
  /** Campos extra de /health (sin datos sensibles ni llamadas a terceros). */
  healthExtra?: () => Record<string, unknown>;
}

export function createAddonApp(options: AddonAppOptions): Hono {
  if (!options.brand && !options.logoPng) throw new Error('createAddonApp: brand or logoPng is required');
  const app = new Hono();
  let logoPng: Uint8Array | undefined = options.logoPng;
  const favicon = options.brand ? brandMarkSvg(options.brand.glyph) : undefined;

  // Log de peticiones opcional (LOG_REQUESTS=1, como PinaSports): la plataforma ya registra las
  // peticiones, y las rutas llevan la configuración del usuario. Nunca escribe el segmento ni ?key=.
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    if (requestLoggingEnabled()) {
      console.log(`${c.req.method} ${redactPath(c.req.path)} ${c.res.status} ${Date.now() - start}ms`);
    }
  });

  // CORS obligatorio para los clientes web de Stremio
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Range', 'User-Agent'],
    exposeHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 86400
  }));

  if (options.noindex) {
    app.use('*', async (c, next) => {
      await next();
      c.header('X-Robots-Tag', 'noindex, nofollow');
    });
  }

  app.get('/', (c) => c.redirect('/configure', 302));

  const configure = async (c: Context) => {
    c.header('Cache-Control', 'no-cache');
    return c.html(await options.configurePage(c));
  };
  app.get('/configure', configure);
  app.get('/:config/configure', configure);

  app.get('/logo.png', (c) => {
    logoPng ??= renderLogoPng(options.brand!.glyph);
    c.header('Content-Type', 'image/png');
    c.header('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    return c.body(new Uint8Array(logoPng));
  });

  if (favicon) {
    app.get('/favicon.svg', (c) => {
      c.header('Content-Type', 'image/svg+xml');
      c.header('Cache-Control', 'public, max-age=604800, s-maxage=604800');
      return c.body(favicon);
    });
  }
  app.get('/favicon.ico', (c) => c.redirect('/logo.png', 301));

  app.get('/robots.txt', (c) =>
    c.text(options.noindex ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /configure\nDisallow: /\n')
  );

  app.get('/health', (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({ status: 'ok', id: options.id, version: options.version, ...(options.healthExtra?.() ?? {}) });
  });

  // Métricas agregadas, protegidas por STATS_KEY (?key=…). 404 si no hay clave válida o base de datos.
  app.get('/stats.json', async (c) => {
    const expected = Buffer.from((process.env.STATS_KEY || '').trim());
    const given = Buffer.from((c.req.query('key') || '').trim());
    if (expected.length < 16 || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return c.json({ error: 'Not found' }, 404);
    }
    c.header('Cache-Control', 'no-store');
    const stats = await getUsageStats();
    return stats
      ? c.json({ addon: options.id, version: options.version, ...stats })
      : c.json({ error: 'Usage statistics are not configured' }, 404);
  });

  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  app.onError((err, c) => {
    console.error('[UNHANDLED ERROR]', err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}

/** ¿Se está ejecutando en Vercel? (activa Web Analytics en la página de configuración). */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1';
}
