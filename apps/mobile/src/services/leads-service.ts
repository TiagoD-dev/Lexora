import { apiFetch } from './api-client';

export const LEAD_STAGES = ['Novo contacto', 'Consulta', 'Proposta', 'Contratado'] as const;
export type LeadStage = typeof LEAD_STAGES[number];
export type Lead = { id: string; name: string; email: string; area: string; source: string; stage: LeadStage; value: number; notes: string; clientId: string; createdAt: string };
export type LeadDraft = Pick<Lead, 'name' | 'email' | 'area' | 'source' | 'notes'>;

export function listLeadsRemote(): Promise<Lead[]> {
  return apiFetch<Lead[]>('/leads');
}

export function createLeadRemote(draft: LeadDraft): Promise<Lead> {
  return apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(draft) });
}

export function updateLeadRemote(id: string, patch: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
