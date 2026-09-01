import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type QuickActionProps = {
  symbol: string;
  title: string;
  description: string;
  onPress: () => void;
};

export function QuickAction({ symbol, title, description, onPress }: QuickActionProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}><Text style={styles.symbol}>{symbol}</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 150,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.75 },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  symbol: { color: colors.primary, fontSize: 19, fontWeight: '700' },
  title: { marginTop: 14, color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  description: { marginTop: 5, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
});
