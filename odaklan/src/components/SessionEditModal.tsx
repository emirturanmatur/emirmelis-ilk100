import { useEffect, useState } from 'react';
import type { StudySession, Stage } from '../lib/types';
import { SUBJECTS, subjectColor } from '../lib/constants';
import { deleteSession, updateSession } from '../lib/db/sessions';
import { X, Trash2, Save } from 'lucide-react';
import { formatHMS } from '../lib/time';
import { durationOf } from './Reports';

interface Props {
  session: StudySession;
  onClose: () => void;
  onSaved: () => void;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SessionEditModal({ session, onClose, onSaved }: Props) {
  const [start, setStart] = useState(toLocalInput(session.start_time));
  const [end, setEnd] = useState(session.end_time ? toLocalInput(session.end_time) : '');
  const [subject, setSubject] = useState(session.subject);
  const [stage, setStage] = useState<Stage>(session.stage ?? 'TYT');
  const [running, setRunning] = useState(!session.end_time);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    const startISO = new Date(start).toISOString();
    const patch: {
      start_time: string;
      end_time: string | null;
      subject: string;
      stage: Stage;
      duration_ms: number | null;
    } = {
      start_time: startISO,
      end_time: running ? null : end ? new Date(end).toISOString() : null,
      subject,
      stage,
      duration_ms: null,
    };
    if (!running && patch.end_time) {
      patch.duration_ms =
        new Date(patch.end_time).getTime() - new Date(startISO).getTime();
    }
    await updateSession(session.id, {
      start_time: patch.start_time,
      subject: patch.subject,
      stage: patch.stage,
      duration_ms: patch.duration_ms,
      end_time: patch.end_time ?? undefined,
    });
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteSession(session.id);
    setDeleting(false);
    onSaved();
  }

  const currentMs = running
    ? Date.now() - new Date(start).getTime()
    : end
      ? new Date(end).getTime() - new Date(start).getTime()
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-ink-900 border border-ink-700 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Oturumu Düzenle</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-ink-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Ders</label>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: subjectColor(subject) }}
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Aşama</label>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-ink-700 w-fit">
              {(['TYT', 'AYT'] as Stage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    stage === s
                      ? 'bg-teal-500 text-ink-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Başlangıç</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">Bitiş</label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={running}
                  onChange={(e) => setRunning(e.target.checked)}
                  className="accent-teal-400"
                />
                Hâlâ çalışıyor
              </label>
            </div>
            <input
              type="datetime-local"
              value={end}
              disabled={running}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 disabled:opacity-40"
            />
          </div>

          <div className="rounded-lg bg-ink-850 border border-ink-700 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Tahmini süre</span>
            <span className="text-sm font-mono text-white">{formatHMS(currentMs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sil
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-teal-500 text-ink-950 text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/20 transition-shadow disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
