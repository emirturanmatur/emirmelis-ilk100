import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import type { UserName } from '../lib/types';

interface UserContextValue {
  user: UserName | null;
  setUser: (u: UserName) => void;
  switchUser: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserName | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.activeUser);
      if (stored === 'Emir' || stored === 'Melis') {
        setUserState(stored);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const setUser = useCallback((u: UserName) => {
    localStorage.setItem(STORAGE_KEYS.activeUser, u);
    setUserState(u);
  }, []);

  const switchUser = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEYS.activeUser);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, switchUser, loading }),
    [user, setUser, switchUser, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
