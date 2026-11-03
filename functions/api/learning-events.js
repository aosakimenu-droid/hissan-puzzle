const EVENTS = new Set(['practice_start', 'first_problem_complete', 'mission_start', 'mission_complete', 'return_practice']);
const KINDS = new Set(['multiply', 'divide', 'multiplyFill', 'mixed']);
const ENTRIES = new Set(['home', 'multiplication-guide', 'division-guide']);
const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...HEADERS, Allow: 'POST' } });
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin || !request.headers.get('Content-Type')?.startsWith('application/json')) {
    return new Response(null, { status: 403, headers: HEADERS });
  }
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400, headers: HEADERS });
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) { await reader.cancel(); return new Response(null, { status: 413, headers: HEADERS }); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const raw = new TextDecoder().decode(bytes);
  let data;
  try { data = JSON.parse(raw); } catch { return new Response(null, { status: 400, headers: HEADERS }); }
  if (!data || !EVENTS.has(data.event) || !KINDS.has(data.kind) || !ENTRIES.has(data.entry)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)
    || typeof data.test !== 'boolean' || Object.keys(data).some(key => !['id', 'event', 'kind', 'entry', 'test'].includes(key))) {
    return new Response(null, { status: 400, headers: HEADERS });
  }
  if (!env.LEARNING_DB) return new Response(null, { status: 503, headers: HEADERS });
  const day = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    await env.LEARNING_DB.batch([
      env.LEARNING_DB.prepare('INSERT OR IGNORE INTO learning_events (id, day, event, kind, entry, is_test) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(data.id, day, data.event, data.kind, data.entry, data.test ? 1 : 0),
      env.LEARNING_DB.prepare("DELETE FROM learning_events WHERE day < date('now', '+9 hours', '-90 days')"),
    ]);
    return new Response(null, { status: 204, headers: HEADERS });
  } catch {
    return new Response(null, { status: 503, headers: HEADERS });
  }
}
