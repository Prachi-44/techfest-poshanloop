import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface OnlineContextValue {
  isOnline: boolean;
  toggleOnline: () => void;
  isDemoOffline: boolean;
}

const OnlineContext = createContext<OnlineContextValue | null>(null);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [isDemoOffline, setIsDemoOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => setBrowserOnline(true);
    const goOffline = () => setBrowserOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const toggleOnline = useCallback(() => {
    setIsDemoOffline((prev) => !prev);
  }, []);

  const isOnline = browserOnline && !isDemoOffline;

  return (
    <OnlineContext.Provider value={{ isOnline, toggleOnline, isDemoOffline }}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnlineStatus(): OnlineContextValue {
  const ctx = useContext(OnlineContext);
  if (!ctx) throw new Error('useOnlineStatus must be used within OnlineStatusProvider');
  return ctx;
}
