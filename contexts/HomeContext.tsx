import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getOrCreateHome } from '@/lib/homes';
import type { Home } from '@/types/database';

type HomeContextType = {
  home: Home | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HomeContext = createContext<HomeContextType>({
  home: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
});

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [home, setHome] = useState<Home | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether this is the initial load so we don't keep flipping isLoading
  // on subsequent refreshes (which would unmount the tabs).
  // BUG FIX: previously `home` was in the deps of `loadHome`, which created
  // an infinite re-fetch loop — each setHome(userHome) returns a new object
  // reference, recreates loadHome, retriggers the useEffect, refetches forever.
  const hasLoadedRef = useRef(false);

  const loadHome = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      if (!hasLoadedRef.current) setIsLoading(true);
      setError(null);
      const userHome = await getOrCreateHome(session.user.id);
      setHome(userHome);
      hasLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load household data');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  return (
    <HomeContext.Provider value={{ home, isLoading, error, refresh: loadHome }}>
      {children}
    </HomeContext.Provider>
  );
}

export const useHome = () => useContext(HomeContext);
