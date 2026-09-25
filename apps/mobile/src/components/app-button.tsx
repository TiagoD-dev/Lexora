import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'ghost';
  disabled?: boolean;
};

export function AppButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: radius.lg,
  },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '700' },
  primaryLabel: { color: colors.background },
  accentLabel: { color: '#241512' },
  ghostLabel: { color: colors.primary },
});
