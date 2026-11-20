/**
 * Guardia de salida (SSRF), común a la familia. Origen: PinaSports (`src/services/OutboundUrlGuard.js`).
 *
 * Un addon descarga URLs que no controla (enlaces de un resolver o un proveedor, redirecciones).
 * En un VPS o en Docker eso es una puerta a la red interna: el router, servicios en localhost o
 * los metadatos de la nube (169.254.169.254). La guardia decide, ANTES de conectar, si un destino
 * es público.
 *
 * Política (la primera regla que falla decide):
 *   1. La URL se interpreta y su protocolo es http: o https:.
 *   2. Si hay lista de permitidos, el nombre coincide exacto o como subdominio (`ok.ru` admite
 *      `cdn.ok.ru`). Sin lista no hay restricción por nombre (los CDN de vídeo rotan de host).
 *   3. Nombres reservados (localhost, *.local, *.internal, metadata…) se rechazan sin DNS.
 *   4. Cada dirección (literal o resuelta) se clasifica: loopback, privada (RFC 1918), enlace local
 *      (incluidos los metadatos de la nube), única local (fc00::/7), CGNAT (100.64/10) y el resto de
 *      rangos reservados se rechazan. Un nombre público que resuelve a una dirección privada
 *      también: comprobar solo el texto se saltaría con DNS.
 *
 * Tres niveles, de menor a mayor coste:
 * - `checkUrlStatic`: sin DNS (reglas 1-3 y literales IP). Para cada URL de terceros, en todo runtime.
 * - `checkOutboundUrl`: además resuelve el nombre y clasifica cada dirección.
 * - `guardLookup` + `guardConnect`: la guardia dentro del conector HTTP (p. ej. un Agent de undici).
 *   Cubre redirecciones y el «DNS rebinding» (el nombre cambia de dirección entre comprobar y
 *   conectar). Es la protección completa para el servidor Node/Docker.
 *
 * Sin dependencias: solo `node:net` y `node:dns`.
 */
import dns from 'node:dns';
import net from 'node:net';
import type { LookupFunction } from 'node:net';

export type EgressBlockReason =
  | 'invalid_url'
  | 'protocol_not_allowed'
  | 'host_not_allowlisted'
  | 'blocked_host'
  | 'blocked_address'
  | 'dns_resolution_failed'
  | 'invalid_dns_answer';

export type EgressVerdict =
  | { ok: true; url: string; hostname: string; addresses: string[] }
  | { ok: false; reason: EgressBlockReason; detail: string };

/** Error de conexión cuando la guardia rechaza un destino (code `EGRESS_BLOCKED`). */
export class EgressBlockedError extends Error {
  readonly code = 'EGRESS_BLOCKED';
  constructor(readonly reason: EgressBlockReason, readonly detail: string) {
    super(`Blocked outbound connection (${reason}): ${detail}`);
    this.name = 'EgressBlockedError';
  }
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// Nombres que resuelven en local (o a nada) y nunca deben marcarse aunque parezcan normales
const BLOCKED_HOST_EXACT = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'instance-data.ec2.internal'
]);
const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.localdomain', '.internal', '.home.arpa', '.onion', '.invalid', '.test', '.example'];

// [red, prefijo, etiqueta]
const BLOCKED_IPV4: Array<[string, number, string]> = [
  ['0.0.0.0', 8, 'this-network'],
  ['10.0.0.0', 8, 'private'],
  ['100.64.0.0', 10, 'cgnat'],
  ['127.0.0.0', 8, 'loopback'],
  ['169.254.0.0', 16, 'link-local'],
  ['172.16.0.0', 12, 'private'],
  ['192.0.0.0', 24, 'ietf-reserved'],
  ['192.0.2.0', 24, 'documentation'],
  ['192.88.99.0', 24, '6to4-relay'],
  ['192.168.0.0', 16, 'private'],
  ['198.18.0.0', 15, 'benchmarking'],
  ['198.51.100.0', 24, 'documentation'],
  ['203.0.113.0', 24, 'documentation'],
  ['224.0.0.0', 4, 'multicast'],
  ['240.0.0.0', 4, 'reserved']
];

