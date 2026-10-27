import type { UserName } from './types';

export const STORAGE_KEYS = {
  activeUser: 'yks_active_user',
  activeChrono: 'yks_active_chrono',
  mixerVolumes: 'yks_mixer_volumes',
} as const;

export interface SubjectDef {
  name: string;
  color: string; // hex
}

export const SUBJECTS: SubjectDef[] = [
  { name: 'Matematik', color: '#5eead4' },
  { name: 'Fizik', color: '#60a5fa' },
  { name: 'Kimya', color: '#a78bfa' },
  { name: 'Biyoloji', color: '#4ade80' },
  { name: 'Türk Dili ve Edebiyatı', color: '#fb923c' },
  { name: 'Tarih', color: '#fbbf24' },
  { name: 'Coğrafya', color: '#f472b6' },
  { name: 'Felsefe', color: '#22d3ee' },
  { name: 'Din Kültürü', color: '#c084fc' },
  { name: 'İngilizce', color: '#f87171' },
  { name: 'Deneme Çözümü', color: '#94a3b8' },
];

export const SUBJECT_MAP: Record<string, SubjectDef> = SUBJECTS.reduce(
  (acc, s) => {
    acc[s.name] = s;
    return acc;
  },
  {} as Record<string, SubjectDef>,
);

export function subjectColor(name: string): string {
  return SUBJECT_MAP[name]?.color ?? '#94a3b8';
}

export const USER_COLORS: Record<UserName, { ring: string; bar: string; text: string }> = {
  Emir: { ring: '#5eead4', bar: '#2dd4bf', text: 'text-teal-400' },
  Melis: { ring: '#fb7185', bar: '#f43f5e', text: 'text-rose-400' },
};

export const LESSON_SUGGESTIONS = SUBJECTS.map((s) => s.name);
