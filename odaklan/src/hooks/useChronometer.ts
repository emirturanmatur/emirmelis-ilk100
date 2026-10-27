import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import type { ActiveChrono, Stage, UserName } from '../lib/types';
import {
  fetchActiveSession,
  startSession,
  stopSession,
  toActiveChrono,
} from '../lib/db/sessions';
import { formatHMS } from '../lib/time';

const TICK_MS = 250;

function readLocalChrono(): ActiveChrono | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.activeChrono);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveChrono;
    if (parsed && parsed.id && parsed.start_time && parsed.user_name) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeLocalChrono(c: ActiveChrono | null) {
  if (c) {
    localStorage.setItem(STORAGE_KEYS.activeChrono, JSON.stringify(c));
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeChrono);
  }
}

function computeElapsed(startISO: string): number {
  return Date.now() - new Date(startISO).getTime();
}

export interface ChronoState {
  active: ActiveChrono | null;
  elapsedDisplay: string;
  elapsedMs: number;
  starting: boolean;
  startingSubject: string | null;
  start: (subject: string, stage: Stage) => Promise<void>;
  stop: () => Promise<void>;
  syncWithServer: (userName: UserName) => Promise<void>;
}

export function useChronometer(): ChronoState {
  const [active, setActive] = useState<ActiveChrono | null>(() => readLocalChrono());
  const [elapsedMsState, setElapsedMs] = useState<number>(() =>
    active ? computeElapsed(active.start_time) : 0,
  );
  const [starting, setStarting] = useState(false);
  const [startingSubject, setStartingSubject] = useState<string | null>(null);
  const activeRef = useRef<ActiveChrono | null>(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // requestAnimationFrame-free ticking: a single setInterval that only updates
  // when an active chronometer exists. No React state loops; interval is
  // cleared when no active chrono. Recomputed from startTime each tick so it
  // survives reloads, sleep, and tab close.
  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }
    setElapsedMs(computeElapsed(active.start_time));
    const id = setInterval(() => {
      const a = activeRef.current;
      if (!a) return;
      setElapsedMs(computeElapsed(a.start_time));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  const syncWithServer = useCallback(async (userName: UserName) => {
    const serverActive = await fetchActiveSession(userName);
    if (serverActive) {
      const chrono = toActiveChrono(serverActive);
      setActive(chrono);
      writeLocalChrono(chrono);
    } else {
      // No active server session — clear any stale local chrono.
      setActive(null);
      writeLocalChrono(null);
    }
  }, []);

  const start = useCallback(async (subject: string, stage: Stage) => {
    const localChrono = readLocalChrono();
    if (localChrono) return; // already running
    setStarting(true);
    setStartingSubject(subject);
    const startISO = new Date().toISOString();
    const userName = (activeRef.current?.user_name ??
      (localStorage.getItem(STORAGE_KEYS.activeUser) as UserName)) as UserName;
    if (!userName) {
      setStarting(false);
      setStartingSubject(null);
      return;
    }
    const session = await startSession(userName, subject, startISO, stage);
    if (session) {
      const chrono = toActiveChrono(session);
      setActive(chrono);
      writeLocalChrono(chrono);
    } else {
      // Offline fallback: keep a local-only chrono.
      const chrono: ActiveChrono = {
        id: crypto.randomUUID(),
        user_name: userName,
        subject,
        start_time: startISO,
        stage,
      };
      setActive(chrono);
      writeLocalChrono(chrono);
    }
    setStarting(false);
    setStartingSubject(null);
  }, []);

  const stop = useCallback(async () => {
    const a = activeRef.current;
    if (!a) return;
    const endISO = new Date().toISOString();
    const dur = computeElapsed(a.start_time);
    await stopSession(a.id, endISO, dur);
    setActive(null);
    writeLocalChrono(null);
    setElapsedMs(0);
  }, []);

  return {
    active,
    elapsedDisplay: formatHMS(elapsedMsState),
    elapsedMs: elapsedMsState,
    starting,
    startingSubject,
    start,
    stop,
    syncWithServer,
  };
}
