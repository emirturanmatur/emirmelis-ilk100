import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useChronometer } from '../hooks/useChronometer';
import { SUBJECTS, USER_COLORS } from '../lib/constants';
import type { Stage } from '../lib/types';
import { Play, Square, Clock } from 'lucide-react';

export default function ChronometerCard() {
  const { user } = useUser();
  const chrono = useChronometer();
  const [subject, setSubject] = useState<string>('Matematik');
  const [stage, setStage] = useState<Stage>('TYT');
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!user) return null;
  const c = USER_COLORS[user];
  const isActive = Boolean(chrono.active);

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Kronometre</h3>
        </div>
        {isActive ? (
          <span className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-ink-850 border border-ink-700 text-[11px] font-semibold text-teal-400">
              {chrono.active?.stage ?? 'TYT'}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse-dot" />
              Çalışıyor
            </span>
          </span>
        ) : (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-ink-700">
            {(['TYT', 'AYT'] as Stage[]).map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  stage === s
                    ? 'bg-teal-500 text-ink-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-3 sm:py-4">
        <div
          className={`font-mono font-bold tracking-tight tabular-nums transition-colors ${
            isActive ? 'text-white' : 'text-slate-500'
          } text-4xl sm:text-6xl`}
        >
          {chrono.elapsedDisplay}
        </div>
        {isActive && chrono.active ? (
          <div className="mt-2 text-sm text-slate-400">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
              style={{ backgroundColor: subjectColorOf(chrono.active.subject) }}
            />
            {chrono.active.subject}
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-600">Hazır · Bir ders seç ve başlat</div>
        )}
      </div>

      {!isActive ? (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-ink-850 border border-ink-700 hover:border-ink-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subjectColorOf(subject) }}
                />
                <span className="text-sm font-medium text-white">{subject}</span>
              </span>
              <span className="text-xs text-slate-500">
                {pickerOpen ? 'Kapat' : 'Değiştir'}
              </span>
            </button>
          </div>

          {pickerOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3 animate-fade-in-up">
              {SUBJECTS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSubject(s.name);
                    setPickerOpen(false);
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                    subject === s.name
                      ? 'border-teal-500/50 bg-teal-500/10 text-white'
                      : 'border-ink-700 bg-ink-850 text-slate-300 hover:border-ink-600'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => chrono.start(subject, stage)}
            disabled={chrono.starting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-teal-600 text-ink-950 font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-60 transition-shadow"
          >
            <Play className="w-4 h-4 fill-current" />
            {chrono.starting && chrono.startingSubject === subject
              ? 'Başlatılıyor...'
              : `${stage} · Çalışmayı Başlat`}
          </button>
        </div>
      ) : (
        <button
          onClick={chrono.stop}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-400 font-semibold text-sm hover:bg-rose-500/20 transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
          Durdur ve Kaydet
        </button>
      )}
    </div>
  );
}

function subjectColorOf(name: string): string {
  const s = SUBJECTS.find((x) => x.name === name);
  return s?.color ?? '#94a3b8';
}
