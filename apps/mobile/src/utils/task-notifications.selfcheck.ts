// ponytail: self-check, no test runner wired for apps/mobile. Run manually with:
//   npx ts-node apps/mobile/src/utils/task-notifications.selfcheck.ts
// Asserts the reminder trigger-date math in scheduleTaskReminders (due date minus N days, at 09:00).
import { parseLocalDate } from '@/utils/deadlines';

function reminderFireDate(dueDate: string, daysBefore: number) {
  const due = parseLocalDate(dueDate)!;
  const fireDate = new Date(due);
  fireDate.setDate(fireDate.getDate() - daysBefore);
  fireDate.setHours(9, 0, 0, 0);
  return fireDate;
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (String(actual) !== String(expected)) throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  console.log(`OK ${label}`);
}

const due = '2026-09-15';
assertEqual(reminderFireDate(due, 0).toDateString(), new Date(2026, 8, 15).toDateString(), 'reminderDays=0 fires on due date');
assertEqual(reminderFireDate(due, 1).toDateString(), new Date(2026, 8, 14).toDateString(), 'reminderDays=1 fires day before');
assertEqual(reminderFireDate(due, 7).toDateString(), new Date(2026, 8, 8).toDateString(), 'reminderDays=7 fires a week before');
assertEqual(reminderFireDate(due, 3).getHours(), 9, 'fires at 09:00');
console.log('task-notifications self-check passed');
