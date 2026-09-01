import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { createClientRemote, deleteClientRemote, listClientsRemote, updateClientRemote } from '@/services/clients-service';
import type { Client, ClientDraft } from '@/types/client';

type ClientsContextValue = { clients: Client[]; hydrated: boolean; getClient: (id: string) => Client | undefined; createClient: (draft: ClientDraft) => string; updateClient: (id: string, patch: Partial<ClientDraft>) => void; deleteClient: (id: string) => void };
const ClientsContext = createContext<ClientsContextValue | null>(null);
const STORAGE_KEY = '@lexora/clients-cache/v1';
const uid = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user, hydrated: authHydrated } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user) { setClients([]); setHydrated(true); return; }
    let cancelled = false;
    setHydrated(false);
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try { const cached: unknown = JSON.parse(raw); if (Array.isArray(cached)) setClients(cached as Client[]); } catch { /* cache inválida */ }
    }).catch(() => undefined);
    listClientsRemote()
      .then((remote) => { if (!cancelled) setClients(remote); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setHydrated(true); });
    return () => { cancelled = true; };
  }, [user, authHydrated]);

  useEffect(() => { if (hydrated && user) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clients)).catch(() => undefined); }, [clients, hydrated, user]);

  const createClient = (draft: ClientDraft) => {
    const id = uid(); const now = new Date().toISOString();
    const client: Client = { id, ...draft, createdAt: now, updatedAt: now };
    setClients((all) => [client, ...all]);
    createClientRemote(client).catch(() => undefined);
    return id;
  };
  const updateClient = (id: string, patch: Partial<ClientDraft>) => {
    const updatedAt = new Date().toISOString();
    setClients((all) => all.map((item) => item.id === id ? { ...item, ...patch, updatedAt } : item));
    updateClientRemote(id, { ...patch, updatedAt }).catch(() => undefined);
  };
  const deleteClient = (id: string) => { setClients((all) => all.filter((item) => item.id !== id)); deleteClientRemote(id).catch(() => undefined); };
  const value = useMemo(() => ({ clients, hydrated, getClient: (id: string) => clients.find((item) => item.id === id), createClient, updateClient, deleteClient }), [clients, hydrated]);
  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}
export function useClients() { const value = useContext(ClientsContext); if (!value) throw new Error('useClients deve ser usado dentro de ClientsProvider'); return value; }
