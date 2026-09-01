import type { LegalCase } from '@/types/case';
import { apiFetch } from './api-client';

export function listCasesRemote(): Promise<LegalCase[]> {
  return apiFetch<LegalCase[]>('/cases');
}

export function createCaseRemote(legalCase: LegalCase): Promise<LegalCase> {
  return apiFetch<LegalCase>('/cases', { method: 'POST', body: JSON.stringify(legalCase) });
}

export function updateCaseRemote(id: string, patch: Partial<LegalCase>): Promise<LegalCase> {
  return apiFetch<LegalCase>(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteCaseRemote(id: string): Promise<void> {
  return apiFetch<void>(`/cases/${id}`, { method: 'DELETE' });
}