const BLOCKED_IPV6: Array<[string, number, string]> = [
  ['::', 128, 'unspecified'],
  ['::1', 128, 'loopback'],
  ['fc00::', 7, 'unique-local'],
  ['fe80::', 10, 'link-local'],
  ['ff00::', 8, 'multicast'],
  ['100::', 64, 'discard-only'],
  ['2001:db8::', 32, 'documentation'],
  ['2001::', 32, 'teredo'],
  ['2002::', 16, '6to4']
];

// ─── IPv4 ────────────────────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    n = n * 256 + value;
  }
  return n >>> 0;
}

function ipv4InCidr(ipInt: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

// ─── IPv6 ────────────────────────────────────────────────────────────────────

function groupsToBytes(groups: string[]): Buffer | null {
  const bytes = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    if (!/^[0-9a-f]{1,4}$/.test(groups[i])) return null;
    const value = parseInt(groups[i], 16);
    bytes[i * 2] = (value >> 8) & 0xff;
    bytes[i * 2 + 1] = value & 0xff;
  }
  return bytes;
}

function ipv6ToBytes(ip: string): Buffer | null {
  let s = ip.toLowerCase();
  const zone = s.indexOf('%');
  if (zone >= 0) s = s.slice(0, zone);

  // Cola en notación IPv4 (::ffff:127.0.0.1) ➔ dos grupos hexadecimales
  if (s.includes('.')) {
    const lastColon = s.lastIndexOf(':');
    if (lastColon < 0) return null;
    const v4 = ipv4ToInt(s.slice(lastColon + 1));
    if (v4 === null) return null;
    s = s.slice(0, lastColon + 1) + ((v4 >>> 16) & 0xffff).toString(16) + ':' + (v4 & 0xffff).toString(16);
  }

  const gap = s.indexOf('::');
  if (gap >= 0) {
    const head = s.slice(0, gap);
    const tail = s.slice(gap + 2);
    const headGroups = head ? head.split(':') : [];
    const tailGroups = tail ? tail.split(':') : [];
    const fill = 8 - headGroups.length - tailGroups.length;
    if (fill < 0) return null;
    return groupsToBytes([...headGroups, ...Array<string>(fill).fill('0'), ...tailGroups]);
  }

  const groups = s.split(':');
  return groups.length === 8 ? groupsToBytes(groups) : null;
}

function ipv6InCidr(bytes: Buffer, base: string, bits: number): boolean {
  const baseBytes = ipv6ToBytes(base);
  if (!baseBytes) return false;
  const whole = bits >> 3;
  for (let i = 0; i < whole; i++) if (bytes[i] !== baseBytes[i]) return false;
  const remainder = bits & 7;
  if (remainder) {
    const mask = (0xff << (8 - remainder)) & 0xff;
    if ((bytes[whole] & mask) !== (baseBytes[whole] & mask)) return false;
  }
  return true;
}

/** IPv4 incrustada en una IPv6: mapeada (::ffff:a.b.c.d), NAT64 (64:ff9b::/96) y 6to4 (2002::/16). */
function embeddedIPv4(ip: string): string | null {
  const bytes = ipv6ToBytes(ip);
  if (!bytes) return null;
  const dotted = (offset: number) => [...bytes.subarray(offset, offset + 4)].join('.');
  if (bytes.subarray(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff) return dotted(12);
  if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b) return dotted(12);
  if (bytes[0] === 0x20 && bytes[1] === 0x02) return dotted(2);
  return null;
}

// ─── Clasificación ───────────────────────────────────────────────────────────

/** Etiqueta ('loopback', 'private'…) si la dirección no debe marcarse; null si es pública. */
export function classifyAddress(rawIp: string): string | null {
  if (!rawIp || typeof rawIp !== 'string') return null;
  let ip = rawIp.trim();
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
  const zone = ip.indexOf('%');
  if (zone >= 0) ip = ip.slice(0, zone);
  if (!ip) return null;

  if (net.isIPv4(ip)) {
    const ipInt = ipv4ToInt(ip);
    if (ipInt === null) return 'malformed';
    for (const [base, bits, label] of BLOCKED_IPV4) if (ipv4InCidr(ipInt, base, bits)) return label;
    return null;
  }

  if (net.isIPv6(ip)) {
    const inner = embeddedIPv4(ip);
    if (inner) {
      const label = classifyAddress(inner);
      return label ? `${label} (embedded ${inner})` : null;
    }
    const bytes = ipv6ToBytes(ip);
    if (!bytes) return 'malformed';
    for (const [base, bits, label] of BLOCKED_IPV6) if (ipv6InCidr(bytes, base, bits)) return label;
    return null;
  }

  return null;
}

