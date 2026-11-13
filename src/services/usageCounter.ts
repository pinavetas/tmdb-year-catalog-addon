import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { waitUntil } from '@vercel/functions';
import { LRUCache } from 'lru-cache';

/**
 * Anonymous usage counter: "how many distinct users used the addon on a given day, and from which app".
 *
 * Privacy: only stores (UTC day, HMAC of the user's TMDB key with a server secret, client app token).
 * Never stores keys, IPs, configuration or search terms. Disabled unless DATABASE_URL and USAGE_SALT are set.
 *
 * Cost: rows are buffered in memory and written in one batch during the first minutes of each UTC hour,
 * so the database (Neon, scale-to-zero) only wakes up briefly once per hour instead of staying on.
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
  /** Minutes at the start of each UTC hour during which buffered rows are flushed */
  flushWindowMinutes?: number;
  /** Flush anyway if the oldest buffered row is older than this (instance missed the windows) */
  maxBufferAgeMs?: number;
  /** Hard cap of buffered rows (beyond it new rows are dropped until the next flush) */
  maxBufferedRows?: number;
  now?: () => Date;
  /** Schedules background work after the response (Vercel waitUntil) */
  schedule?: (promise: Promise<unknown>) => void;
}

/** First product token of the User-Agent, normalized ("Nuvio/1.1.0" → "nuvio"). Not identifying. */
export function clientFromUserAgent(userAgent: string | undefined): string {
  const token = (userAgent || '').trim().split(/[\s/]/)[0].toLowerCase();
  const clean = token.replace(/[^a-z0-9._-]/g, '').slice(0, 24);
  return clean || 'unknown';
}

export class UsageCounter {
  private readonly salt: string;
  private readonly writer: UsageWriter;
  private readonly flushWindowMinutes: number;
  private readonly maxBufferAgeMs: number;
  private readonly maxBufferedRows: number;
  private readonly now: () => Date;
  private readonly schedule: (promise: Promise<unknown>) => void;

  private pending = new Map<string, UsageRow>();
  private oldestPendingAt = 0;
  /** Rows already written by this instance (avoids rewriting the same user/day/client) */
  private written = new LRUCache<string, true>({ max: 50_000, ttl: 26 * 60 * 60 * 1000 });
  private lastFlushHour = -1;
  private flushing = false;

  constructor(options: UsageCounterOptions) {
    this.salt = options.salt;
    this.writer = options.writer;
    this.flushWindowMinutes = options.flushWindowMinutes ?? 5;
    this.maxBufferAgeMs = options.maxBufferAgeMs ?? 2 * 60 * 60 * 1000;
    this.maxBufferedRows = options.maxBufferedRows ?? 20_000;
    this.now = options.now ?? (() => new Date());
    this.schedule = options.schedule ?? ((promise) => void promise);
  }

  /** Stable anonymous id of a TMDB key (HMAC-SHA256 truncated to 64 bits). */
  hashUser(tmdbApiKey: string): string {
    return createHmac('sha256', this.salt).update(tmdbApiKey.trim()).digest('hex').slice(0, 16);
  }

  /** Records one use of the addon by the owner of `tmdbApiKey` and flushes if it is time to. */
  record(tmdbApiKey: string, userAgent: string | undefined): void {
    const now = this.now();
    const row: UsageRow = {
      day: now.toISOString().slice(0, 10),
      userHash: this.hashUser(tmdbApiKey),
      client: clientFromUserAgent(userAgent)
    };
    const key = `${row.day}|${row.userHash}|${row.client}`;

    if (!this.written.has(key) && !this.pending.has(key) && this.pending.size < this.maxBufferedRows) {
      if (this.pending.size === 0) this.oldestPendingAt = now.getTime();
      this.pending.set(key, row);
    }
    this.maybeFlush(now);
  }

