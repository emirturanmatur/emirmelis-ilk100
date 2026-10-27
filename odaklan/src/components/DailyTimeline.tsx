import { useMemo } from 'react';
import type { StudySession } from '../lib/types';
import { USER_COLORS, subjectColor } from '../lib/constants';
import { startOfDay, formatColon } from '../lib/time';
import type { UserName } from '../lib/types';

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24

interface Props {
  sessions: StudySession[];
  date: Date;
}

interface Block {
  session: StudySession;
  startMin: number; // minutes since 00:00
  endMin: number;
}

function toMinutes(iso: string, day: Date): number {
  const d = new Date(iso);
  const dayStart = startOfDay(day).getTime();
  return (d.getTime() - dayStart) / 60000;
}

export default function DailyTimeline({ sessions, date }: Props) {
  const blocks = useMemo<Block[]>(() => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = dayStart + 24 * 3600 * 1000;
    return sessions
      .map((s) => {
        const st = new Date(s.start_time).getTime();
        const endRaw = s.end_time ? new Date(s.end_time).getTime() : Date.now();
        // clamp to this day
        const stClamped = Math.max(st, dayStart);
        const endClamped = Math.min(endRaw, dayEnd);
        if (endClamped <= stClamped) return null;
        return {
          session: s,
          startMin: (stClamped - dayStart) / 60000,
          endMin: (endClamped - dayStart) / 60000,
        };
      })
      .filter((b): b is Block => b !== null)
      .sort((a, b) => a.startMin - b.startMin);
  }, [sessions, date]);

  const totalMs = useMemo(
    () =>
      blocks.reduce(
        (sum, b) => sum + (b.endMin - b.startMin) * 60000,
        0,
      ),
    [blocks],
  );

  const nowMin = useMemo(() => {
    const d = new Date();
    if (d.toDateString() !== date.toDateString()) return null;
    return d.getHours() * 60 + d.getMinutes();
  }, [date]);

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Günlük Zaman Çizelgesi</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <LegendDot color={USER_COLORS.Emir.bar} label="Emir" />
          <LegendDot color={USER_COLORS.Melis.bar} label="Melis" />
          <span className="text-slate-400">
            Toplam: <span className="text-white font-semibold">{formatColon(totalMs)}</span>
          </span>
        </div>
      </div>

      {/* Hour axis labels */}
      <div className="relative h-6 mb-1 select-none">
        {HOURS.filter((h) => h % 3 === 0 || h === 24).map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2 text-[10px] text-slate-500 font-mono"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>

      {/* Emir lane */}
      <Lane label="Emir" userName="Emir" blocks={blocks} nowMin={nowMin} />
      <div className="h-3" />
      {/* Melis lane */}
      <Lane label="Melis" userName="Melis" blocks={blocks} nowMin={nowMin} />

      {/* Hour grid lines under lanes are drawn inside Lane */}
    </div>
  );
}

function Lane({
  label,
  userName,
  blocks,
  nowMin,
}: {
  label: string;
  userName: UserName;
  blocks: Block[];
  nowMin: number | null;
}) {
  const userBlocks = blocks.filter((b) => b.session.user_name === userName);
  const laneColor = USER_COLORS[userName].bar;

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 shrink-0 text-right">
        <span
          className="text-xs font-medium"
          style={{ color: laneColor }}
        >
          {label}
        </span>
      </div>
      <div className="relative flex-1 h-9 rounded-lg bg-ink-850 border border-ink-700 overflow-hidden">
        {/* gridlines */}
        {HOURS.filter((h) => h % 3 === 0 && h !== 0 && h !== 24).map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-ink-700/70"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
        {/* blocks */}
        {userBlocks.map((b) => {
          const leftPct = (b.startMin / (24 * 60)) * 100;
          const widthPct = ((b.endMin - b.startMin) / (24 * 60)) * 100;
          const sc = subjectColor(b.session.subject);
          return (
            <div
              key={b.session.id}
              title={`${b.session.subject} · ${b.session.user_name}`}
              className="absolute top-0.5 bottom-0.5 rounded-md border border-white/10 cursor-default overflow-hidden"
              style={{
                left: `${leftPct}%`,
                width: `max(${widthPct}%, 4px)`,
                background: `linear-gradient(180deg, ${sc}, ${sc}cc)`,
              }}
            />
          );
        })}
        {/* now marker */}
        {nowMin !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            style={{ left: `${(nowMin / (24 * 60)) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-400">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
