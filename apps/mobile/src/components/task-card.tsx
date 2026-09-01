import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseTask } from '@/types/case';
import { priorityTheme } from '@/utils/priority';

type TaskCardTask = CaseTask & { caseId: string; caseTitle: string; reference: string };

type TaskCardProps = {
  task: TaskCardTask;
  isLate: boolean;
  dateLabel: string;
  onToggle: () => void;
  onPress: () => void;
  onDelete: () => void;
  index?: number;
};

export function TaskCard({ task, isLate, dateLabel, onToggle, onPress, onDelete, index = 0 }: TaskCardProps) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const priority = priorityTheme(colors, task.priority);

  return (
    <Animated.View entering={FadeInDown.duration(240).delay(Math.min(index, 10) * 30)} style={styles.wrap}>
      <View style={[styles.card, task.completed && styles.cardDone]}>
        <View style={[styles.accent, { backgroundColor: priority.fg }, task.completed && styles.accentDone]} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'} onPress={onToggle} style={[styles.check, task.completed && styles.checkDone]}>
          <Text style={[styles.checkText, task.completed && styles.checkTextDone]}>{task.completed ? '✓' : ''}</Text>
        </Pressable>
        <Pressable onPress={onPress} style={styles.body}>
          <Text numberOfLines={1} style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>
          <Text numberOfLines={1} style={styles.caseRef}>{task.reference} · {task.caseTitle}</Text>
          {task.description ? <Text numberOfLines={2} style={styles.description}>{task.description}</Text> : null}
          <View style={styles.badges}>
            <View style={[styles.pill, { backgroundColor: priority.bg }]}><Text style={[styles.pillText, { color: priority.fg }]}>{task.priority}</Text></View>
            <View style={styles.pillNeutral}><Text style={styles.pillNeutralText}>{task.deadlineKind}</Text></View>
            <Text style={[styles.date, isLate && styles.dateLate]}>{isLate ? '⚠ Em atraso · ' : ''}{dateLabel}</Text>
            {task.recurrence !== 'Nenhuma' ? <Text style={styles.recurrence}>↻ {task.recurrence}</Text> : null}
            {task.reminderDays.length ? <Text style={styles.reminder}>◉ {task.reminderDays.length}</Text> : null}
          </View>
        </Pressable>
        <Pressable accessibilityLabel="Eliminar tarefa" onPress={onDelete} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></Pressable>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {},
  card: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15, paddingLeft: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' },
  cardDone: { backgroundColor: colors.surfaceMuted },
  accent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4 },
  accentDone: { backgroundColor: colors.successText },
  check: { width: 30, height: 30, marginTop: 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  checkDone: { borderColor: colors.successText, backgroundColor: colors.successText },
  checkText: { color: colors.background, fontSize: 15, fontWeight: '900' },
  checkTextDone: { color: colors.white },
  body: { flex: 1, gap: 4 },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '800' },
  titleDone: { color: colors.textSoft, textDecorationLine: 'line-through' },
  caseRef: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 9, fontWeight: '800' },
  pillNeutral: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  pillNeutralText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  date: { color: colors.textSoft, fontSize: 10, fontWeight: '600' },
  dateLate: { color: colors.danger, fontWeight: '800' },
  recurrence: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  reminder: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  deleteButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.textSoft, fontSize: 20, fontWeight: '700', lineHeight: 20 },
});
