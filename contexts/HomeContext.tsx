import { createContext, useContext, useEffect, useState } from 'react';
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

  const loadHome = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userHome = await getOrCreateHome(session.user.id);
      setHome(userHome);
    } catch (err) {
      console.error('[HomeContext] Failed to load/create home:', err);
      setError('Failed to load household data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, [session?.user?.id]);

  return (
    <HomeContext.Provider value={{ home, isLoading, error, refresh: loadHome }}>
      {children}
    </HomeContext.Provider>
  );
}

export const useHome = () => useContext(HomeContext);
