import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createContext, useContext,  type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { createClientRemote, deleteClientRemote, listClientsRemote, updateClientRemote } from '@/services/clients-service';
import type { Client, ClientDraft } from '@/types/client';

type ClientsContextValue = { clients: Client[]; hydrated: boolean; syncStatus: 'saving' | 'saved' | 'error'; syncError: string | null; retrySync: () => void; getClient: (id: string) => Client | undefined; createClient: (draft: ClientDraft) => string; updateClient: (id: string, patch: Partial<ClientDraft>) => void; deleteClient: (id: string) => void };
const ClientsContext = createContext<ClientsContextValue | null>(null);
const STORAGE_KEY = '@lexora/clients-cache/v2';
const uid = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { items: clients, setItems: setClients, hydrated, syncStatus, syncError, retrySync, enqueue } = useSyncedCollection<Client>({
    userId: user?.id ?? null, storageKey: STORAGE_KEY, loadRemote: listClientsRemote, normalize: (item) => item,
    createRemote: createClientRemote, updateRemote: updateClientRemote, deleteRemote: deleteClientRemote,
  });

  const createClient = (draft: ClientDraft) => {
    const id = uid(); const now = new Date().toISOString();
    const client: Client = { id, ...draft, createdAt: now, updatedAt: now };
    setClients((all) => [client, ...all]);
    enqueue({ kind: 'create', item: client });
    return id;
  };
  const updateClient = (id: string, patch: Partial<ClientDraft>) => {
    const updatedAt = new Date().toISOString();
    setClients((all) => all.map((item) => item.id === id ? { ...item, ...patch, updatedAt } : item));
    enqueue({ kind: 'update', id, patch: { ...patch, updatedAt } });
  };
  const deleteClient = (id: string) => { setClients((all) => all.filter((item) => item.id !== id)); enqueue({ kind: 'delete', id }); };
  const value = { clients, hydrated, syncStatus, syncError, retrySync, getClient: (id: string) => clients.find((item) => item.id === id), createClient, updateClient, deleteClient };
  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}
export function useClients() { const value = useContext(ClientsContext); if (!value) throw new Error('useClients deve ser usado dentro de ClientsProvider'); return value; }
