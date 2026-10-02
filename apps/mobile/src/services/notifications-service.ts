import { apiFetch } from './api-client';

export function sendDelayEmail(taskTitle: string, caseTitle: string, daysLate: number, caseId?: string): Promise<void> {
  return apiFetch<void>('/notifications/delay-email', { method: 'POST', body: JSON.stringify({ taskTitle, caseTitle, daysLate, caseId }) });
}

export function sendClientEmail(to: string, subject: string, body: string): Promise<void> {
  return apiFetch<void>('/notifications/client-email', { method: 'POST', body: JSON.stringify({ to, subject, body }) });
}

export function registerPushToken(token: string): Promise<void> {
  return apiFetch<void>('/notifications/push-tokens', { method: 'POST', body: JSON.stringify({ token }) });
}

export function unregisterPushToken(token: string): Promise<void> {
  return apiFetch<void>(`/notifications/push-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' });
}
