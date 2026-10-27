import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StudySession, UserName } from '../lib/types';
import { USER_NAMES } from '../lib/types';
import { subjectColor, USER_COLORS } from '../lib/constants';
import { addDays, dayLabel, formatColon, formatHM, startOfDay } from '../lib/time';
import SessionEditModal from './SessionEditModal';

interface Props {
  sessions: StudySession[];
  range: 'week' | 'month';
  onChanged: () => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0b0f17',
  border: '1px solid #1c2333',
  borderRadius: 12,
  color: '#e6e8ee',
  fontSize: 12,
};

export default function Reports({ sessions, range, onChanged }: Props) {
  const days = range === 'week' ? 7 : 30;
  const [editId, setEditId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const editing = useMemo(
    () => sessions.find((s) => s.id === editId) ?? null,
    [editId, sessions],
  );

  const dayData = useMemo(() => {
    const today = startOfDay(new Date());
    const arr: { day: string; Emir: number; Melis: number; raw: Date }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const next = addDays(d, 1);
      const daySessions = sessions.filter((s) => {
        const st = new Date(s.start_time).getTime();
        return st >= d.getTime() && st < next.getTime();
      });
      let emirMs = 0;
      let melisMs = 0;
      for (const s of daySessions) {
        const ms = durationOf(s);
        if (s.user_name === 'Emir') emirMs += ms;
        else melisMs += ms;
      }
      arr.push({
        day: dayLabel(d),
        Emir: +(emirMs / 3600000).toFixed(2),
        Melis: +(melisMs / 3600000).toFixed(2),
        raw: d,
      });
    }
    return arr;
  }, [sessions, days]);

  const subjectByUserData = useMemo(() => {
    const map = new Map<
      string,
      { subject: string; Emir: number; Melis: number; color: string }
    >();
    for (const s of sessions) {
      const ms = durationOf(s);
      if (ms <= 0) continue;
      let row = map.get(s.subject);
      if (!row) {
        row = {
          subject: s.subject,
          Emir: 0,
          Melis: 0,
          color: subjectColor(s.subject),
        };
        map.set(s.subject, row);
      }
      if (s.user_name === 'Emir') row.Emir += ms;
      else row.Melis += ms;
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        Emir: +(r.Emir / 3600000).toFixed(2),
        Melis: +(r.Melis / 3600000).toFixed(2),
        total: r.Emir + r.Melis,
      }))
      .sort((a, b) => b.total - a.total);
  }, [sessions]);

  const subjectDataByUser = useMemo(() => {
    const build = (userName: UserName) => {
      const bySubject = new Map<
        string,
        { name: string; ms: number; color: string }
      >();
      for (const s of sessions) {
        if (s.user_name !== userName) continue;
        const ms = durationOf(s);
        if (ms <= 0) continue;
        const existing = bySubject.get(s.subject);
        if (existing) existing.ms += ms;
        else
          bySubject.set(s.subject, {
            name: s.subject,
            ms,
            color: subjectColor(s.subject),
          });
      }
      return Array.from(bySubject.values())
        .map((d) => ({ name: d.name, value: d.ms, color: d.color }))
        .sort((a, b) => b.value - a.value);
    };
    return { Emir: build('Emir'), Melis: build('Melis') };
  }, [sessions]);

  const totals = useMemo(() => {
    let emir = 0;
    let melis = 0;
    for (const s of sessions) {
      const ms = durationOf(s);
      if (s.user_name === 'Emir') emir += ms;
      else melis += ms;
    }
    return { emir, melis, total: emir + melis };
  }, [sessions]);

  const subjectTotalsByUser = useMemo(() => {
    const sum = (arr: { value: number }[]) =>
      arr.reduce((acc, d) => acc + d.value, 0);
    return {
      Emir: sum(subjectDataByUser.Emir),
      Melis: sum(subjectDataByUser.Melis),
    };
  }, [subjectDataByUser]);

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {range === 'week' ? 'Haftalık' : 'Aylık'} Rapor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Son {days} gün · Toplam {formatColon(totals.total)}
          </p>
        </div>
        <button
          onClick={() => setListOpen((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-ink-850 border border-ink-700 text-slate-300 hover:text-white hover:border-ink-600 transition-colors"
        >
          {listOpen ? 'Gizle' : 'Oturumları Düzenle'}
        </button>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatCard label="Emir" value={formatHM(totals.emir)} color={USER_COLORS.Emir.bar} />
        <StatCard label="Melis" value={formatHM(totals.melis)} color={USER_COLORS.Melis.bar} />
        <StatCard label="Toplam" value={formatHM(totals.total)} color="#94a3b8" />
      </div>

      {/* Daily bar chart */}
      <div className="h-56 sm:h-64 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#1c2333' }}
              tickLine={false}
              interval={range === 'month' ? 4 : 0}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}sa`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: '#1c233340' }}
              formatter={(v: number) => [formatColon(v * 3600000), '']}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Emir" stackId="a" fill={USER_COLORS.Emir.bar} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Melis" stackId="a" fill={USER_COLORS.Melis.bar} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject distribution per user */}
      {subjectDataByUser.Emir.length > 0 || subjectDataByUser.Melis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(USER_NAMES).map((u) => (
            <SubjectPie
              key={u}
              user={u}
              data={subjectDataByUser[u]}
              totalMs={subjectTotalsByUser[u]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-xs text-slate-600 py-6">
          Bu dönem için henüz çalışma kaydı yok.
        </div>
      )}

      {/* Per-subject breakdown by user */}
      <div className="mt-6 pt-5 border-t border-ink-800">
        <h4 className="text-xs font-semibold text-slate-300 mb-1">
          Ders Bazlı Süre Dağılımı
        </h4>
        <p className="text-[11px] text-slate-500 mb-3">
          Her dersin Emir ve Melis arasında nasıl dağıldığı (saat)
        </p>
        {subjectByUserData.length > 0 ? (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectByUserData}
                  layout="vertical"
                  margin={{ top: 2, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1c2333"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#1c2333' }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}sa`}
                  />
                  <YAxis
                    type="category"
                    dataKey="subject"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: '#1c233340' }}
                    formatter={(v: number, n: string) => [formatColon(v * 3600000), n]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="Emir"
                    stackId="x"
                    fill={USER_COLORS.Emir.bar}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Melis"
                    stackId="x"
                    fill={USER_COLORS.Melis.bar}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5 max-h-56 overflow-auto pr-1">
              {subjectByUserData.map((r) => (
                <SubjectSplitRow key={r.subject} row={r} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-xs text-slate-600 py-6">
            Bu dönem için henüz çalışma kaydı yok.
          </div>
        )}
      </div>

      {listOpen && (
        <div className="mt-5 border-t border-ink-800 pt-4 animate-fade-in-up">
          <h4 className="text-xs font-semibold text-slate-300 mb-3">Oturumlar</h4>
          <div className="space-y-1.5 max-h-72 overflow-auto pr-1">
            {[...sessions]
              .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
              .map((s) => (
                <SessionRow key={s.id} session={s} onEdit={() => setEditId(s.id)} />
              ))}
          </div>
        </div>
      )}

      {editing && (
        <SessionEditModal
          session={editing}
          onClose={() => setEditId(null)}
          onSaved={() => {
            setEditId(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-ink-850 border border-ink-700 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <div className="text-base font-semibold text-white mt-0.5">{value}</div>
    </div>
  );
}

function SessionRow({ session, onEdit }: { session: StudySession; onEdit: () => void }) {
  const ms = durationOf(session);
  const d = new Date(session.start_time);
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-ink-850 border border-ink-700 hover:border-ink-600 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: subjectColor(session.subject) }}
        />
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-200 truncate">{session.subject}</div>
          <div className="text-[10px] text-slate-500">
            {session.user_name} · {d.toLocaleDateString('tr-TR')}{' '}
            {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400 font-mono">{formatColon(ms)}</span>
        <button
          onClick={onEdit}
          className="text-[11px] px-2 py-1 rounded-md bg-ink-800 text-slate-300 hover:text-white hover:bg-ink-700 transition-colors"
        >
          Düzenle
        </button>
      </div>
    </div>
  );
}

function SubjectSplitRow({
  row,
}: {
  row: {
    subject: string;
    Emir: number;
    Melis: number;
    total: number;
    color: string;
  };
}) {
  const totalMs = row.total;
  const emirPct = totalMs > 0 ? (row.Emir / totalMs) * 100 : 0;
  const melisPct = totalMs > 0 ? (row.Melis / totalMs) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-ink-850 border border-ink-800">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: row.color }}
        />
        <span className="text-xs font-medium text-slate-200 truncate">
          {row.subject}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: USER_COLORS.Emir.bar }}
          />
          <span className="text-[11px] text-slate-300 font-mono">
            {formatColon(row.Emir * 3600000)}
          </span>
          <span className="text-[10px] text-slate-500 w-9 text-right">
            {Math.round(emirPct)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: USER_COLORS.Melis.bar }}
          />
          <span className="text-[11px] text-slate-300 font-mono">
            {formatColon(row.Melis * 3600000)}
          </span>
          <span className="text-[10px] text-slate-500 w-9 text-right">
            {Math.round(melisPct)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function durationOf(s: StudySession): number {
  if (s.duration_ms != null) return s.duration_ms;
  if (s.end_time) {
    return new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
  }
  return Date.now() - new Date(s.start_time).getTime();
}

function SubjectPie({
  user,
  data,
  totalMs,
}: {
  user: UserName;
  data: { name: string; value: number; color: string }[];
  totalMs: number;
}) {
  const c = USER_COLORS[user];
  return (
    <div className="rounded-2xl bg-ink-850 border border-ink-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-ink-950"
          style={{ backgroundColor: c.bar }}
        >
          {user[0]}
        </span>
        <h4 className="text-xs font-semibold text-slate-200">{user}</h4>
        <span className="text-[11px] text-slate-500 ml-auto font-mono">
          {formatColon(totalMs)}
        </span>
      </div>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={32}
                  outerRadius={60}
                  paddingAngle={2}
                  stroke="#0b0f17"
                  strokeWidth={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, n: string) => [formatColon(v), n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
            {data.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-slate-300 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="text-slate-400 font-mono shrink-0">
                  {formatColon(s.value)} ·{' '}
                  <span className="text-slate-500">
                    {totalMs > 0 ? Math.round((s.value / totalMs) * 100) : 0}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-[11px] text-slate-600 py-6">
          {user} bu dönem için çalışma kaydı yok.
        </div>
      )}
    </div>
  );
}
