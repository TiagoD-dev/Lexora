import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

type SettingRowProps = {
  symbol: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
};

export function SettingRow({ symbol, title, description, onPress, danger = false }: SettingRowProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}><Icon name={symbol} size={19} color={danger ? colors.danger : colors.primary} /></View>
      <View style={styles.copy}>
        <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Icon name="chevron-right" size={22} color={colors.textSoft} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  pressed: { opacity: 0.65 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primaryLight },
  copy: { flex: 1, marginHorizontal: 12 },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '600' },
  description: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  danger: { color: colors.danger },
});
