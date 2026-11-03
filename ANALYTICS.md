# Learning measurement

Counts start at deployment in November 2026. No historical learning events can be reconstructed from page-view analytics.

`functions/api/learning-events.js` accepts only five event types with an enum problem kind and enum entry source. No answer, name, IP, full URL, persistent visitor ID or cookie is stored. Every individual event has an independent random UUID solely to make request retries idempotent. The server assigns a Tokyo calendar date, discards extra properties, purges events older than 90 days on the next event receipt, and offers no public read endpoint. Cloudflare platform request handling is separate from this application's stored event schema.

Production Pages binding: `LEARNING_DB` → `hissan-puzzle-learning` (D1). Initial schema: `migrations/0001_learning_events.sql`. Use the authenticated Cloudflare D1 Console to read counts. The database is not exposed to visitors. `_routes.json` restricts Functions invocations to the event endpoint; all educational pages remain static.

## Definitions

| Event | Meaning |
| --- | --- |
| practice_start | First nonempty answer checked during this page load. Merely loading a problem does not count. |
| first_problem_complete | First problem completed during the same page load, including one solved with hints. Showing an answer alone does not count; completing a fresh retry does. |
| mission_start | Each click starting a three-problem mission. Abandoning and restarting counts another mission start. |
| mission_complete | Three problems completed in one mission. |
| return_practice | First practice in a page load when the last practice date stored in this browser is an earlier Tokyo date. This is a coarse indication, not unique-user retention. |

A page reload or separate tab can count another practice start. A single page load only counts its first completion; it is not total solved problems. Course switches can occur before first completion, so compare start/completion overall, not as matched user-level cohorts by kind. Completion rates are directional page-load counts, not person-level conversion. Owner activity, blocked requests, disabled tracking and offline use limit coverage; no claim of universal tracking is made. Entry values are home, multiplication-guide, division-guide; no search keywords or arbitrary URL parameters are captured.

## Query

```sql
SELECT day, event, COUNT(*) AS event_count
FROM learning_events
WHERE is_test = 0
GROUP BY day, event
ORDER BY day DESC, event;
```

```sql
SELECT entry, event, COUNT(*) AS event_count
FROM learning_events
WHERE is_test = 0 AND day >= date('now', '+9 hours', '-28 days')
GROUP BY entry, event
ORDER BY entry, event;
```

The D1 Console can export reviewed results for a later analysis. Exclude `is_test = 1` from all production readouts. Tests are kept separate, not subtracted by guessing a known number.

## Test and opt-out

The client never sends events on localhost, preview hosts, Do Not Track, Global Privacy Control, or when `hp_usage_disabled=1` in localStorage. Visitors can control the last setting on the privacy page. `?analytics=off` disables learning-event sends for owner checks. On the production hostname, `?analytics=test` marks all events from that page load as tests. Do not use the disabled mode to assert end-to-end event delivery. Tests using a real endpoint must use test mode and verify the corresponding D1 rows.

Retries reuse the same event UUID and do not create duplicate rows. The pending queue is bounded and only in memory; an interrupted session can lose unsent events. It does not block the educational app if collection is unavailable.