  private maybeFlush(now: Date): void {
    if (this.pending.size === 0 || this.flushing) return;

    const hourId = Math.floor(now.getTime() / 3_600_000);
    const inWindow = now.getUTCMinutes() < this.flushWindowMinutes && this.lastFlushHour !== hourId;
    const tooOld = now.getTime() - this.oldestPendingAt > this.maxBufferAgeMs;
    if (!inWindow && !tooOld) return;

    this.lastFlushHour = hourId;
    this.schedule(this.flush());
  }

  /** Writes buffered rows. On failure they stay buffered for the next window. */
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
      this.oldestPendingAt = this.pending.size > 0 ? this.now().getTime() : 0;
    } catch (err) {
      console.warn('[USAGE] Flush failed, will retry next window:', err instanceof Error ? err.message : err);
    } finally {
      this.flushing = false;
    }
  }

  get bufferedRows(): number {
    return this.pending.size;
  }
}

/** Neon writer: one multi-row insert per flush, idempotent thanks to the primary key. */
function neonWriter(databaseUrl: string): UsageWriter {
  const sql = neon(databaseUrl);
  let tableReady = false;
  return async (rows) => {
    if (!tableReady) {
      await sql`CREATE TABLE IF NOT EXISTS usage_days (
        day date NOT NULL, user_hash text NOT NULL, client text NOT NULL,
        PRIMARY KEY (day, user_hash, client))`;
      tableReady = true;
    }
    await sql`
      INSERT INTO usage_days (day, user_hash, client)
      SELECT * FROM unnest(
        ${rows.map((r) => r.day)}::date[],
        ${rows.map((r) => r.userHash)}::text[],
        ${rows.map((r) => r.client)}::text[])
      ON CONFLICT DO NOTHING`;
  };
}

function scheduleInBackground(promise: Promise<unknown>): void {
  const safe = promise.catch(() => undefined);
  try {
    waitUntil(safe);
  } catch {
    // Outside Vercel the promise simply runs in the background
  }
}

const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
const USAGE_SALT = (process.env.USAGE_SALT || '').trim();

/** Process-wide counter, or null when usage statistics are not configured (self-hosting, tests). */
export const usageCounter: UsageCounter | null =
  DATABASE_URL && USAGE_SALT.length >= 16
    ? new UsageCounter({ salt: USAGE_SALT, writer: neonWriter(DATABASE_URL), schedule: scheduleInBackground })
    : null;

export interface UsageStats {
  generatedAt: string;
  activeUsers: { today: number; last7d: number; last30d: number; allTime: number };
  daily: Array<{ day: string; activeUsers: number; newUsers: number }>;
  clientsLast7d: Array<{ client: string; users: number }>;
}

/** Aggregated statistics (no per-user data). Returns null if the database is not configured. */
export async function getUsageStats(): Promise<UsageStats | null> {
  if (!DATABASE_URL) return null;
  const sql = neon(DATABASE_URL);

  const [totals] = (await sql`
    SELECT
      count(DISTINCT user_hash) FILTER (WHERE day = current_date)       AS today,
      count(DISTINCT user_hash) FILTER (WHERE day >= current_date - 6)  AS last7d,
      count(DISTINCT user_hash) FILTER (WHERE day >= current_date - 29) AS last30d,
      count(DISTINCT user_hash)                                          AS all_time
    FROM usage_days`) as Array<Record<string, string>>;

  const daily = (await sql`
    WITH first_seen AS (SELECT user_hash, min(day) AS first_day FROM usage_days GROUP BY user_hash)
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           count(DISTINCT d.user_hash) AS active_users,
           count(DISTINCT d.user_hash) FILTER (WHERE f.first_day = d.day) AS new_users
    FROM usage_days d JOIN first_seen f USING (user_hash)
    WHERE d.day >= current_date - 29
    GROUP BY d.day ORDER BY d.day`) as Array<Record<string, string>>;

  const clients = (await sql`
    SELECT client, count(DISTINCT user_hash) AS users
    FROM usage_days WHERE day >= current_date - 6
    GROUP BY client ORDER BY users DESC LIMIT 20`) as Array<Record<string, string>>;

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
