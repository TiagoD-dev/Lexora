import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

export const navigationIcons: Record<string, IconName> = {
  fees: 'cash-multiple', 'client-portal': 'account-network-outline', workflows: 'sitemap-outline', intake: 'account-plus-outline',
  home: 'view-dashboard-outline', clients: 'account-group-outline', cases: 'gavel', tasks: 'calendar-check-outline', documents: 'folder-open-outline',
  assistant: 'robot-outline', sources: 'book-open-page-variant-outline', alerts: 'newspaper-variant-outline', profile: 'cog-outline', more: 'dots-horizontal-circle-outline',
};
const destinations = [
  { name: 'home', label: 'Hoje' }, { name: 'cases', label: 'Casos' }, { name: 'assistant', label: 'IA' },
  { name: 'tasks', label: 'Prazos' }, { name: 'documents', label: 'Docs' },
] as const;
type Props = { routeName: string; onNavigate: (name: string) => void; onMore: () => void };

export function MobileNavigation({ routeName, onNavigate, onMore }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const section = routeName.split('/')[0];
  const active = ['home', 'cases', 'assistant', 'tasks', 'documents'].includes(section) ? section : '';
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {destinations.map(({ name, label }) => (
        <Pressable key={name} accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: active === name }}
          onPress={() => onNavigate(name)}
          style={({ pressed }) => [styles.item, active === name && styles.active, pressed && styles.pressed]}>
          {name === 'assistant' ? <View style={styles.ia}><Icon name="creation" size={19} color={colors.white} /></View> : <Icon name={navigationIcons[name]} size={22} color={active === name ? colors.primary : colors.textMuted} />}
          <Text style={[styles.label, active === name && styles.activeText]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  bar: { flexDirection: 'row', gap: 4, paddingTop: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  item: { flex: 1, minHeight: 54, minWidth: 44, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12 },
  active: { backgroundColor: colors.primaryLight }, pressed: { opacity: 0.7 },
  ia: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.accent },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  activeText: { color: colors.primary, fontWeight: '800' },
});


