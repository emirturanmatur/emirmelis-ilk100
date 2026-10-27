/*
# YKS Study Tracker — Initial Schema

This is a single-tenant, password-free app. Two fixed "users" (Emir and Melis)
are tracked by a `user_name` text label, NOT by Supabase Auth. The frontend stores
the chosen name in localStorage and tags every row with it. There is no sign-in
screen, so all policies target `anon, authenticated` and the data is intentionally
shared between the two study partners (both can see each other's sessions on the
shared timeline).

## 1. New Tables

### `study_sessions`
- `id` (uuid, pk)
- `user_name` (text, not null) — "Emir" or "Melis"
- `subject` (text, not null) — lesson/subject label (e.g. "Matematik")
- `start_time` (timestamptz, not null) — when the chronometer started
- `end_time` (timestamptz, nullable) — null while running, set when stopped
- `duration_ms` (bigint, nullable) — cached total elapsed ms (for fast queries)
- `created_at` (timestamptz, default now())

### `study_notes`
- `id` (uuid, pk)
- `user_name` (text, not null)
- `note_date` (date, not null) — the day the note summarizes
- `content` (text, not null) — the summary note text
- `created_at` (timestamptz, default now())
- Unique constraint on (user_name, note_date) so each person has one note per day.

### `chat_messages`
- `id` (uuid, pk)
- `user_name` (text, not null) — who sent the message
- `role` (text, not null) — "user" or "assistant"
- `content` (text, not null)
- `created_at` (timestamptz, default now())

## 2. Security

- RLS enabled on every table.
- GRANT SELECT, INSERT, UPDATE, DELETE to `anon, authenticated` (no-auth, shared data app).
- Four separate policies per table (select/insert/update/delete), all `USING (true) / WITH CHECK (true)` because the data is intentionally shared between Emir & Melis with no sign-in.

## 3. Notes

- No `user_id` / `auth.users` FK — this app is password-free and device-based.
- `duration_ms` is denormalized for fast weekly/monthly aggregation; the app also computes live duration from `start_time` for the running chronometer.
*/

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  subject text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_ms bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  note_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT study_notes_user_date_unique UNIQUE (user_name, note_date)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON study_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_notes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon, authenticated;

-- study_sessions policies
DROP POLICY IF EXISTS "ss_select" ON study_sessions;
CREATE POLICY "ss_select" ON study_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "ss_insert" ON study_sessions;
CREATE POLICY "ss_insert" ON study_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ss_update" ON study_sessions;
CREATE POLICY "ss_update" ON study_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ss_delete" ON study_sessions;
CREATE POLICY "ss_delete" ON study_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- study_notes policies
DROP POLICY IF EXISTS "sn_select" ON study_notes;
CREATE POLICY "sn_select" ON study_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sn_insert" ON study_notes;
CREATE POLICY "sn_insert" ON study_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "sn_update" ON study_notes;
CREATE POLICY "sn_update" ON study_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sn_delete" ON study_notes;
CREATE POLICY "sn_delete" ON study_notes FOR DELETE
  TO anon, authenticated USING (true);

-- chat_messages policies
DROP POLICY IF EXISTS "cm_select" ON chat_messages;
CREATE POLICY "cm_select" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cm_insert" ON chat_messages;
CREATE POLICY "cm_insert" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cm_delete" ON chat_messages;
CREATE POLICY "cm_delete" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start
  ON study_sessions (user_name, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_study_notes_user_date
  ON study_notes (user_name, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON chat_messages (user_name, created_at DESC);
