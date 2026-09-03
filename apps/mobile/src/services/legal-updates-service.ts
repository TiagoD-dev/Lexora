import type { LegalUpdate } from '@/types/legal-update';
import { apiFetch } from './api-client';

export function fetchLegalUpdates(): Promise<LegalUpdate[]> {
  return apiFetch<LegalUpdate[]>('/legal-updates');
}