export function isBlockedAddress(ip: string): boolean {
  return classifyAddress(ip) !== null;
}

export function isReservedHostname(hostname: string): boolean {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOST_EXACT.has(host)) return true;
  return BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** Lista de nombres permitidos separada por comas; null si no hay (= sin restricción por nombre). */
export function parseAllowedHosts(raw: string | undefined): string[] | null {
  if (typeof raw !== 'string') return null;
  const entries = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase().replace(/^\*\./, '').replace(/^\./, ''))
    .filter(Boolean);
  return entries.length ? entries : null;
}

export function matchesAllowedHost(hostname: string, patterns: string[] | null | undefined): boolean {
  if (!patterns || !patterns.length) return true;
  const host = String(hostname || '').toLowerCase();
  if (!host) return false;
  return patterns.some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
}

/** Nombre de host normalizado (minúsculas, sin punto final ni corchetes IPv6). */
export function normalizeHostname(hostname: string): string {
  let host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  return host;
}

export interface EgressCheckOptions {
  /** Lista de nombres permitidos (restricción adicional, nunca una excepción a las direcciones). */
  allowedHosts?: string[] | null;
  /**
   * Nombres (o IPs) que fija el operador, p. ej. el host de un resolver propio en la misma red:
   * pasan aunque sean privados. Nunca nombres que vengan de terceros.
   */
  trustedHosts?: Iterable<string>;
}

function isTrusted(hostname: string, trustedHosts: Iterable<string> | undefined): boolean {
  if (!trustedHosts) return false;
  for (const host of trustedHosts) if (normalizeHostname(host) === hostname) return true;
  return false;
}

/**
 * Comprobación sin DNS: protocolo, lista de permitidos, nombres reservados y literales IP.
 * `ok` no garantiza que un nombre resuelva a una dirección pública (eso lo hacen
 * `checkOutboundUrl` o el conector con guardia); `addresses` solo trae el literal, si lo es.
 */
export function checkUrlStatic(rawUrl: string, options: EgressCheckOptions = {}): EgressVerdict {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return { ok: false, reason: 'invalid_url', detail: 'missing url' };

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'invalid_url', detail: 'url did not parse' };
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: 'protocol_not_allowed', detail: parsed.protocol.replace(/:$/, '') };
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname) return { ok: false, reason: 'invalid_url', detail: 'missing hostname' };
  if (isTrusted(hostname, options.trustedHosts)) return { ok: true, url: parsed.toString(), hostname, addresses: [] };
  if (!matchesAllowedHost(hostname, options.allowedHosts)) return { ok: false, reason: 'host_not_allowlisted', detail: hostname };

  if (net.isIP(hostname)) {
    const label = classifyAddress(hostname);
    if (label) return { ok: false, reason: 'blocked_address', detail: `${hostname} (${label})` };
    return { ok: true, url: parsed.toString(), hostname, addresses: [hostname] };
  }
  if (isReservedHostname(hostname)) return { ok: false, reason: 'blocked_host', detail: hostname };

  return { ok: true, url: parsed.toString(), hostname, addresses: [] };
}

export type ResolveFn = (hostname: string) => Promise<string[]>;

const systemResolve: ResolveFn = async (hostname) =>
  (await dns.promises.lookup(hostname, { all: true, verbatim: true })).map((record) => record.address);

/**
 * Comprobación completa de una URL: la estática y, si es un nombre, resolverlo y clasificar CADA
 * dirección. Falla cerrado: un nombre que no resuelve tampoco se podría haber descargado.
 */
