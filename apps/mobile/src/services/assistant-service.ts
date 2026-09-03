import { apiFetch } from './api-client';

export function askAssistantRemote(caseId: string, prompt: string): Promise<{ reply: string }> {
  return apiFetch<{ reply: string }>(`/cases/${caseId}/assistant`, { method: 'POST', body: JSON.stringify({ prompt }) });
}
