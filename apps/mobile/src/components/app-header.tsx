import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function AppHeader({ eyebrow, title, actionLabel, onActionPress }: AppHeaderProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  copy: { flex: 1 },
  eyebrow: { color: colors.textMuted, fontSize: 13, marginBottom: 2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  actionLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
