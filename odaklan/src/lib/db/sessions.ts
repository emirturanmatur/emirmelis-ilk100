import { supabase, isSupabaseConfigured } from '../supabase';
import type { StudySession, UserName, ActiveChrono, Stage } from '../types';

function localSessions(): StudySession[] {
  try {
    return JSON.parse(localStorage.getItem('yks_local_sessions') ?? '[]');
  } catch {
    return [];
  }
}
function saveLocalSessions(s: StudySession[]) {
  localStorage.setItem('yks_local_sessions', JSON.stringify(s));
}

export async function fetchSessions(
  from: Date,
  to: Date,
): Promise<StudySession[]> {
  if (!isSupabaseConfigured) {
    return localSessions().filter((s) => {
      const st = new Date(s.start_time).getTime();
      return st >= from.getTime() && st <= to.getTime();
    });
  }
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .gte('start_time', from.toISOString())
    .lte('start_time', to.toISOString())
    .order('start_time', { ascending: true });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchSessions', error.message);
    return [];
  }
  return (data ?? []) as StudySession[];
}

export async function fetchActiveSession(
  userName: UserName,
): Promise<StudySession | null> {
  if (!isSupabaseConfigured) {
    return (
      localSessions().find(
        (s) => s.user_name === userName && !s.end_time,
      ) ?? null
    );
  }
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_name', userName)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchActiveSession', error.message);
    return null;
  }
  return (data as StudySession | null) ?? null;
}

export async function startSession(
  userName: UserName,
  subject: string,
  startTimeISO: string,
  stage: Stage,
): Promise<StudySession | null> {
  if (!isSupabaseConfigured) {
    const s: StudySession = {
      id: crypto.randomUUID(),
      user_name: userName,
      subject,
      start_time: startTimeISO,
      end_time: null,
      duration_ms: null,
      stage,
      created_at: new Date().toISOString(),
    };
    const all = localSessions();
    all.push(s);
    saveLocalSessions(all);
    return s;
  }
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_name: userName,
      subject,
      start_time: startTimeISO,
      stage,
    })
    .select()
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('startSession', error.message);
    return null;
  }
  return data as StudySession | null;
}

export async function stopSession(
  id: string,
  endTimeISO: string,
  durationMs: number,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const all = localSessions();
    const i = all.findIndex((s) => s.id === id);
    if (i >= 0) {
      all[i].end_time = endTimeISO;
      all[i].duration_ms = durationMs;
      saveLocalSessions(all);
    }
    return true;
  }
  const { error } = await supabase
    .from('study_sessions')
    .update({ end_time: endTimeISO, duration_ms: durationMs })
    .eq('id', id);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('stopSession', error.message);
    return false;
  }
  return true;
}

export async function updateSession(
  id: string,
  patch: { start_time?: string; end_time?: string; subject?: string; duration_ms?: number | null; stage?: Stage },
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const all = localSessions();
    const i = all.findIndex((s) => s.id === id);
    if (i >= 0) {
      all[i] = { ...all[i], ...patch };
      saveLocalSessions(all);
    }
    return true;
  }
  const { error } = await supabase.from('study_sessions').update(patch).eq('id', id);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('updateSession', error.message);
    return false;
  }
  return true;
}

export async function deleteSession(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    saveLocalSessions(localSessions().filter((s) => s.id !== id));
    return true;
  }
  const { error } = await supabase.from('study_sessions').delete().eq('id', id);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('deleteSession', error.message);
    return false;
  }
  return true;
}

export function toActiveChrono(s: StudySession): ActiveChrono {
  return {
    id: s.id,
    user_name: s.user_name,
    subject: s.subject,
    start_time: s.start_time,
    stage: s.stage ?? 'TYT',
  };
}
