import test from 'node:test';
import assert from 'node:assert/strict';
import { UsageCounter, clientFromUserAgent, type UsageRow } from '../src/services/usageCounter.js';

const KEY = 'abcdef1234567890abcdef1234567890';

function setup(start: string) {
  let now = new Date(start);
  const writes: UsageRow[][] = [];
  const scheduled: Promise<unknown>[] = [];
  let fail = false;
  const counter = new UsageCounter({
    salt: 'test-salt-0123456789',
    writer: async (rows) => {
      if (fail) throw new Error('db down');
      writes.push(rows);
    },
    now: () => now,
    schedule: (p) => void scheduled.push(p)
  });
  return {
    counter,
    writes,
    setNow: (iso: string) => (now = new Date(iso)),
    setFail: (v: boolean) => (fail = v),
    settle: () => Promise.all(scheduled)
  };
}

test('clientFromUserAgent: keeps only the normalized first product token', () => {
  assert.equal(clientFromUserAgent('Nuvio/1.1.0'), 'nuvio');
  assert.equal(clientFromUserAgent('okhttp/5.3.2'), 'okhttp');
  assert.equal(clientFromUserAgent('Mozilla/5.0 (Windows NT 10.0)'), 'mozilla');
  assert.equal(clientFromUserAgent('Dart/3.11 (dart:io)'), 'dart');
  assert.equal(clientFromUserAgent(undefined), 'unknown');
});

test('UsageCounter: user hash is stable, salted and never contains the key', () => {
  const a = setup('2026-11-13T10:30:00Z').counter;
  const b = new UsageCounter({ salt: 'another-salt-98765', writer: async () => {} });
  assert.equal(a.hashUser(KEY), a.hashUser(KEY));
  assert.match(a.hashUser(KEY), /^[0-9a-f]{16}$/);
  assert.notEqual(a.hashUser(KEY), b.hashUser(KEY));
  assert.ok(!a.hashUser(KEY).includes(KEY.slice(0, 8)));
});

test('UsageCounter: buffers and deduplicates outside the hourly window, writes inside it', async () => {
  const t = setup('2026-11-13T10:30:00Z');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  t.counter.record('fedcba0987654321fedcba0987654321', 'okhttp/5.3.2');
  await t.settle();
  assert.equal(t.writes.length, 0);
  assert.equal(t.counter.bufferedRows, 2);

  t.setNow('2026-11-13T11:02:00Z');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  await t.settle();
  assert.equal(t.writes.length, 1);
  assert.equal(t.writes[0].length, 2);
  assert.deepEqual(t.writes[0].map((r) => r.day), ['2026-11-13', '2026-11-13']);
  assert.equal(t.counter.bufferedRows, 0);

  // Same user/day/client already written: not buffered again
  t.counter.record(KEY, 'Nuvio/1.1.0');
  assert.equal(t.counter.bufferedRows, 0);

  // Next day counts again
  t.setNow('2026-11-14T09:10:00Z');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  assert.equal(t.counter.bufferedRows, 1);
});

test('UsageCounter: flushes once per window and keeps rows when the write fails', async () => {
  const t = setup('2026-11-13T12:01:00Z');
  t.setFail(true);
  t.counter.record(KEY, 'Nuvio/1.1.0');
  await t.settle();
  assert.equal(t.writes.length, 0);
  assert.equal(t.counter.bufferedRows, 1);

  // Same window: no retry storm
  t.setFail(false);
  t.setNow('2026-11-13T12:03:00Z');
  t.counter.record('fedcba0987654321fedcba0987654321', 'okhttp/5.3.2');
  await t.settle();
  assert.equal(t.writes.length, 0);

  // Next window retries everything
  t.setNow('2026-11-13T13:00:30Z');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  await t.settle();
  assert.equal(t.writes.length, 1);
  assert.equal(t.writes[0].length, 2);
});

test('UsageCounter: flushes outside the window if the buffer is too old', async () => {
  const t = setup('2026-11-13T10:30:00Z');
  t.counter.record(KEY, 'Nuvio/1.1.0');
  t.setNow('2026-11-13T12:45:00Z');
  t.counter.record('fedcba0987654321fedcba0987654321', 'okhttp/5.3.2');
  await t.settle();
  assert.equal(t.writes.length, 1);
});
