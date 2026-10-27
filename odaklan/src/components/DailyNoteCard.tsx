import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { fetchNote, fetchNotesForDate, upsertNote } from '../lib/db/notes';
import { todayLocalISODate } from '../lib/time';
import { USER_COLORS } from '../lib/constants';
import type { UserName, StudyNote } from '../lib/types';
import { NotebookPen, Loader2, Check } from 'lucide-react';

export default function DailyNoteCard() {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [otherNotes, setOtherNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const dateISO = todayLocalISODate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      const [own, all] = await Promise.all([
        fetchNote(user, dateISO),
        fetchNotesForDate(dateISO),
      ]);
      if (cancelled) return;
      const c = own?.content ?? '';
      setContent(c);
      setSavedContent(c);
      setOtherNotes(
        all.filter((n) => n.user_name !== user && n.content.trim().length > 0),
      );
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, dateISO]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const ok = await upsertNote(user, dateISO, content);
    setSaving(false);
    if (ok) {
      setSavedContent(content);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
      // Refresh the partner's note too, in case they saved in the meantime
      const all = await fetchNotesForDate(dateISO);
      setOtherNotes(
        all.filter((n) => n.user_name !== user && n.content.trim().length > 0),
      );
    }
  }

  if (!user) return null;
  const c = USER_COLORS[user];
  const dirty = content !== savedContent;
  const other = otherNotes[0];

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-5 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Günün Özeti
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-ink-950"
          style={{ backgroundColor: c.bar }}
        >
          {user[0]}
        </span>
        <span className="text-xs text-slate-400">{user} için bugünkü not</span>
      </div>

      {loading ? (
        <div className="h-28 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
        </div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bugün ne çalıştın? Neleri öğrendin? Yarın için hedefin ne?"
            rows={4}
            className="w-full resize-none bg-ink-850 border border-ink-700 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-teal-500/40 transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-slate-500">
              {content.trim().length} karakter
            </span>
            <div className="flex items-center gap-2">
              {justSaved && (
                <span className="text-[11px] text-teal-400 animate-fade-in-up flex items-center gap-1">
                  <Check className="w-3 h-3" /> Kaydedildi
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="text-xs px-3.5 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors disabled:opacity-40"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {other && <PartnerNote note={other} />}
        </>
      )}
    </div>
  );
}

function PartnerNote({ note }: { note: StudyNote }) {
  const otherUser = note.user_name as UserName;
  const oc = USER_COLORS[otherUser];
  return (
    <div className="mt-4 pt-4 border-t border-ink-800 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-ink-950"
          style={{ backgroundColor: oc.bar }}
        >
          {otherUser[0]}
        </span>
        <span className="text-xs text-slate-400">
          {otherUser} bugün için yazdı
        </span>
      </div>
      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-ink-850/50 rounded-xl px-3.5 py-3 border border-ink-800 max-h-40 overflow-auto">
        {note.content}
      </p>
    </div>
  );
}

