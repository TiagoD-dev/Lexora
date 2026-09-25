import type { SimilarCase } from '@/types/similar-case';
import { apiFetch } from './api-client';

export function fetchSimilarCases(caseId: string): Promise<SimilarCase[]> {
  return apiFetch<SimilarCase[]>(`/cases/${caseId}/similar-cases`);
}
