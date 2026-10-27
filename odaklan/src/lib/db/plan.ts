import { supabase, isSupabaseConfigured } from '../supabase';
import type { StudyPlanTopic } from '../types';

function localTopics(): StudyPlanTopic[] {
  try {
    return JSON.parse(localStorage.getItem('yks_local_plan_topics') ?? '[]');
  } catch {
    return [];
  }
}
function saveLocalTopics(t: StudyPlanTopic[]) {
  localStorage.setItem('yks_local_plan_topics', JSON.stringify(t));
}

export async function fetchPlanTopics(
  stage?: 'TYT' | 'AYT',
): Promise<StudyPlanTopic[]> {
  if (!isSupabaseConfigured) {
    return localTopics().filter((t) => !stage || t.stage === stage);
  }
  let query = supabase
    .from('study_plan_topics')
    .select('*')
    .order('stage', { ascending: true })
    .order('subject', { ascending: true })
    .order('created_at', { ascending: true });
  if (stage) query = query.eq('stage', stage);
  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchPlanTopics', error.message);
    return [];
  }
  return (data ?? []) as StudyPlanTopic[];
}

export async function addPlanTopic(
  stage: 'TYT' | 'AYT',
  subject: string,
  topic: string,
  owner: StudyPlanTopic['owner'],
  note?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const all = localTopics();
    const exists = all.some(
      (t) =>
        t.stage === stage &&
        t.subject === subject &&
        t.topic === topic &&
        t.owner === owner,
    );
    if (exists) return false;
    all.push({
      id: crypto.randomUUID(),
      stage,
      subject,
      topic,
      owner,
      done: false,
      note: note ?? null,
      created_at: new Date().toISOString(),
    });
    saveLocalTopics(all);
    return true;
  }
  const { error } = await supabase.from('study_plan_topics').insert({
    stage,
    subject,
    topic,
    owner,
    note: note ?? null,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('addPlanTopic', error.message);
    return false;
  }
  return true;
}

export async function togglePlanTopicDone(
  id: string,
  done: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const all = localTopics();
    const i = all.findIndex((t) => t.id === id);
    if (i >= 0) {
      all[i].done = done;
      saveLocalTopics(all);
    }
    return true;
  }
  const { error } = await supabase
    .from('study_plan_topics')
    .update({ done })
    .eq('id', id);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('togglePlanTopicDone', error.message);
    return false;
  }
  return true;
}

export async function deletePlanTopic(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    saveLocalTopics(localTopics().filter((t) => t.id !== id));
    return true;
  }
  const { error } = await supabase
    .from('study_plan_topics')
    .delete()
    .eq('id', id);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('deletePlanTopic', error.message);
    return false;
  }
  return true;
}
