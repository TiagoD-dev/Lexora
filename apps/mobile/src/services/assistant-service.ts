import { apiFetch } from './api-client';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type AssistantAction = { kind: 'task' | 'fact' | 'missing'; title: string; dueDate: string | null; reason: string; state?: 'applied' | 'dismissed' };
export type AssistantSource = { title: string; reference: string; url: string; excerpt: string };
export type AssistantReply = { reply: string; actions?: AssistantAction[]; sources?: AssistantSource[] };

export function askAssistantRemote(caseId: string, prompt: string, history: ChatTurn[] = []): Promise<AssistantReply> {
  return apiFetch<AssistantReply>(`/cases/${caseId}/assistant`, { method: 'POST', body: JSON.stringify({ prompt, history }) });
}
