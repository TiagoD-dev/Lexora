import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, actionLabel, onActionPress, showBack = true }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme(); const styles = makeStyles(colors);

  return (
    <View style={styles.header}>
      {showBack ? <Pressable accessibilityLabel="Voltar" accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable> : null}
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
       ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.primary, fontSize: 36, lineHeight: 38, fontWeight: '400' },
  copy: { flex: 1, minWidth: 0, paddingVertical: 10 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 2, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  action: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
