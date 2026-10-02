import { apiFetch } from './api-client';

export type FeeEntry = { id: string; caseId: string | null; kind: string; client: string; description: string; amount: number; hours: number | null; workDate: string | null; vat: string; dueDate: string; paid: boolean; createdAt: string };
export type NewFeeEntry = Omit<FeeEntry, 'id' | 'paid' | 'createdAt'>;

export function listFeesRemote(): Promise<FeeEntry[]> {
  return apiFetch<FeeEntry[]>('/fees');
}

export function createFeeRemote(entry: NewFeeEntry): Promise<FeeEntry> {
  return apiFetch<FeeEntry>('/fees', { method: 'POST', body: JSON.stringify(entry) });
}

export function updateFeeRemote(id: string, patch: Partial<Pick<FeeEntry, 'paid' | 'description' | 'amount' | 'dueDate'>>): Promise<FeeEntry> {
  return apiFetch<FeeEntry>(`/fees/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteFeeRemote(id: string): Promise<void> {
  return apiFetch<void>(`/fees/${id}`, { method: 'DELETE' });
}
