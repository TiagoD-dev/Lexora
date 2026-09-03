import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { fetchLegalUpdates } from '@/services/legal-updates-service';
import type { LegalUpdate } from '@/types/legal-update';

type LegalUpdatesContextValue = { updates: LegalUpdate[]; hydrated: boolean; error: boolean; refresh: () => void };
const LegalUpdatesContext = createContext<LegalUpdatesContextValue | null>(null);

export function LegalUpdatesProvider({ children }: { children: ReactNode }) {
  const { user, hydrated: authHydrated } = useAuth();
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user) { setUpdates([]); setHydrated(true); return; }
    let cancelled = false;
    fetchLegalUpdates()
      .then((remote) => { if (!cancelled) { setUpdates(remote); setError(false); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setHydrated(true); });
    return () => { cancelled = true; };
  }, [user, authHydrated, refreshToken]);

  const value = useMemo(() => ({ updates, hydrated, error, refresh: () => setRefreshToken((n) => n + 1) }), [updates, hydrated, error]);
  return <LegalUpdatesContext.Provider value={value}>{children}</LegalUpdatesContext.Provider>;
}

export function useLegalUpdates() {
  const value = useContext(LegalUpdatesContext);
  if (!value) throw new Error('useLegalUpdates deve ser usado dentro de LegalUpdatesProvider');
  return value;
}
