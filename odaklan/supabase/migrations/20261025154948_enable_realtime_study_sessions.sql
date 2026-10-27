/*
# Enable realtime publication for study_sessions

Publishes the `study_sessions` table to Supabase Realtime so the browser can
subscribe to INSERT / UPDATE events and reflect the other user's study
activity instantly (live tracking), without polling.

## 1. Changes
- Add `study_sessions` to the `supabase_realtime` publication so changes to its
  rows are broadcast over the Realtime websocket channel.

## 2. Notes
- Only the existing `study_sessions` table is affected; no schema/column
  changes, no policy changes, no grants. RLS continues to gate which rows a
  subscriber can see; since this app is single-tenant (no auth), the existing
  anon/authenticated policies already allow both users to read all sessions.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
