import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

type SettingRowProps = {
  symbol: string;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
};

export function SettingRow({ symbol, title, description, onPress, danger = false }: SettingRowProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}><Text style={styles.symbol}>{symbol}</Text></View>
      <View style={styles.copy}>
        <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  pressed: { opacity: 0.65 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primaryLight },
  symbol: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  copy: { flex: 1, marginHorizontal: 12 },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '600' },
  description: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  danger: { color: colors.danger },
  chevron: { color: colors.textSoft, fontSize: 24 },
});
