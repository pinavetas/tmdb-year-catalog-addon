import { createHmac } from 'node:crypto';
import { LRUCache } from 'lru-cache';
import { keepAlive } from './runtime.js';

/**
 * Métricas anónimas de instalación y uso (las mismas que el addon de catálogos TMDB):
 * «cuántas instalaciones distintas usaron el addon cada día, y desde qué app».
 *
 * Privacidad: solo se guarda (día UTC, HMAC de un identificador de instalación con un secreto del
 * servidor, app cliente). Nunca claves, IPs, configuración ni títulos. Desactivado salvo que estén
 * DATABASE_URL y USAGE_SALT (autoalojado, tests y previews quedan fuera).
 *
 * Instalaciones: la primera vez que aparece un identificador cuenta como instalación nueva
 * (`newUsers` de /stats.json); no se cuentan las instalaciones que nunca llegan a usarse.
 *
 * Neon se consulta por su endpoint HTTP de SQL con `fetch` (el mismo protocolo que usa
 * @neondatabase/serverless), sin dependencias: el mismo código sirve en Hono, Express o un bundle.
 *
 * Coste: la base de datos (Neon, escala a cero) se despierta como mucho una vez por hora y
 * instancia. Las filas se acumulan en memoria y se escriben de golpe con la primera petición de
 * cada hora UTC que tenga algo pendiente: con tráfico continuo eso cae en hh:00 en todas las
 * instancias a la vez (un único despertar), y con tráfico esporádico se escribe en la propia sesión
 * del usuario en lugar de esperar a una ventana que esa instancia quizá no llegue a ver.
 */

export interface UsageRow {
  day: string;
  userHash: string;
  client: string;
}

export type UsageWriter = (rows: UsageRow[]) => Promise<void>;

export interface UsageCounterOptions {
  salt: string;
  writer: UsageWriter;
  /** Máximo de filas en memoria (las nuevas se descartan hasta la siguiente escritura). */
  maxBufferedRows?: number;
  now?: () => Date;
  /** Trabajo en segundo plano tras la respuesta (waitUntil de Vercel). */
  schedule?: (promise: Promise<unknown>) => void;
}

/**
 * Clientes que no cuentan: las herramientas propias (prueba de humo, rendimiento…) se identifican
 * con `User-Agent: pina-tools/<herramienta>` para no inflar las métricas con instalaciones falsas.
 */
export const IGNORED_CLIENTS: ReadonlySet<string> = new Set(['pina-tools', 'nuvio-prewarm-cron']);

/** Primer token del User-Agent, normalizado («Nuvio/1.1.0» ➔ «nuvio»). No identifica a nadie. */
export function clientFromUserAgent(userAgent: string | undefined): string {
  const token = (userAgent || '').trim().split(/[\s/]/)[0].toLowerCase();
  const clean = token.replace(/[^a-z0-9._-]/g, '').slice(0, 24);
  return clean || 'unknown';
}

export class UsageCounter {
  private readonly salt: string;
  private readonly writer: UsageWriter;
  private readonly maxBufferedRows: number;
  private readonly now: () => Date;
  private readonly schedule: (promise: Promise<unknown>) => void;

  private pending = new Map<string, UsageRow>();
  /** Filas ya escritas por esta instancia (no se reescribe el mismo usuario/día/app). */
  private written = new LRUCache<string, true>({ max: 50_000, ttl: 26 * 60 * 60 * 1000 });
  private lastFlushHour = -1;
  private flushing = false;

  constructor(options: UsageCounterOptions) {
    this.salt = options.salt;
    this.writer = options.writer;
    this.maxBufferedRows = options.maxBufferedRows ?? 20_000;
    this.now = options.now ?? (() => new Date());
    this.schedule = options.schedule ?? ((promise) => void promise);
  }

  /** Identificador anónimo y estable (HMAC-SHA256 truncado a 64 bits). */
  hashUser(identity: string): string {
    return createHmac('sha256', this.salt).update(identity.trim()).digest('hex').slice(0, 16);
  }

  /** Registra un uso de la instalación `identity` y escribe si es la primera ocasión de esta hora. */
  record(identity: string, userAgent: string | undefined): void {
    if (!identity) return;
    const client = clientFromUserAgent(userAgent);
    if (IGNORED_CLIENTS.has(client)) return;
    const now = this.now();
    const row: UsageRow = {
      day: now.toISOString().slice(0, 10),
      userHash: this.hashUser(identity),
      client
    };
    const key = `${row.day}|${row.userHash}|${row.client}`;
    if (!this.written.has(key) && !this.pending.has(key) && this.pending.size < this.maxBufferedRows) {
      this.pending.set(key, row);
    }
    this.maybeFlush(now);
  }

  private maybeFlush(now: Date): void {
    if (this.pending.size === 0 || this.flushing) return;
    const hourId = Math.floor(now.getTime() / 3_600_000);
    if (hourId === this.lastFlushHour) return;
    this.lastFlushHour = hourId;
    this.schedule(this.flush());
  }

  /** Escribe las filas pendientes. Si falla, se quedan para la hora siguiente (sin reintentos en bucle). */
  async flush(): Promise<void> {
    if (this.pending.size === 0 || this.flushing) return;
    this.flushing = true;
    const batch = new Map(this.pending);
    try {
      await this.writer([...batch.values()]);
      for (const key of batch.keys()) {
        this.pending.delete(key);
        this.written.set(key, true);
      }
    } catch (err) {
      console.warn('[USAGE] No se pudo escribir; se reintenta la próxima hora:', err instanceof Error ? err.message : err);
    } finally {
      this.flushing = false;
    }
  }

  get bufferedRows(): number {
    return this.pending.size;
  }
}

