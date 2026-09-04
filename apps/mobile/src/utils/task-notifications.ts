import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { CaseTask } from '@/types/case';
import { parseLocalDate } from '@/utils/deadlines';

let permissionRequested = false;

async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionRequested) return false;
  permissionRequested = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Um identificador único por (tarefa, dia de aviso) — reagendar substitui naturalmente o anterior.
const notificationId = (taskId: string, suffix: string) => `task-reminder:${taskId}:${suffix}`;

/**
 * Agenda lembretes locais para uma tarefa: um por cada dia em reminderDays (às 9h desse dia)
 * e um no próprio dia de vencimento. Cancela primeiro quaisquer lembretes antigos da tarefa.
 */
export async function scheduleTaskReminders(task: CaseTask, caseTitle: string) {
  await cancelTaskReminders(task.id);
  if (Platform.OS === 'web' || task.completed || !task.dueDate) return;
  const due = parseLocalDate(task.dueDate);
  if (!due) return;
  const granted = await ensurePermission();
  if (!granted) return;

  const schedule = async (suffix: string, fireDate: Date, body: string) => {
    if (fireDate.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId(task.id, suffix),
      content: { title: `Prazo: ${task.title}`, body: `${caseTitle} · ${body}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  };

  for (const daysBefore of task.reminderDays) {
    const fireDate = new Date(due);
    fireDate.setDate(fireDate.getDate() - daysBefore);
    fireDate.setHours(9, 0, 0, 0);
    await schedule(String(daysBefore), fireDate, daysBefore === 0 ? 'Vence hoje' : `Vence em ${daysBefore} dia(s)`);
  }

  const dueAt9 = new Date(due);
  dueAt9.setHours(9, 0, 0, 0);
  await schedule('due', dueAt9, 'Vence hoje');

  if (__DEV__) console.log(`[task-notifications] agendados ${task.reminderDays.length + 1} lembretes para "${task.title}"`);
}

export async function cancelTaskReminders(taskId: string) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .map((entry) => entry.identifier)
    .filter((id) => id.startsWith(`task-reminder:${taskId}:`));
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
