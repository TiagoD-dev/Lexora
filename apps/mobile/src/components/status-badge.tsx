import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseStatus } from '@/types/case';

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const tone = status === 'Concluído' ? 'success' : status === 'Em análise' ? 'warning' : 'neutral';

  return (
    <View style={[styles.badge, styles[`${tone}Badge`]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{status}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill },
  text: { fontSize: 10, fontWeight: '700' },
  successBadge: { backgroundColor: colors.successBackground },
  successText: { color: colors.successText },
  warningBadge: { backgroundColor: colors.warningBackground },
  warningText: { color: colors.warningText },
  neutralBadge: { backgroundColor: colors.surfaceMuted },
  neutralText: { color: colors.textMuted },
});
