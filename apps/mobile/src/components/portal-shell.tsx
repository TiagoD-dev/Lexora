import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { Icon, type IconName } from './icon';

export function PortalShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 16 }}>
        <View style={{ gap: 5, paddingTop: 4 }}>
          <View style={styles.row}><Icon name="shield-account-outline" size={15} color={colors.accent} /><Text style={styles.eyebrow}>LEXORA · PORTAL DO CLIENTE</Text></View>
          <Text accessibilityRole="header" style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{title}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{subtitle}</Text>
        </View>
        {children}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function PortalError({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return message ? <View style={[makeStyles(colors).row, { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.danger, borderWidth: 1, borderRadius: radius.md, padding: 14 }]}>
    <Icon name="alert-circle-outline" size={18} color={colors.danger} />
    <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ flex: 1, color: colors.danger, lineHeight: 21 }}>{message}</Text>
  </View> : null;
}

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

export function Chip({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { colors } = useAppTheme();
  const [background, color] = { success: [colors.successBackground, colors.successText], warning: [colors.warningBackground, colors.warningText], danger: [colors.primaryLight, colors.danger], neutral: [colors.surfaceMuted, colors.textMuted], primary: [colors.primaryLight, colors.primary] }[tone];
  return <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: background }}>
    {icon ? <Icon name={icon} size={13} color={color} /> : null}<Text style={{ color, fontSize: 11, fontWeight: '800' }}>{label}</Text>
  </View>;
}

export function Card({ children, highlight = false }: { children: ReactNode; highlight?: boolean }) {
  const { colors } = useAppTheme();
  return <View style={{ gap: 12, padding: 16, borderWidth: 1, borderRadius: radius.xl, borderColor: highlight ? colors.primary : colors.border, backgroundColor: colors.surface }}>{children}</View>;
}

export function SectionTitle({ title, icon, children }: { title: string; icon: IconName; children?: ReactNode }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8 }]}>
    <View style={styles.row}><Icon name={icon} size={18} color={colors.primary} /><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{title}</Text></View>{children}
  </View>;
}

export function IconBox({ icon, tone = 'primary' }: { icon: IconName; tone?: 'primary' | 'warning' | 'success' }) {
  const { colors } = useAppTheme();
  const [background, color] = tone === 'warning' ? [colors.warningBackground, colors.warningText] : tone === 'success' ? [colors.successBackground, colors.successText] : [colors.primaryLight, colors.primary];
  return <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: background }}><Icon name={icon} size={20} color={color} /></View>;
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { colors } = useAppTheme();
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-PT') || '?';
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderRadius: size / 2, backgroundColor: colors.primary }}><Text style={{ color: colors.white, fontSize: size * 0.36, fontWeight: '800' }}>{initials}</Text></View>;
}

export function InfoRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={makeStyles(colors).row}><Icon name={icon} size={16} color={colors.textMuted} /><Text style={{ flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{children}</Text></View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: colors.accent, fontWeight: '800', letterSpacing: 1.4, fontSize: 12 },
});
