import { apiFetch } from './api-client';

export function sendDelayEmail(taskTitle: string, caseTitle: string, daysLate: number): Promise<void> {
  return apiFetch<void>('/notifications/delay-email', { method: 'POST', body: JSON.stringify({ taskTitle, caseTitle, daysLate }) });
}
