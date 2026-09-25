import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type EmptyStateProps = { symbol: IconName; title: string; description: string };

export function EmptyState({ symbol, title, description }: EmptyStateProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Icon name={symbol} size={26} color={colors.primary} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },
  title: { marginTop: 18, color: colors.text, fontSize: 18, fontWeight: '700' },
  description: {
    maxWidth: 320,
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
