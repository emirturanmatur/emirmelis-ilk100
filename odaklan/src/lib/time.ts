export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatHMS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function formatHM(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}dk`;
  return `${h}sa ${m}dk`;
}

export function formatHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10;
}

export function formatColon(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${pad2(m)}`;
}

export function todayLocalISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
}

export function isoDayLabel(d: Date): string {
  return d.toLocaleDateString('tr-TR', { weekday: 'short' });
}

export const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