export async function checkOutboundUrl(rawUrl: string, options: EgressCheckOptions & { resolve?: ResolveFn } = {}): Promise<EgressVerdict> {
  const verdict = checkUrlStatic(rawUrl, options);
  if (!verdict.ok || verdict.addresses.length || isTrusted(verdict.hostname, options.trustedHosts)) return verdict;

  let addresses: string[];
  try {
    addresses = await (options.resolve ?? systemResolve)(verdict.hostname);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    return { ok: false, reason: 'dns_resolution_failed', detail: `${verdict.hostname}: ${code || 'lookup failed'}` };
  }
  if (!addresses?.length) return { ok: false, reason: 'dns_resolution_failed', detail: `${verdict.hostname}: no addresses` };

  for (const address of addresses) {
    if (!net.isIP(address)) return { ok: false, reason: 'invalid_dns_answer', detail: verdict.hostname };
    const label = classifyAddress(address);
    if (label) return { ok: false, reason: 'blocked_address', detail: `${address} (${label})` };
  }
  return { ...verdict, addresses };
}

// ─── Guardia en el conector (servidor Node/Docker) ───────────────────────────

export interface ConnectGuardOptions {
  /**
   * Nombres de confianza que pueden resolver a direcciones privadas: los que fija el operador
   * (p. ej. un resolver propio en la misma red). Nunca nombres que vengan de terceros.
   */
  trustedHosts?: Iterable<string>;
}

function trustedSet(options: ConnectGuardOptions): Set<string> {
  return new Set([...(options.trustedHosts ?? [])].map(normalizeHostname).filter(Boolean));
}

type LookupAddresses = string | dns.LookupAddress[];

/**
 * Envuelve una función `lookup` (la de `net.connect` o la de un Agent de undici) para que una
 * resolución a una dirección bloqueada falle con EgressBlockedError en vez de conectar.
 */
export function guardLookup(lookup: LookupFunction = dns.lookup as LookupFunction, options: ConnectGuardOptions = {}): LookupFunction {
  const trusted = trustedSet(options);
  return (hostname, lookupOptions, callback) => {
    const host = normalizeHostname(hostname);
    if (trusted.has(host)) {
      lookup(hostname, lookupOptions, callback);
      return;
    }
    if (isReservedHostname(host)) {
      callback(new EgressBlockedError('blocked_host', host) as NodeJS.ErrnoException, '', 0);
      return;
    }
    lookup(hostname, lookupOptions, ((err: NodeJS.ErrnoException | null, address: LookupAddresses, family?: number) => {
      if (err) {
        (callback as (e: NodeJS.ErrnoException | null, a: LookupAddresses, f?: number) => void)(err, address, family);
        return;
      }
      const list = Array.isArray(address) ? address.map((entry) => entry.address) : [address];
      for (const ip of list) {
        const label = classifyAddress(ip);
        if (label) {
          callback(new EgressBlockedError('blocked_address', `${host} -> ${ip} (${label})`) as NodeJS.ErrnoException, '', 0);
          return;
        }
      }
      (callback as (e: NodeJS.ErrnoException | null, a: LookupAddresses, f?: number) => void)(null, address, family);
    }) as Parameters<LookupFunction>[2]);
  };
}

/** Firma mínima de un conector de undici (`buildConnector`), sin depender de undici. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Connector = (options: any, callback: (err: Error | null, socket: any) => void) => unknown;

/**
 * Envuelve un conector para rechazar destinos que son un literal IP bloqueado: `net.connect` no
 * llama a `lookup` con literales, así que una redirección a http://169.254.169.254/ solo se ve aquí.
 * Úsese junto a `guardLookup` (que cubre los nombres).
 */
export function guardConnect<C extends Connector>(connector: C, options: ConnectGuardOptions = {}): C {
  const trusted = trustedSet(options);
  const guarded: Connector = (connectOptions: { hostname?: unknown }, callback) => {
    const host = normalizeHostname(String(connectOptions?.hostname ?? ''));
    if (net.isIP(host) && !trusted.has(host)) {
      const label = classifyAddress(host);
      if (label) {
        callback(new EgressBlockedError('blocked_address', `${host} (${label})`), null);
        return undefined;
      }
    }
    return connector(connectOptions, callback);
  };
  return guarded as C;
}
