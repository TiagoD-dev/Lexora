import { apiFetch } from './api-client';

export type WorkflowRecord = { id: string; name: string; area: string; completed: number[]; createdAt: string };

export function listWorkflowsRemote(): Promise<WorkflowRecord[]> {
  return apiFetch<WorkflowRecord[]>('/workflows');
}

export function createWorkflowRemote(workflow: { name: string; area: string }): Promise<WorkflowRecord> {
  return apiFetch<WorkflowRecord>('/workflows', { method: 'POST', body: JSON.stringify(workflow) });
}

export function updateWorkflowRemote(id: string, completed: number[]): Promise<WorkflowRecord> {
  return apiFetch<WorkflowRecord>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
}

export function deleteWorkflowRemote(id: string): Promise<void> {
  return apiFetch<void>(`/workflows/${id}`, { method: 'DELETE' });
}
