/* Anonymous event counts only: no names, answers, persistent visitor IDs or full URLs. */
(() => {
  const params = new URLSearchParams(location.search);
  const test = params.get('analytics') === 'test';
  const local = !['hissan-puzzle.pages.dev'].includes(location.hostname);
  const entry = ['multiplication-guide', 'division-guide'].includes(params.get('from')) ? params.get('from') : 'home';
  let started = false;
  let completed = false;
  const pending = new Map();

  function enabled() {
    try {
      return !local && params.get('analytics') !== 'off' && navigator.doNotTrack !== '1'
        && navigator.globalPrivacyControl !== true && localStorage.getItem('hp_usage_disabled') !== '1';
    } catch { return false; }
  }

  async function send(data, retry = true) {
    if (!enabled()) { pending.delete(data.id); return; }
    try {
      const response = await fetch('/api/learning-events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', mode: 'same-origin', referrerPolicy: 'no-referrer', keepalive: true,
        body: JSON.stringify(data),
      });
      if (response.ok || (response.status >= 400 && response.status < 500)) pending.delete(data.id);
      else if (retry) setTimeout(() => send(data, false), 3000);
    } catch { if (retry) setTimeout(() => send(data, false), 3000); }
  }

  function record(event, kind = 'mixed') {
    if (!enabled() || !crypto.randomUUID || pending.size >= 12) return;
    const data = { id: crypto.randomUUID(), event, kind, entry, test };
    pending.set(data.id, data);
    send(data);
  }

  function start(kind) {
    if (started || !enabled()) return;
    started = true;
    record('practice_start', kind);
    const day = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    try {
      const previous = localStorage.getItem('hp_usage_last_day');
      if (previous && previous < day) record('return_practice', kind);
      if (!test) localStorage.setItem('hp_usage_last_day', day);
    } catch { /* Practice must work even when browser storage is unavailable. */ }
  }

  window.learningUsage = Object.freeze({
    start,
    complete(kind) {
      start(kind);
      if (!completed && enabled()) { completed = true; record('first_problem_complete', kind); }
    },
    missionStart() { record('mission_start'); },
    missionComplete() { record('mission_complete'); },
  });
  addEventListener('online', () => pending.forEach(data => send(data, false)));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pending.forEach(data => send(data, false));
  });
})();
