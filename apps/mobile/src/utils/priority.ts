import type { ThemeColors } from '@/theme';
import type { CasePriority } from '@/types/case';

export function priorityTheme(colors: ThemeColors, priority: CasePriority) {
  if (priority === 'Urgente') return { bg: colors.warningBackground, fg: colors.danger };
  if (priority === 'Alta') return { bg: colors.warningBackground, fg: colors.warningText };
  if (priority === 'Baixa') return { bg: colors.surfaceMuted, fg: colors.textMuted };
  return { bg: colors.primaryLight, fg: colors.primary };
}
