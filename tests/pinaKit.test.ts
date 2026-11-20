import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { app } from '../src/app.js';
import { UsageCounter } from '../src/kit/usage.js';
import { encodeConfig } from '../src/types/config.js';

const KEY = 'abcdef1234567890abcdef1234567890';

test('kit metrics keep the pre-kit identity: HMAC(USAGE_SALT, TMDB key)', () => {
  const salt = 'test-salt-0123456789';
  const counter = new UsageCounter({ salt, writer: async () => {} });
  const legacy = createHmac('sha256', salt).update(KEY.trim()).digest('hex').slice(0, 16);
  assert.equal(counter.hashUser(KEY), legacy);
});

test('/health keeps tmdbKeyConfigured and adds id and version (kit)', async () => {
  const body = (await (await app.request('/health')).json()) as Record<string, unknown>;
  assert.equal(body.status, 'ok');
  assert.equal(body.id, 'community.tmdb-year-catalog');
  assert.equal(typeof body.version, 'string');
  assert.equal(typeof body.tmdbKeyConfigured, 'boolean');
});

test('the root still goes to /configure, the own logo and robots are served by the kit', async () => {
  const root = await app.request('/');
  assert.equal(root.status, 302);
  assert.equal(root.headers.get('location'), '/configure');
  assert.equal((await app.request('/favicon.ico')).headers.get('location'), '/logo.png');
  assert.match(await (await app.request('/robots.txt')).text(), /Allow: \/configure/);
});

test('/configure: <html lang> follows the install language, then the browser (family rule)', async () => {
  const fromBrowser = await (await app.request('/configure', { headers: { 'accept-language': 'en-GB,es;q=0.5' } })).text();
  assert.ok(fromBrowser.includes('<html lang="es">'), 'Spanish anywhere in the browser list');
  const english = await (await app.request('/configure', { headers: { 'accept-language': 'fr-FR' } })).text();
  assert.ok(english.includes('<html lang="en">'));
  const install = encodeConfig({ tmdbApiKey: KEY, language: 'en' });
  const fromConfig = await (await app.request(`/${install}/configure`, { headers: { 'accept-language': 'es-ES' } })).text();
  assert.ok(fromConfig.includes('<html lang="en">'), "the install's language wins");
  assert.ok(fromConfig.includes("var LANG_KEY = 'pina_lang'"), 'manual choice saved like the rest of the family');
  assert.ok(fromConfig.includes('navigator.languages'));
});
