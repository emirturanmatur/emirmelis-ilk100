import { supabase, isSupabaseConfigured } from '../supabase';
import type { ChatMessage, UserName } from '../types';

function localMessages(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem('yks_local_chat') ?? '[]');
  } catch {
    return [];
  }
}
function saveLocalMessages(m: ChatMessage[]) {
  localStorage.setItem('yks_local_chat', JSON.stringify(m));
}

export async function fetchMessages(
  userName: UserName,
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) {
    return localMessages().filter((m) => m.user_name === userName);
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_name', userName)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchMessages', error.message);
    return [];
  }
  return (data ?? []) as ChatMessage[];
}

export async function insertMessage(
  userName: UserName,
  role: 'user' | 'assistant',
  content: string,
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) {
    const m: ChatMessage = {
      id: crypto.randomUUID(),
      user_name: userName,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    const all = localMessages();
    all.push(m);
    saveLocalMessages(all);
    return m;
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_name: userName, role, content })
    .select()
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('insertMessage', error.message);
    return null;
  }
  return data as ChatMessage | null;
}
