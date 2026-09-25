import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

export function FormSection({ step, icon, title, hint, done, children }: { step: number; icon: IconName; title: string; hint?: string; done?: boolean; children: ReactNode }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <View style={styles.card}>
    <View style={styles.head}>
      <View style={[styles.badge, done && styles.badgeDone]}>{done ? <Icon name="check" size={16} color={colors.successText} /> : <Text style={styles.badgeText}>{step}</Text>}</View>
      <View style={styles.headCopy}>
        <View style={styles.titleRow}><Icon name={icon} size={16} color={colors.accent} /><Text style={styles.title}>{title}</Text></View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
    <View style={styles.body}>{children}</View>
  </View>;
}

// Fields side by side on wide screens, stacked on phones.
export function FormRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{Array.isArray(children) ? children.map((child, index) => <View key={index} style={{ flex: 1, minWidth: 220 }}>{child}</View>) : children}</View>;
}

export function ChoiceCard({ icon, title, detail, active, onPress }: { icon: IconName; title: string; detail: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
    <View style={[styles.choiceIcon, active && styles.choiceIconActive]}><Icon name={icon} size={22} color={active ? colors.background : colors.primary} /></View>
    <View style={styles.headCopy}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.hint}>{detail}</Text></View>
    <Icon name={active ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={active ? colors.primary : colors.borderStrong} />
  </Pressable>;
}

export function FormProgress({ done, total, missing }: { done: number; total: number; missing: string[] }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <View style={styles.progress}>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round((done / total) * 100)}%` }]} /></View>
    <Text style={styles.progressText}>{missing.length ? `Falta: ${missing.join(', ')}` : 'Pronto a guardar'}</Text>
  </View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceMuted },
  badge: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  badgeDone: { backgroundColor: colors.successBackground },
  badgeText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  headCopy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.textStrong, fontSize: 15, fontWeight: '800' },
  hint: { marginTop: 2, color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  body: { gap: 16, padding: 18 },
  choice: { flex: 1, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  choiceActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primaryLight },
  choiceIconActive: { backgroundColor: colors.primary },
  choiceTitle: { color: colors.textStrong, fontSize: 14, fontWeight: '800' },
  progress: { gap: 8 },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  progressText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
