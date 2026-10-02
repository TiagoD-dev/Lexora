import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getStoredToken } from '@/services/api-client';
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest, updateProfile as updateProfileRequest, type AuthUser, type ProfileFields, type RegisterInput } from '@/services/auth-service';
import { registerForPush, unregisterForPush } from '@/utils/push-registration';

type AuthContextValue = {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<ProfileFields>) => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) { setHydrated(true); return; }
      try { setUser(await fetchCurrentUser()); }
      catch { setUser(null); }
      finally { setHydrated(true); }
    })();
  }, []);

  // Ao iniciar sessão (ou arrancar a app já autenticada) regista o dispositivo para push.
  useEffect(() => { if (user?.id) registerForPush(); }, [user?.id]);

  const login = async (email: string, password: string) => { setUser(await loginRequest(email, password)); };
  const register = async (input: RegisterInput) => { setUser(await registerRequest(input)); };
  const logout = async () => { await unregisterForPush(); await logoutRequest(); setUser(null); };
  const updateProfile = async (patch: Partial<ProfileFields>) => { setUser(await updateProfileRequest(patch)); };

  const value = useMemo(() => ({ user, hydrated, login, register, logout, updateProfile }), [user, hydrated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
