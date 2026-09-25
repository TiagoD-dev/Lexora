import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={styles.control}>
      <Text numberOfLines={1} style={styles.value}>{value}</Text><Text style={styles.chevron}>⌄</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable accessibilityViewIsModal style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Fechar ${label}`} style={styles.closeButton} onPress={() => setOpen(false)}><Text style={styles.close}>Fechar</Text></Pressable></View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: option === value }} accessibilityLabel={option} onPress={() => { onChange(option); setOpen(false); }} style={[styles.option, option === value && styles.optionActive]}><Text style={[styles.optionText, option === value && styles.optionTextActive]}>{option}</Text>{option === value && <Text style={styles.check}>✓</Text>}</Pressable>)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: 8 }, label: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  control: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.surface },
  value: { flex: 1, color: colors.textStrong, fontSize: 14 }, chevron: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(5, 12, 25, 0.58)' },
  sheet: { width: '100%', maxWidth: 600, maxHeight: '82%', alignSelf: 'center', padding: 18, borderRadius: radius.xl, backgroundColor: colors.surface },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, closeButton: { minHeight: 44, minWidth: 60, alignItems: 'center', justifyContent: 'center' }, title: { flex: 1, color: colors.textStrong, fontSize: 19, fontWeight: '800' }, close: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionActive: { borderRadius: radius.md, backgroundColor: colors.primaryLight }, optionText: { flex: 1, color: colors.text, fontSize: 13 }, optionTextActive: { color: colors.primary, fontWeight: '800' }, check: { color: colors.primary, fontWeight: '900' },
});
