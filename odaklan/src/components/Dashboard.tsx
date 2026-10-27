import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useChronometer } from '../hooks/useChronometer';
import { fetchSessions } from '../lib/db/sessions';
import type { StudySession } from '../lib/types';
import { addDays, endOfDay, startOfDay, todayLocalISODate } from '../lib/time';
import Header from './Header';
import ChronometerCard from './ChronometerCard';
import DailyTimeline from './DailyTimeline';
import AmbientSounds from './AmbientSounds';
import DailyNoteCard from './DailyNoteCard';
import Reports from './Reports';
import StudyPlanCard from './StudyPlanCard';
import LiveTrackingCard from './LiveTrackingCard';
import CoffeeChallengeBanner from './CoffeeChallengeBanner';

type Range = 'week' | 'month';

export default function Dashboard() {
  const { user } = useUser();
  const chrono = useChronometer();
  const [timelineDate, setTimelineDate] = useState<Date>(new Date());
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [rangeSessions, setRangeSessions] = useState<StudySession[]>([]);
  const [range, setRange] = useState<Range>('week');
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingRange, setLoadingRange] = useState(true);

  // Load today's sessions for timeline
  const loadToday = useCallback(async () => {
    const from = startOfDay(timelineDate);
    const to = endOfDay(timelineDate);
    setLoadingToday(true);
    const s = await fetchSessions(from, to);
    setTodaySessions(s);
    setLoadingToday(false);
  }, [timelineDate]);

  // Load range sessions for reports
  const loadRange = useCallback(async () => {
    const to = endOfDay(new Date());
    const from = range === 'week' ? startOfDay(addDays(new Date(), -6)) : startOfDay(addDays(new Date(), -29));
    setLoadingRange(true);
    const s = await fetchSessions(from, to);
    setRangeSessions(s);
    setLoadingRange(false);
  }, [range]);

  // On user change: sync active chrono from server, then load everything
  useEffect(() => {
    if (!user) return;
    void chrono.syncWithServer(user).then(() => {
      void loadToday();
      void loadRange();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload today when timeline date changes
  useEffect(() => {
    if (user) void loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineDate]);

  // Reload range when range changes
  useEffect(() => {
    if (user) void loadRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // When chrono stops (active goes from truthy -> null), refetch
  const activeId = chrono.active?.id;
  useEffect(() => {
    if (!user) return;
    void loadToday();
    void loadRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const dateNav = useMemo(
    () => ({
      isToday: todayLocalISODate(timelineDate) === todayLocalISODate(new Date()),
      goPrev: () => setTimelineDate((d) => addDays(d, -1)),
      goNext: () => setTimelineDate((d) => addDays(d, 1)),
      goToday: () => setTimelineDate(new Date()),
    }),
    [timelineDate],
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-ink-950">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-32 space-y-4 sm:space-y-6">
        <CoffeeChallengeBanner />

        {/* Top row: chronometer (mobile-first, prominent) + ambient + notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-1 lg:col-span-1">
            <ChronometerCard />
          </div>
          <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-4 sm:gap-6">
            <LiveTrackingCard />
            <AmbientSounds />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <DailyNoteCard />
          </div>
        </div>

        {/* Study plan */}
        <StudyPlanCard />

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Zaman Çizelgesi
            </h2>
            <div className="flex items-center gap-1">
              <NavBtn onClick={dateNav.goPrev} label="Önceki gün">
                ←
              </NavBtn>
              <button
                onClick={dateNav.goToday}
                disabled={dateNav.isToday}
                className="px-3 py-1.5 text-xs rounded-lg bg-ink-850 border border-ink-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Bugün
              </button>
              <NavBtn onClick={dateNav.goNext} label="Sonraki gün">
                →
              </NavBtn>
            </div>
          </div>
          {loadingToday ? (
            <div className="h-44 rounded-3xl bg-ink-900 border border-ink-800 flex items-center justify-center text-sm text-slate-600">
              Yükleniyor...
            </div>
          ) : (
            <DailyTimeline sessions={todaySessions} date={timelineDate} />
          )}
        </div>

        {/* Reports */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Raporlar
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-ink-700">
              <RangeBtn active={range === 'week'} onClick={() => setRange('week')}>
                Haftalık
              </RangeBtn>
              <RangeBtn active={range === 'month'} onClick={() => setRange('month')}>
                Aylık
              </RangeBtn>
            </div>
          </div>
          {loadingRange ? (
            <div className="h-64 rounded-3xl bg-ink-900 border border-ink-800 flex items-center justify-center text-sm text-slate-600">
              Yükleniyor...
            </div>
          ) : (
            <Reports
              sessions={rangeSessions}
              range={range}
              onChanged={() => {
                void loadRange();
                void loadToday();
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-lg bg-ink-850 border border-ink-700 text-slate-300 hover:text-white hover:border-ink-600 transition-colors"
    >
      {children}
    </button>
  );
}

function RangeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
        active
          ? 'bg-teal-500 text-ink-950'
          : 'text-slate-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
