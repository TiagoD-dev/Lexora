import type { ThemeColors } from '@/theme';

export function hashTheme(colors: ThemeColors, seed: string) {
  const palette = [
    { bg: colors.primaryLight, fg: colors.primary },
    { bg: colors.warningBackground, fg: colors.warningText },
    { bg: colors.successBackground, fg: colors.successText },
    { bg: colors.surfaceMuted, fg: colors.textStrong },
  ];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  return palette[Math.abs(hash) % palette.length];
}
