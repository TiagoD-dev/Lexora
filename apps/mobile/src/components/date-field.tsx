import { createElement, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppInput } from '@/components/app-input';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius } from '@/theme';
import { parseLocalDate, toLocalDate } from '@/utils/deadlines';

type Props = { label?: string; value: string; onChange: (value: string) => void; placeholder?: string };

/** Campo de data AAAA-MM-DD: texto livre + calendário nativo (web usa <input type="date">). */
export function DateField({ label, value, onChange, placeholder = 'AAAA-MM-DD' }: Props) {
  const { colors, isDark } = useAppTheme();
  const [open, setOpen] = useState(false);
  if (Platform.OS === 'web') return <View style={styles.wrapper}>
    {label ? <Text style={[styles.label, { color: colors.textStrong }]}>{label}</Text> : null}
    {createElement('input', {
      type: 'date', value, 'aria-label': label ?? placeholder, onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: { border: `1px solid ${colors.borderStrong}`, borderRadius: radius.md, minHeight: 52, paddingLeft: 16, paddingRight: 16,
        fontSize: 16, background: colors.surface, color: colors.text, colorScheme: isDark ? 'dark' : 'light',
        width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
    })}
  </View>;
  return <View style={styles.wrapper}>
    <View style={styles.row}>
      <View style={styles.input}><AppInput autoCapitalize="none" inputMode="numeric" maxLength={10} label={label} value={value} onChangeText={onChange} placeholder={placeholder} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir calendário" onPress={() => setOpen(!open)} style={[styles.button, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
        <Icon name="calendar-month-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
    {open && <DateTimePicker value={parseLocalDate(value) ?? new Date()} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'}
      themeVariant={isDark ? 'dark' : 'light'} accentColor={colors.primary}
      onChange={(event, date) => { if (Platform.OS === 'android' || event.type === 'dismissed') setOpen(false); if (date && event.type !== 'dismissed') onChange(toLocalDate(date)); }} />}
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 }, label: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, input: { flex: 1 },
  button: { width: 52, height: 52, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
