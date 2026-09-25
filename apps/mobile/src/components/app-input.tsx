import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type AppInputProps = TextInputProps & {
  label?: string;
};

export function AppInput({ label, style, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, props.multiline && styles.multiline, focused && styles.focused, props.editable === false && styles.disabled, style]}
        {...props}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: colors.textStrong, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  focused: { borderColor: colors.primary },
  disabled: { backgroundColor: colors.surfaceMuted, opacity: 0.65 },
  multiline: { minHeight: 112, paddingTop: 16, textAlignVertical: 'top' },
});
