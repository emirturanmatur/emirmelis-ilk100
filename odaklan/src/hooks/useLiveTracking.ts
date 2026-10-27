import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { USER_NAMES } from '../lib/types';
import type { UserName, StudySession } from '../lib/types';

const REMINDER_AFTER_MS = 30 * 60 * 1000; // 30 minutes
const REMINDER_RECHECK_MS = 60 * 1000; // re-check every minute

type OtherStatus =
  | { state: 'idle'; lastSessionEndISO: string | null }
  | { state: 'working'; session: StudySession };

function otherUser(currentUser: UserName): UserName {
  return USER_NAMES.find((u) => u !== currentUser) ?? (currentUser === 'Emir' ? 'Melis' : 'Emir');
}

function isWorking(s: StudySession | null): s is StudySession {
  return Boolean(s && !s.end_time);
}

export interface LiveTrackingState {
  otherUserName: UserName;
  status: OtherStatus | null;
  loading: boolean;
}

export function useLiveTracking(
  currentUser: UserName | null,
  onOtherIdleTooLong?: (otherName: UserName) => void,
): LiveTrackingState {
  const [status, setStatus] = useState<OtherStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef<UserName | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Fetch the other user's most recent session (active or last ended).
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured) {
      setStatus(null);
      setLoading(false);
      return;
    }
    const other = otherUser(currentUser);

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_name', other)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.error('liveTracking load', error.message);
        setStatus({ state: 'idle', lastSessionEndISO: null });
        setLoading(false);
        return;
      }
      const s = (data as StudySession | null) ?? null;
      if (isWorking(s)) {
        setStatus({ state: 'working', session: s });
      } else {
        setStatus({
          state: 'idle',
          lastSessionEndISO: s?.end_time ?? s?.start_time ?? null,
        });
      }
      setLoading(false);
    }

    void load();

    // Realtime subscription: react to the other user's session changes.
    const channel = supabase
      .channel(`live-tracking-${other}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_name=eq.${other}`,
        },
        (payload) => {
          const row = (payload.new as StudySession | null) ?? null;
          if (!row) {
            // DELETE: re-check from scratch
            void load();
            return;
          }
          if (isWorking(row)) {
            setStatus({ state: 'working', session: row });
          } else {
            setStatus({
              state: 'idle',
              lastSessionEndISO: row.end_time ?? row.start_time,
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // 30-minute idle reminder: re-check every minute; if the other user has been
  // idle (not working) for > 30 min, fire the callback once per idle period.
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onOtherIdleTooLong || !currentUser) return;
    const cu = currentUser;

    function check() {
      const st = status;
      if (!st) return;
      if (st.state === 'working') {
        firedRef.current = null;
        return;
      }
      const refISO = st.lastSessionEndISO;
      if (!refISO) {
        // never studied — remind once per session if 30 min elapsed since login
        if (firedRef.current === 'never') return;
        firedRef.current = 'never';
        onOtherIdleTooLong(otherUser(cu));
        return;
      }
      const elapsed = Date.now() - new Date(refISO).getTime();
      if (elapsed >= REMINDER_AFTER_MS) {
        const key = refISO;
        if (firedRef.current === key) return; // already fired for this idle gap
        firedRef.current = key;
        onOtherIdleTooLong(otherUser(cu));
      }
    }

    const id = setInterval(check, REMINDER_RECHECK_MS);
    return () => clearInterval(id);
  }, [status, currentUser, onOtherIdleTooLong]);

  return {
    otherUserName: currentUser ? otherUser(currentUser) : 'Emir',
    status,
    loading,
  };
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    /* some browsers require a service worker; ignore */
  }
}
