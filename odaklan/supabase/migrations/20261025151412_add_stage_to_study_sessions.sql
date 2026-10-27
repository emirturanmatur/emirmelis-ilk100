/*
# Add stage column to study_sessions

Adds a `stage` column to `study_sessions` so each study session is tagged as
belonging to either the TYT or AYT exam stage. This lets the chronometer and
reports distinguish TYT vs AYT study time per subject.

## 1. Modified Tables

### `study_sessions`
- `stage` (text, nullable) — "TYT" or "AYT". Nullable so existing rows (and
  offline/local sessions created before this migration) keep working; the
  frontend defaults new sessions to "TYT" when none is chosen. A CHECK
  constraint restricts values to the two allowed strings when present.

## 2. Security

- No policy changes. The table already grants CRUD to anon, authenticated with
  USING(true) / WITH CHECK(true) (shared, no-auth app). The new column is
  automatically covered by the existing table-level grants.

## 3. Notes

- Existing rows get `stage = NULL`; the app treats NULL as "TYT" for display.
- An index on (stage, subject) supports future TYT/AYT per-subject reports.
*/

ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS stage text CHECK (stage IS NULL OR stage IN ('TYT', 'AYT'));

CREATE INDEX IF NOT EXISTS idx_study_sessions_stage_subject
  ON study_sessions (stage, subject);
