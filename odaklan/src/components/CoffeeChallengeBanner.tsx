import { useEffect, useState } from 'react';
import { Coffee, Sparkles, Trophy } from 'lucide-react';
import { fetchSessions } from '../lib/db/sessions';
import { USER_COLORS } from '../lib/constants';
import { formatColon } from '../lib/time';
import { addDays, startOfDay } from '../lib/time';
import type { UserName } from '../lib/types';

interface WeeklyTotals {
  emirMs: number;
  melisMs: number;
  sponsor: UserName | null; // the one who worked LESS -> buys coffee
  leader: UserName | null;  // the one who worked MORE
  diffMs: number;
  tie: boolean;
  weekStart: Date;
  weekEnd: Date;
}

function getWeekStart(d: Date): Date {
  // Turkish weeks start Monday (1). Convert Sunday(0)->7.
  const x = startOfDay(d);
  const day = x.getDay() === 0 ? 7 : x.getDay();
  return addDays(x, -(day - 1));
}

export default function CoffeeChallengeBanner() {
  const [totals, setTotals] = useState<WeeklyTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = addDays(weekStart, 6);
    fetchSessions(startOfDay(addDays(weekStart, -1)), weekEnd)
      .then((sessions) => {
        let emirMs = 0;
        let melisMs = 0;
        for (const s of sessions) {
          const st = new Date(s.start_time).getTime();
          if (st < weekStart.getTime() || st >= addDays(weekStart, 7).getTime()) continue;
          const ms =
            s.duration_ms != null
              ? s.duration_ms
              : s.end_time
                ? new Date(s.end_time).getTime() - new Date(s.start_time).getTime()
                : Date.now() - new Date(s.start_time).getTime();
          if (s.user_name === 'Emir') emirMs += ms;
          else melisMs += ms;
        }
        const diff = emirMs - melisMs;
        const tie = Math.abs(diff) < 60_000; // under 1 min difference => tie
        const leader: UserName | null = !tie ? (diff >= 0 ? 'Emir' : 'Melis') : null;
        const sponsor: UserName | null = !tie ? (diff >= 0 ? 'Melis' : 'Emir') : null;
        setTotals({ emirMs, melisMs, sponsor, leader, diffMs: Math.abs(diff), tie, weekStart, weekEnd });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !totals || totals.tie || !totals.sponsor || !totals.leader) {
    // Even on a tie, show a friendly competitive banner with both totals.
    if (!loading && totals && totals.tie && (totals.emirMs > 0 || totals.melisMs > 0)) {
      return (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 px-4 py-3 flex items-center gap-3 animate-fade-in-up">
          <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-amber-200">
              Bu hafta başbaşı gidiyorsunuz!
            </div>
            <div className="text-[11px] text-amber-200/70 mt-0.5">
              Emir <span className="font-mono">{formatColon(totals.emirMs)}</span>
              {' · '}
              Melis <span className="font-mono">{formatColon(totals.melisMs)}</span>
              {' · '}haftayı geride kapatan kahve ısmarlar.
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const sponsorColor = USER_COLORS[totals.sponsor].bar;
  const leaderColor = USER_COLORS[totals.leader].bar;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 px-4 py-3 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          <Coffee className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-amber-200">
              Bu haftanın kahve sponsoru:
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-bold text-ink-950"
              style={{ backgroundColor: sponsorColor }}
            >
              {totals.sponsor}
            </span>
          </div>
          <div className="text-[11px] text-amber-200/70 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1"
              style={{ color: leaderColor }}
            >
              <Trophy className="w-3 h-3" />
              {totals.leader} önde
            </span>
            <span className="text-amber-200/50">·</span>
            <span className="font-mono">{formatColon(totals.diffMs)}</span>
            <span className="text-amber-200/50">fark</span>
            <span className="text-amber-200/50">·</span>
            <span className="font-mono">
              {formatColon(totals.emirMs)} / {formatColon(totals.melisMs)}
            </span>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-400/70 shrink-0 hidden sm:block" />
      </div>
    </div>
  );
}
