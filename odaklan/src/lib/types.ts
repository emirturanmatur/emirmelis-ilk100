export type UserName = 'Emir' | 'Melis';

export const USER_NAMES: UserName[] = ['Emir', 'Melis'];

export interface StudySession {
  id: string;
  user_name: UserName;
  subject: string;
  start_time: string; // ISO
  end_time: string | null;
  duration_ms: number | null;
  stage: Stage | null;
  created_at: string;
}

export type Stage = 'TYT' | 'AYT';

export interface StudyNote {
  id: string;
  user_name: UserName;
  note_date: string; // YYYY-MM-DD
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_name: UserName;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ActiveChrono {
  id: string;
  user_name: UserName;
  subject: string;
  start_time: string; // ISO
  stage: Stage;
}

export interface StudyPlanTopic {
  id: string;
  stage: 'TYT' | 'AYT';
  subject: string;
  topic: string;
  owner: UserName;
  done: boolean;
  note: string | null;
  created_at: string;
}
