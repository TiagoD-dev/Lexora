import type { Client } from '@/types/client';
import { apiFetch } from './api-client';

export function listClientsRemote(): Promise<Client[]> {
  return apiFetch<Client[]>('/clients');
}

export function createClientRemote(client: Client): Promise<Client> {
  return apiFetch<Client>('/clients', { method: 'POST', body: JSON.stringify(client) });
}

export function updateClientRemote(id: string, patch: Partial<Client>): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteClientRemote(id: string): Promise<void> {
  return apiFetch<void>(`/clients/${id}`, { method: 'DELETE' });
}
