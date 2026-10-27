import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  useLiveTracking,
  requestNotificationPermission,
  showNotification,
} from '../hooks/useLiveTracking';
import { USER_COLORS } from '../lib/constants';
import type { UserName } from '../lib/types';
import { formatColon } from '../lib/time';
import { Activity, Bell, BellOff, Radio } from 'lucide-react';

function elapsedLabel(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} sn`;
  return formatColon(ms);
}

export default function LiveTrackingCard() {
  const { user } = useUser();
  const [notifAsked, setNotifAsked] = useState(false);

  const handleReminder = (otherName: UserName) => {
    showNotification(
      `Hey ${otherName} nerdesin? 👀`,
      `${user === 'Emir' ? 'Melis' : 'Emir'} 30 dakikadır çalışmıyor — bir el at!`,
    );
  };

  const { otherUserName, status, loading } = useLiveTracking(
    user,
    handleReminder,
  );

  // Ask for notification permission the first time the card mounts with a user.
  useEffect(() => {
    if (user && !notifAsked && 'Notification' in window) {
      setNotifAsked(true);
      if (Notification.permission === 'default') {
        void requestNotificationPermission();
      }
    }
  }, [user, notifAsked]);

  if (!user) return null;

  const otherColor = USER_COLORS[otherUserName];
  const myColor = USER_COLORS[user];
  const notifGranted =
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

  const working = status?.state === 'working';
  const workingMs = working ? Date.now() - new Date(status.session.start_time).getTime() : 0;
  const idleMs =
    status?.state === 'idle' && status.lastSessionEndISO
      ? Date.now() - new Date(status.lastSessionEndISO).getTime()
      : 0;
  const idleTooLong = status?.state === 'idle' && idleMs >= 30 * 60 * 1000;

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Canlı Takip</h3>
          <span className="flex items-center gap-1 text-[10px] text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot" />
            canlı
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          {notifGranted ? (
            <Bell className="w-3.5 h-3.5 text-teal-400" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}
          {notifGranted ? 'Bildirim açık' : 'Bildirim kapalı'}
        </span>
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-600 py-4">Durum alınıyor...</div>
      ) : working ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-ink-950"
              style={{ backgroundColor: otherColor.bar }}
            >
              {otherUserName[0]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{otherUserName} çalışıyor</div>
              <div className="text-[11px] text-slate-400 truncate">
                {status!.state === 'working' && status!.session.subject}
                {(status?.state === 'working' && status!.session.stage) ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-ink-800 border border-ink-700 text-[9px]">
                    {status!.session.stage}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-teal-400">
                {elapsedLabel(workingMs)}
              </div>
              <div className="text-[10px] text-slate-500">sürdü</div>
            </div>
          </div>
          <div className="h-1 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 animate-pulse-dot"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-ink-950 opacity-60"
            style={{ backgroundColor: otherColor.bar }}
          >
            {otherUserName[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-300">{otherUserName} çalışmıyor</div>
            <div className="text-[11px] text-slate-500">
              {status?.lastSessionEndISO
                ? `Son: ${elapsedLabel(idleMs)} önce`
                : 'Henüz çalışma kaydı yok'}
            </div>
          </div>
          {idleTooLong && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400">
              <Activity className="w-3 h-3" />
              30dk+ boşta
            </span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-ink-800 text-[10px] text-slate-600">
        Sen: <span style={{ color: myColor.ring }}>{user}</span> · Karşı: {otherUserName}
      </div>
    </div>
  );
}
