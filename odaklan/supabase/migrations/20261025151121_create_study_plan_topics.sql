/*
# Study Plan Topics — TYT/AYT subject topics

Adds a shared "study_plan_topics" table so Emir and Melis can maintain a shared
checklist of which subject's topics they plan to study, grouped by exam stage
(TYT or AYT).

## 1. New Table

### `study_plan_topics`
- `id` (uuid, pk)
- `stage` (text, not null) — "TYT" or "AYT"
- `subject` (text, not null) — lesson name (e.g. "Matematik")
- `topic` (text, not null) — specific topic/concept (e.g. "Türev")
- `owner` (text, not null) — "Emir" or "Melis"; who plans to study this
- `done` (boolean, default false) — whether the topic is completed
- `note` (text, nullable) — optional short note
- `created_at` (timestamptz, default now())

## 2. Security

- RLS enabled.
- GRANT SELECT, INSERT, UPDATE, DELETE to `anon, authenticated` (no-auth, shared app).
- Four separate policies (select/insert/update/delete), all USING (true) /
  WITH CHECK (true) because the data is intentionally shared between Emir & Melis.

## 3. Notes

- No `user_id` / auth — this app is password-free and shared.
- Unique constraint on (stage, subject, topic, owner) so the same topic isn't duplicated for the same person.
*/

CREATE TABLE IF NOT EXISTS study_plan_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL CHECK (stage IN ('TYT', 'AYT')),
  subject text NOT NULL,
  topic text NOT NULL,
  owner text NOT NULL CHECK (owner IN ('Emir', 'Melis')),
  done boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT study_plan_topics_unique UNIQUE (stage, subject, topic, owner)
);

ALTER TABLE study_plan_topics ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON study_plan_topics TO anon, authenticated;

DROP POLICY IF EXISTS "spt_select" ON study_plan_topics;
CREATE POLICY "spt_select" ON study_plan_topics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spt_insert" ON study_plan_topics;
CREATE POLICY "spt_insert" ON study_plan_topics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "spt_update" ON study_plan_topics;
CREATE POLICY "spt_update" ON study_plan_topics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "spt_delete" ON study_plan_topics;
CREATE POLICY "spt_delete" ON study_plan_topics FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_study_plan_topics_stage_subject
  ON study_plan_topics (stage, subject);
CREATE INDEX IF NOT EXISTS idx_study_plan_topics_owner
  ON study_plan_topics (owner);
