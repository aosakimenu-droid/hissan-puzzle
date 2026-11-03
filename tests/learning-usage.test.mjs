import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import { onRequest } from '../functions/api/learning-events.js';

const schema = readFileSync(new URL('../migrations/0001_learning_events.sql', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../learning-usage.js', import.meta.url), 'utf8');
const origin = 'https://hissan-puzzle.pages.dev';
const event = (overrides = {}) => ({ id: randomUUID(), event: 'practice_start', kind: 'multiply', entry: 'home', test: false, ...overrides });
const request = (data, options = {}) => new Request(origin + '/api/learning-events', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data), ...options,
});

function database(t) {
  const db = new DatabaseSync(':memory:');
  db.exec(schema);
  t.after(() => db.close());
  return {
    db,
    binding: {
      prepare(sql) { return { sql, values: [], bind(...values) { this.values = values; return this; } }; },
      async batch(statements) {
        db.exec('BEGIN');
        try { const result = statements.map(s => db.prepare(s.sql).run(...s.values)); db.exec('COMMIT'); return result; }
        catch (error) { db.exec('ROLLBACK'); throw error; }
      },
    },
  };
}

test('event retries are idempotent and QA events remain separate', async t => {
  const { db, binding } = database(t);
  const data = event();
  for (const payload of [data, data, event({ test: true })]) {
    const result = await onRequest({ request: request(payload), env: { LEARNING_DB: binding } });
    assert.equal(result.status, 204);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM learning_events WHERE is_test=0').get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM learning_events WHERE is_test=1').get().n, 1);
  const row = db.prepare('SELECT * FROM learning_events WHERE id=?').get(data.id);
  assert.equal(row.day, new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10));
  assert.deepEqual(Object.keys(row).sort(), ['day', 'entry', 'event', 'id', 'is_test', 'kind']);
});

test('foreign origins, personal-data fields, invalid types and oversized bodies are rejected', async t => {
  const { db, binding } = database(t);
  const env = { LEARNING_DB: binding };
  assert.equal((await onRequest({ request: request(event(), { headers: { Origin: 'https://example.com', 'Content-Type': 'application/json' } }), env })).status, 403);
  for (const data of [event({ answer: '92' }), event({ email: 'example@example.com' }), event({ event: 'arbitrary' }), event({ test: 'false' }), null]) {
    assert.equal((await onRequest({ request: request(data), env })).status, 400);
  }
  assert.equal((await onRequest({ request: request('x'.repeat(2048)), env })).status, 413);
  assert.equal((await onRequest({ request: new Request(origin + '/api/learning-events'), env })).status, 405);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM learning_events').get().n, 0);
});

test('unavailable storage fails closed and expired event rows are purged', async t => {
  assert.equal((await onRequest({ request: request(event()), env: {} })).status, 503);
  const { db, binding } = database(t);
  db.prepare('INSERT INTO learning_events VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), '2000-01-01', 'practice_start', 'multiply', 'home', 0);
  assert.equal((await onRequest({ request: request(event()), env: { LEARNING_DB: binding } })).status, 204);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM learning_events WHERE day='2000-01-01'").get().n, 0);
});

function client(options = {}) {
  const sent = [];
  const store = new Map(Object.entries(options.store || {}));
  const sandbox = {
    URLSearchParams, Date, Map, Set, JSON, Object, crypto: { randomUUID },
    location: { hostname: options.hostname || 'hissan-puzzle.pages.dev', search: options.search || '' },
    navigator: { doNotTrack: options.dnt || '0', globalPrivacyControl: options.gpc || false },
    localStorage: { getItem: key => { if (options.storageFails) throw Error('disabled'); return store.get(key) ?? null; }, setItem: (k, v) => store.set(k, v) },
    fetch: async (url, init) => { sent.push({ url, ...JSON.parse(init.body) }); return { ok: true, status: 204 }; },
    setTimeout() {}, addEventListener() {}, document: { addEventListener() {} }, window: {},
  };
  vm.runInNewContext(clientSource, sandbox);
  return { usage: sandbox.window.learningUsage, sent, store };
}

test('a page load counts one start and one first completion; loading alone counts nothing', () => {
  const { usage, sent } = client();
  assert.equal(sent.length, 0);
  usage.start('multiply'); usage.start('multiply'); usage.complete('multiply'); usage.complete('multiply');
  assert.deepEqual(sent.map(e => e.event), ['practice_start', 'first_problem_complete']);
  usage.missionStart(); usage.missionComplete();
  assert.deepEqual(sent.slice(2).map(e => e.event), ['mission_start', 'mission_complete']);
  assert.equal(new Set(sent.map(e => e.id)).size, sent.length);
});

test('localhost, preview, opt-out and browser privacy signals produce no requests', () => {
  for (const options of [{ hostname: 'localhost' }, { hostname: 'preview.hissan-puzzle.pages.dev' }, { search: '?analytics=off' }, { store: { hp_usage_disabled: '1' } }, { dnt: '1' }, { gpc: true }, { storageFails: true }]) {
    const { usage, sent } = client(options);
    usage.start('multiply'); usage.complete('multiply'); usage.missionStart(); usage.missionComplete();
    assert.equal(sent.length, 0);
  }
});

test('guide entry and QA are bounded metadata; return signal uses only a local date', () => {
  const { usage, sent, store } = client({ search: '?analytics=test&from=division-guide&unrelated=secret', store: { hp_usage_last_day: '2000-01-01' } });
  usage.start('divide');
  assert.deepEqual(sent.map(e => e.event), ['practice_start', 'return_practice']);
  assert.ok(sent.every(e => e.entry === 'division-guide' && e.test === true));
  assert.equal(store.get('hp_usage_last_day'), '2000-01-01');
  assert.ok(sent.every(e => !('unrelated' in e)));
});
