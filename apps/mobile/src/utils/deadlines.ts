import type { DeadlineKind, RecurrenceRule } from '@/types/case';

export const DEADLINE_KINDS: DeadlineKind[] = ['Judicial', 'Legal', 'Administrativo', 'Interno'];
export const RECURRENCE_RULES: RecurrenceRule[] = ['Nenhuma', 'Diária', 'Semanal', 'Mensal', 'Anual'];

export const toLocalDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return toLocalDate(date) === value ? date : null;
}

function easterSunday(year: number) {
  const a = year % 19; const b = Math.floor(year / 100); const c = year % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451); const month = Math.floor((h + l - 7 * m + 114) / 31);
  return new Date(year, month - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
}

export function portugueseNationalHoliday(date: Date) {
  const fixed: Record<string, string> = {
    '01-01': 'Ano Novo', '04-25': 'Dia da Liberdade', '05-01': 'Dia do Trabalhador',
    '06-10': 'Dia de Portugal', '08-15': 'Assunção de Nossa Senhora', '10-05': 'Implantação da República',
    '11-01': 'Dia de Todos os Santos', '12-01': 'Restauração da Independência',
    '12-08': 'Imaculada Conceição', '12-25': 'Natal',
  };
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (fixed[key]) return fixed[key];
  const easter = easterSunday(date.getFullYear());
  const offset = Math.round((date.getTime() - easter.getTime()) / 86400000);
  return ({ 0: 'Domingo de Páscoa', '-2': 'Sexta-feira Santa', 60: 'Corpo de Deus' } as Record<number, string>)[offset] ?? null;
}

export function validateDeadline(value: string, kind: DeadlineKind) {
  if (!value) return { valid: true, warnings: [] as string[], suggestedDate: undefined as string | undefined };
  const date = parseLocalDate(value);
  if (!date) return { valid: false, warnings: ['A data não existe ou não está no formato AAAA-MM-DD.'], suggestedDate: undefined };
  const warnings: string[] = [];
  const holiday = portugueseNationalHoliday(date);
  if (date.getDay() === 0 || date.getDay() === 6) warnings.push('A data coincide com um fim de semana.');
  if (holiday) warnings.push(`A data coincide com o feriado nacional “${holiday}”.`);
  let suggestion = new Date(date);
  while (suggestion.getDay() === 0 || suggestion.getDay() === 6 || portugueseNationalHoliday(suggestion)) suggestion.setDate(suggestion.getDate() + 1);
  if (kind === 'Interno' || warnings.length === 0) suggestion = date;
  return { valid: true, warnings, suggestedDate: toLocalDate(suggestion) === value ? undefined : toLocalDate(suggestion) };
}

export function nextOccurrence(value: string, recurrence: RecurrenceRule) {
  const date = parseLocalDate(value);
  if (!date || recurrence === 'Nenhuma') return undefined;
  if (recurrence === 'Diária') date.setDate(date.getDate() + 1);
  if (recurrence === 'Semanal') date.setDate(date.getDate() + 7);
  if (recurrence === 'Mensal') {
    const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + 1);
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  }
  if (recurrence === 'Anual') {
    const day = date.getDate(); const month = date.getMonth(); date.setDate(1); date.setFullYear(date.getFullYear() + 1); date.setMonth(month);
    date.setDate(Math.min(day, new Date(date.getFullYear(), month + 1, 0).getDate()));
  }
  return toLocalDate(date);
}
