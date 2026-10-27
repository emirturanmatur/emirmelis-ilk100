import { supabase, isSupabaseConfigured } from '../supabase';
import type { StudyNote, UserName } from '../types';

function localNotes(): StudyNote[] {
  try {
    return JSON.parse(localStorage.getItem('yks_local_notes') ?? '[]');
  } catch {
    return [];
  }
}
function saveLocalNotes(n: StudyNote[]) {
  localStorage.setItem('yks_local_notes', JSON.stringify(n));
}

export async function fetchNote(
  userName: UserName,
  dateISO: string,
): Promise<StudyNote | null> {
  if (!isSupabaseConfigured) {
    return (
      localNotes().find(
        (n) => n.user_name === userName && n.note_date === dateISO,
      ) ?? null
    );
  }
  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_name', userName)
    .eq('note_date', dateISO)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchNote', error.message);
    return null;
  }
  return (data as StudyNote | null) ?? null;
}

export async function fetchNotesForDate(
  dateISO: string,
): Promise<StudyNote[]> {
  if (!isSupabaseConfigured) {
    return localNotes().filter((n) => n.note_date === dateISO);
  }
  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('note_date', dateISO);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchNotesForDate', error.message);
    return [];
  }
  return (data ?? []) as StudyNote[];
}

export async function upsertNote(
  userName: UserName,
  dateISO: string,
  content: string,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const all = localNotes();
    const i = all.findIndex(
      (n) => n.user_name === userName && n.note_date === dateISO,
    );
    if (i >= 0) {
      all[i].content = content;
    } else {
      all.push({
        id: crypto.randomUUID(),
        user_name: userName,
        note_date: dateISO,
        content,
        created_at: new Date().toISOString(),
      });
    }
    saveLocalNotes(all);
    return true;
  }
  const existing = await fetchNote(userName, dateISO);
  if (existing) {
    const { error } = await supabase
      .from('study_notes')
      .update({ content })
      .eq('id', existing.id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('upsertNote update', error.message);
      return false;
    }
    return true;
  }
  const { error } = await supabase.from('study_notes').insert({
    user_name: userName,
    note_date: dateISO,
    content,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('upsertNote insert', error.message);
    return false;
  }
  return true;
}