/**
 * Ejecuta una sentencia SQL en Neon por HTTP y devuelve las filas como objetos (valores en texto).
 * El endpoint es `api.<host sin su primera etiqueta>/sql`, la misma regla que el driver oficial.
 */
export async function neonQuery(databaseUrl: string, query: string, params: unknown[] = []): Promise<Array<Record<string, string>>> {
  const url = new URL(databaseUrl);
  const endpoint = `https://${url.hostname.replace(/^[^.]+\./, 'api.')}/sql`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': databaseUrl,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true'
    },
    body: JSON.stringify({ query, params }),
    signal: AbortSignal.timeout(10_000)
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string; fields?: Array<{ name: string }>; rows?: string[][] };
  if (!res.ok) throw new Error(`Neon HTTP ${res.status}: ${body.message || 'query failed'}`);
  const names = (body.fields || []).map((field) => field.name);
  return (body.rows || []).map((row) => Object.fromEntries(names.map((name, i) => [name, row[i]])));
}

/** Escritor para Neon: un único INSERT por escritura, idempotente gracias a la clave primaria. */
export function neonWriter(databaseUrl: string): UsageWriter {
  let tableReady = false;
  return async (rows) => {
    if (!tableReady) {
      await neonQuery(databaseUrl, `CREATE TABLE IF NOT EXISTS usage_days (
        day date NOT NULL, user_hash text NOT NULL, client text NOT NULL,
        PRIMARY KEY (day, user_hash, client))`);
      tableReady = true;
    }
    await neonQuery(
      databaseUrl,
      `INSERT INTO usage_days (day, user_hash, client)
       SELECT * FROM unnest($1::date[], $2::text[], $3::text[])
       ON CONFLICT DO NOTHING`,
      [rows.map((r) => r.day), rows.map((r) => r.userHash), rows.map((r) => r.client)]
    );
  };
}

interface UsageEnv {
  databaseUrl: string;
  salt: string;
}

function readEnv(): UsageEnv {
  return {
    databaseUrl: (process.env.DATABASE_URL || '').trim(),
    salt: (process.env.USAGE_SALT || '').trim()
  };
}

let singleton: { env: string; counter: UsageCounter | null } | undefined;
let override: UsageCounter | null | undefined;

/** Solo para tests: fija el contador que devuelve getUsageCounter (undefined restaura el normal). */
export function overrideUsageCounter(counter: UsageCounter | null | undefined): void {
  override = counter;
}

/**
 * Contador del proceso, o null si las métricas no están configuradas.
 * Se crea al primer uso (y se recrea si cambian las variables, útil en tests).
 */
export function getUsageCounter(): UsageCounter | null {
  if (override !== undefined) return override;
  const env = readEnv();
  const signature = `${env.databaseUrl}|${env.salt}`;
  if (!singleton || singleton.env !== signature) {
    singleton = {
      env: signature,
      counter:
        env.databaseUrl && env.salt.length >= 16
          ? new UsageCounter({ salt: env.salt, writer: neonWriter(env.databaseUrl), schedule: keepAlive })
          : null
    };
  }
  return singleton.counter;
}

/**
 * Identidad de una instalación para las métricas: el identificador anónimo que /configure añade a
 * la configuración (`installId`) o, en instalaciones anteriores a él, el propio segmento de
 * configuración (estable mientras no se reconfigure). Sin configuración no se cuenta.
 */
export function installIdentity(installId: string | undefined, configSegment: string | undefined): string | undefined {
  if (installId) return `iid:${installId}`;
  if (configSegment) return `cfg:${configSegment}`;
  return undefined;
}

export interface UsageStats {
  generatedAt: string;
  activeUsers: { today: number; last7d: number; last30d: number; allTime: number };
  daily: Array<{ day: string; activeUsers: number; newUsers: number }>;
  clientsLast7d: Array<{ client: string; users: number }>;
}

/** Estadísticas agregadas (sin datos por usuario), o null si no hay base de datos configurada. */
export async function getUsageStats(): Promise<UsageStats | null> {
  const { databaseUrl } = readEnv();
  if (!databaseUrl) return null;
  const [totals] = await neonQuery(databaseUrl, `
    SELECT
      count(DISTINCT user_hash) FILTER (WHERE day = current_date)       AS today,
      count(DISTINCT user_hash) FILTER (WHERE day >= current_date - 6)  AS last7d,
      count(DISTINCT user_hash) FILTER (WHERE day >= current_date - 29) AS last30d,
      count(DISTINCT user_hash)                                          AS all_time
    FROM usage_days`);

  const daily = await neonQuery(databaseUrl, `
    WITH first_seen AS (SELECT user_hash, min(day) AS first_day FROM usage_days GROUP BY user_hash)
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           count(DISTINCT d.user_hash) AS active_users,
           count(DISTINCT d.user_hash) FILTER (WHERE f.first_day = d.day) AS new_users
    FROM usage_days d JOIN first_seen f USING (user_hash)
    WHERE d.day >= current_date - 29
    GROUP BY d.day ORDER BY d.day`);

  const clients = await neonQuery(databaseUrl, `
    SELECT client, count(DISTINCT user_hash) AS users
    FROM usage_days WHERE day >= current_date - 6
    GROUP BY client ORDER BY users DESC LIMIT 20`);

  return {
    generatedAt: new Date().toISOString(),
    activeUsers: {
      today: Number(totals?.today ?? 0),
      last7d: Number(totals?.last7d ?? 0),
      last30d: Number(totals?.last30d ?? 0),
      allTime: Number(totals?.all_time ?? 0)
    },
    daily: daily.map((r) => ({ day: r.day, activeUsers: Number(r.active_users), newUsers: Number(r.new_users) })),
    clientsLast7d: clients.map((r) => ({ client: r.client, users: Number(r.users) }))
  };
}
