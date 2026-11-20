/**
 * Política de proceso y trabajo en segundo plano, común a la familia.
 * Origen: `live-sport-plugin/src/services/processGuards.js` (PinaSports) y el `waitUntil` de Vercel.
 *
 * - uncaughtException es FATAL: tras una, el estado del proceso no es fiable. Se registra, se fija
 *   el código de salida y se sale en el siguiente tick para que Docker/PM2/systemd lo reinicien.
 * - unhandledRejection NO es fatal: las desconexiones de clientes abortan peticiones en curso y
 *   esos rechazos son esperables (los AbortError ni se registran).
 * - Un error al escuchar (EADDRINUSE, EACCES…) es FATAL: sin él, el servidor no atiende nada y el
 *   supervisor lo ve «sano».
 *
 * Solo para el servidor Node/Docker; en Vercel la plataforma gestiona el proceso.
 */

type Log = (...args: unknown[]) => void;

function describe(err: unknown): unknown {
  return err instanceof Error && err.stack ? err.stack : err;
}

export function createUncaughtExceptionHandler(opts: { log?: Log; exit?: (code: number) => void; defer?: (fn: () => void) => void } = {}) {
  const { log = console.error, exit = (code) => process.exit(code), defer = setImmediate } = opts;
  let exiting = false;
  return (err: unknown) => {
    log('[uncaughtException] fatal, exiting so the supervisor restarts the process:', describe(err));
    if (exiting) return;
    exiting = true;
    process.exitCode = 1;
    defer(() => exit(1));
  };
}

export function createUnhandledRejectionHandler(opts: { log?: Log } = {}) {
  const { log = console.error } = opts;
  return (reason: unknown) => {
    if (reason && typeof reason === 'object' && ((reason as Error).name === 'AbortError' || (reason as Error).name === 'TimeoutError')) return;
    log('[unhandledRejection]', describe(reason));
  };
}

/** Instala la política de proceso (llamar una vez al arrancar el servidor Node). */
export function installProcessGuards(opts: { log?: Log; exit?: (code: number) => void } = {}): void {
  process.on('unhandledRejection', createUnhandledRejectionHandler(opts));
  process.on('uncaughtException', createUncaughtExceptionHandler(opts));
}

/** Manejador de errores del servidor HTTP: cualquier fallo al escuchar termina el proceso. */
export function serverErrorHandler(port: number | string, opts: { log?: Log; exit?: (code: number) => void } = {}) {
  const { log = console.error, exit = (code) => process.exit(code) } = opts;
  return (err: NodeJS.ErrnoException) => {
    if (err?.code === 'EADDRINUSE') {
      log(`[FATAL] Port ${port} is already in use (another instance running?). Close it or set PORT=<other>.`);
    } else {
      log(`[FATAL] HTTP server error on ${port}:`, describe(err));
    }
    process.exitCode = 1;
    exit(1);
  };
}

/**
 * Mantiene viva la función de Vercel hasta que termine `promise`, ya enviada la respuesta
 * (equivale a `waitUntil` de @vercel/functions, sin su paquete). Fuera de Vercel no hace nada:
 * la promesa sigue en segundo plano. Nunca lanza.
 */
const VERCEL_REQUEST_CONTEXT = Symbol.for('@vercel/request-context');

export function keepAlive(promise: Promise<unknown>): void {
  const safe = promise.catch(() => undefined);
  try {
    const holder = (globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } } | undefined>)[VERCEL_REQUEST_CONTEXT];
    holder?.get?.()?.waitUntil?.(safe);
  } catch {
    // sin contexto de Vercel
  }
}

/** Log de peticiones solo si LOG_REQUESTS=1 (privacidad por defecto: las rutas llevan configuración). */
export function requestLoggingEnabled(): boolean {
  return /^(1|true|yes)$/i.test(String(process.env.LOG_REQUESTS || ''));
}
