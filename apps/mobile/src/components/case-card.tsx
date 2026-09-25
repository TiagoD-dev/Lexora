import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { StatusBadge } from '@/components/status-badge';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { LegalCase } from '@/types/case';
import { toLocalDate } from '@/utils/deadlines';
import { hashTheme } from '@/utils/palette';
import { priorityTheme } from '@/utils/priority';

type CaseCardProps = { item: LegalCase; onPress: () => void; index?: number };

export function CaseCard({ item, onPress, index = 0 }: CaseCardProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const updatedDate = new Date(item.updatedAt);
  const updated = Number.isNaN(updatedDate.getTime()) ? 'sem data' : new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(updatedDate);
  const icon = hashTheme(colors, item.area || item.id);
  const priority = priorityTheme(colors, item.priority);
  const today = toLocalDate();
  const nextDeadline = [...item.tasks].filter((task) => !task.completed && task.dueDate).sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string))[0];
  const overdue = !!nextDeadline?.dueDate && nextDeadline.dueDate < today;
  const openTasks = item.tasks.filter((task) => !task.completed).length;
  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 35)} style={styles.wrap}>
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topLine}>
        <View style={[styles.icon, { backgroundColor: icon.bg }]}><Icon name="gavel" size={20} color={icon.fg} /></View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text numberOfLines={1} style={styles.reference}>{item.reference}</Text>
            <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}><Text style={[styles.priorityText, { color: priority.fg }]}>{item.priority}</Text></View>
          </View>
          <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
          <Text numberOfLines={1} style={styles.meta}>{item.client} · {item.area}</Text>
          <Text numberOfLines={1} style={styles.meta}>{item.court} · Atualizado {updated}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {nextDeadline ? <View style={[styles.deadline, overdue && styles.deadlineOverdue]}><Icon name={overdue ? 'alert-circle-outline' : 'clock-outline'} size={13} color={overdue ? colors.danger : colors.textMuted} /><Text style={[styles.deadlineText, overdue && styles.deadlineTextOverdue]} numberOfLines={1}>{overdue ? 'Prazo em atraso' : 'Próximo prazo'} · {nextDeadline.title}</Text><Text style={[styles.deadlineDate, overdue && styles.deadlineTextOverdue]}>{new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(new Date(`${nextDeadline.dueDate}T12:00:00`))}</Text></View> : null}
      <View style={styles.footer}><View style={styles.footerItem}><Icon name="file-document-outline" size={13} color={colors.textSoft} /><Text style={styles.footerText}>{item.documents.length} doc{item.documents.length === 1 ? '' : 's'}</Text></View><View style={styles.footerItem}><Icon name="checkbox-marked-circle-outline" size={13} color={colors.textSoft} /><Text style={styles.footerText}>{openTasks} tarefa{openTasks === 1 ? '' : 's'} por concluir</Text></View></View>
    </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 320, flexBasis: 420, flexGrow: 1 },
  card: {
    height: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.75 },
  topLine: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  content: { flex: 1, marginHorizontal: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  reference: { flex: 1, color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  priorityText: { fontSize: 8, fontWeight: '800' },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  meta: { marginTop: 5, color: colors.textSoft, fontSize: 11 },
  deadline: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  deadlineOverdue: { backgroundColor: colors.warningBackground },
  deadlineText: { flex: 1, color: colors.textStrong, fontSize: 10, fontWeight: '700' },
  deadlineDate: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  deadlineTextOverdue: { color: colors.danger },
  footer: { marginTop: 10, flexDirection: 'row', gap: 14 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: colors.textSoft, fontSize: 10, fontWeight: '600' },
});
