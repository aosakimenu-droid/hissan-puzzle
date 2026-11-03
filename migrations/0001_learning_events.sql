CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('practice_start','first_problem_complete','mission_start','mission_complete','return_practice')),
  kind TEXT NOT NULL CHECK (kind IN ('multiply','divide','multiplyFill','mixed')),
  entry TEXT NOT NULL CHECK (entry IN ('home','multiplication-guide','division-guide')),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0,1))
);
CREATE INDEX IF NOT EXISTS learning_events_day ON learning_events(day);
