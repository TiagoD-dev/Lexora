import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { StatusBadge } from '@/components/status-badge';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { LegalCase } from '@/types/case';
import { toLocalDate } from '@/utils/deadlines';
import { priorityTheme } from '@/utils/priority';

type CaseCardProps = { item: LegalCase; onPress: () => void; index?: number };
const shortDate = (value: string) => new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`));
const daysUntil = (value: string, today: string) => Math.round((Date.parse(`${value}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86400000);
const relativeDays = (days: number) => days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : days === -1 ? 'Ontem' : days > 0 ? `Em ${days} dias` : `Há ${-days} dias`;

export function CaseCard({ item, onPress, index = 0 }: CaseCardProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const priority = priorityTheme(colors, item.priority);
  const stripe = item.priority === 'Urgente' ? colors.danger : item.priority === 'Alta' ? colors.accent : colors.borderStrong;
  const nextDeadline = [...item.tasks].filter((task) => !task.completed && task.dueDate).sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string))[0];
  const today = toLocalDate();
  const days = nextDeadline?.dueDate ? daysUntil(nextDeadline.dueDate, today) : 0;
  const overdue = !!nextDeadline && days < 0;
  const soon = !!nextDeadline && days >= 0 && days <= 3;
  const openTasks = item.tasks.filter((task) => !task.completed).length;
  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 35)} style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.stripe, { backgroundColor: stripe }]} />
        <View style={styles.topRow}>
          <View style={styles.refGroup}>
            <View style={styles.refChip}><Text numberOfLines={1} style={styles.refText}>{item.reference}</Text></View>
            <Text numberOfLines={1} style={styles.area}>{item.area.toLocaleUpperCase('pt-PT')}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        {item.priority === 'Urgente' || item.priority === 'Alta' ? <View style={[styles.pill, { backgroundColor: priority.bg }]}><Icon name={item.priority === 'Urgente' ? 'fire' : 'arrow-up-bold'} size={12} color={priority.fg} /><Text style={[styles.pillText, { color: priority.fg }]}>{item.priority === 'Urgente' ? 'ALTA URGÊNCIA' : 'PRIORIDADE ALTA'}</Text></View> : null}
        <View style={styles.courtRow}><Icon name="scale-balance" size={14} color={colors.textSoft} /><Text numberOfLines={1} style={styles.court}>{item.court} · {item.client}</Text></View>
        {nextDeadline ? <View style={[styles.deadline, (overdue || soon) && styles.deadlineOverdue]}>
          <Icon name={overdue ? 'bell-alert-outline' : 'clock-outline'} size={18} color={overdue ? colors.danger : colors.textMuted} />
          <View style={styles.deadlineCopy}>
            <View style={styles.deadlineTop}><Text style={[styles.deadlineLabel, overdue && styles.danger]}>{overdue ? 'PRAZO EM ATRASO' : 'PRÓXIMO PRAZO'}</Text><Text style={[styles.deadlineDate, overdue && styles.danger]}>{relativeDays(days)} · {shortDate(nextDeadline.dueDate as string)}</Text></View>
            <Text numberOfLines={2} style={styles.deadlineTitle}>{nextDeadline.title}</Text>
          </View>
        </View> : null}
        <View style={styles.footer}>
          <View style={styles.meta}>
            <View style={styles.metaItem}><Icon name="file-document-outline" size={14} color={colors.textSoft} /><Text style={styles.metaText}>{item.documents.length} {item.documents.length === 1 ? 'doc.' : 'docs'}</Text></View>
            <View style={styles.metaItem}><Icon name="alarm" size={14} color={colors.textSoft} /><Text style={styles.metaText}>{openTasks} {openTasks === 1 ? 'prazo' : 'prazos'}</Text></View>
          </View>
          <View style={styles.open}><Text style={styles.openText}>Abrir Dossier</Text><Icon name="arrow-right" size={14} color={colors.primary} /></View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 280, maxWidth: '100%', flexBasis: 420, flexGrow: 1 },
  card: { height: '100%', gap: 10, overflow: 'hidden', paddingVertical: 15, paddingLeft: 20, paddingRight: 15, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  refGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  refChip: { flexShrink: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.surfaceMuted },
  refText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  area: { flexShrink: 0, color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  title: { color: colors.textStrong, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  courtRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  court: { flex: 1, color: colors.textMuted, fontSize: 12 },
  deadline: { flexDirection: 'row', gap: 10, padding: 11, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  deadlineOverdue: { backgroundColor: colors.warningBackground },
  deadlineCopy: { flex: 1 },
  deadlineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  deadlineLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  deadlineDate: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  deadlineTitle: { marginTop: 2, color: colors.textStrong, fontSize: 13, lineHeight: 18 },
  danger: { color: colors.danger },
  footer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textSoft, fontSize: 11, fontWeight: '600' },
  open: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});
