import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { toLocalDate } from '@/utils/deadlines';

type CalendarTask = { id: string; caseId: string; dueDate?: string; completed: boolean; priority: string };
const week = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function DeadlineCalendar({ tasks, selectedDate, onSelectDate }: { tasks: CalendarTask[]; selectedDate?: string; onSelectDate: (date?: string) => void }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1, 12); });
  const { colors } = useAppTheme(); const styles = makeStyles(colors); const today = toLocalDate();
  const cells = useMemo(() => {
    const leading = (month.getDay() + 6) % 7; const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(leading).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  }, [month]);
  const counts = useMemo(() => tasks.reduce<Record<string, { total: number; urgent: boolean }>>((all, task) => { if (!task.dueDate || task.completed) return all; const current = all[task.dueDate] ?? { total: 0, urgent: false }; all[task.dueDate] = { total: current.total + 1, urgent: current.urgent || task.priority === 'Urgente' }; return all; }, {}), [tasks]);
  const move = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(month);

  return <View style={styles.card}>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>CALENDÁRIO DE PRAZOS</Text><Text style={styles.title}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text></View><View style={styles.controls}><Pressable accessibilityLabel="Mês anterior" onPress={() => move(-1)} style={styles.control}><Text style={styles.controlText}>‹</Text></Pressable><Pressable onPress={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12)); onSelectDate(today); }} style={styles.todayButton}><Text style={styles.todayButtonText}>Hoje</Text></Pressable><Pressable accessibilityLabel="Mês seguinte" onPress={() => move(1)} style={styles.control}><Text style={styles.controlText}>›</Text></Pressable></View></View>
    <View style={styles.grid}>{week.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}{cells.map((day, index) => {
      if (!day) return <View key={`empty-${index}`} style={styles.day} />;
      const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const count = counts[date]; const selected = selectedDate === date;
      return <Pressable accessibilityLabel={`${date}${count ? `, ${count.total} prazos` : ''}`} key={date} onPress={() => onSelectDate(selected ? undefined : date)} style={[styles.day, date === today && styles.dayToday, selected && styles.daySelected]}><Text style={[styles.dayText, date === today && styles.dayTextToday, selected && styles.dayTextSelected]}>{day}</Text>{count ? <View style={[styles.badge, count.urgent && styles.badgeUrgent]}><Text style={styles.badgeText}>{count.total}</Text></View> : null}</Pressable>;
    })}</View>
    <View style={styles.legend}><Text style={styles.legendText}>Toca num dia para filtrar</Text>{selectedDate ? <Pressable onPress={() => onSelectDate(undefined)}><Text style={styles.clear}>Limpar seleção</Text></Pressable> : null}</View>
  </View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }, eyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, title: { marginTop: 3, color: colors.textStrong, fontSize: 17, fontWeight: '900' }, controls: { flexDirection: 'row', alignItems: 'center', gap: 5 }, control: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, controlText: { color: colors.primary, fontSize: 22, fontWeight: '700' }, todayButton: { height: 34, justifyContent: 'center', paddingHorizontal: 11, borderRadius: radius.md, backgroundColor: colors.primaryLight }, todayButtonText: { color: colors.primary, fontSize: 9, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.285%', paddingBottom: 8, color: colors.textSoft, fontSize: 8, fontWeight: '800', textAlign: 'center' }, day: { width: '14.285%', minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.sm }, dayToday: { borderWidth: 1, borderColor: colors.primary }, daySelected: { backgroundColor: colors.primary }, dayText: { color: colors.textStrong, fontSize: 11, fontWeight: '600' }, dayTextToday: { color: colors.primary, fontWeight: '900' }, dayTextSelected: { color: colors.background }, badge: { minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: radius.pill, backgroundColor: colors.primaryLight }, badgeUrgent: { backgroundColor: colors.danger }, badgeText: { color: colors.primary, fontSize: 7, fontWeight: '900' }, legend: { minHeight: 30, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border }, legendText: { color: colors.textSoft, fontSize: 9 }, clear: { color: colors.primary, fontSize: 9, fontWeight: '800' },
});
