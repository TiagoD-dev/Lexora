import { createElement, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { parseLocalDate, toLocalDate, validateDeadline } from '@/utils/deadlines';

type AgendaTask = { id: string; title: string; dueDate?: string; priority: 'Baixa' | 'Normal' | 'Alta' | 'Urgente'; deadlineKind: Parameters<typeof validateDeadline>[1]; completed: boolean };
type AgendaCase = { id: string; title: string; tasks: AgendaTask[] };
type AgendaItem = { caseId: string; caseTitle: string; task: AgendaTask };
type AgendaGroup = { id: 'overdue' | 'today' | 'upcoming'; title: string; items: AgendaItem[] };
type Props = { cases: AgendaCase[]; toggleTask: (caseId: string, taskId: string) => void; updateTask: (caseId: string, taskId: string, patch: { dueDate?: string }) => void };
const priorityOrder = { Urgente: 0, Alta: 1, Normal: 2, Baixa: 3 };
export function buildAgenda(cases: AgendaCase[], now = new Date()): AgendaGroup[] {
  const today = toLocalDate(now);
  const end = new Date(now); end.setDate(end.getDate() + 7);
  const lastDay = toLocalDate(end);
  const groups: AgendaGroup[] = [{ id: 'overdue', title: 'Em atraso', items: [] }, { id: 'today', title: 'Hoje', items: [] }, { id: 'upcoming', title: 'Próximos 7 dias', items: [] }];
  for (const item of cases) for (const task of item.tasks) {
    const date = task.dueDate;
    if (task.completed || !date || !parseLocalDate(date) || date > lastDay) continue;
    const group = date < today ? groups[0] : date === today ? groups[1] : groups[2];
    group.items.push({ caseId: item.id, caseTitle: item.title, task });
  }
  for (const group of groups) group.items.sort((a, b) => (a.task.dueDate ?? '').localeCompare(b.task.dueDate ?? '') || priorityOrder[a.task.priority] - priorityOrder[b.task.priority] || a.task.title.localeCompare(b.task.title, 'pt'));
  return groups;
}
function displayDate(value?: string) {
  const date = value ? parseLocalDate(value) : null;
  return date ? date.toLocaleDateString('pt-PT') : '';
}
export function PriorityAgenda({ cases, toggleTask, updateTask }: Props) {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const groups = buildAgenda(cases);
  const [selected, setSelected] = useState<AgendaItem | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const validation = useMemo(() => selected ? validateDeadline(dueDate, selected.task.deadlineKind) : null, [dueDate, selected]);
  const canSave = !!dueDate && !!validation?.valid;
  const close = () => { setSelected(null); setShowPicker(false); };
  const save = () => { if (!selected || !canSave) return; updateTask(selected.caseId, selected.task.id, { dueDate }); close(); };
  const pending = groups.reduce((sum, group) => sum + group.items.length, 0);
  return <View style={styles.section}>
    <View style={styles.header}><View style={styles.titleRow}><Icon name="bell-alert-outline" size={18} color={colors.danger} /><Text style={[styles.heading, { color: colors.textStrong }]}>Prazos e diligências</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/tasks')} style={styles.button}><Text style={[styles.buttonText, { color: colors.primary }]}>{pending ? `${pending} pendentes` : 'Ver tarefas'}</Text></Pressable></View>
    {groups.every(group => group.items.length === 0) && <Text style={[styles.empty, { color: colors.textMuted }]}>Sem tarefas em atraso ou com prazo nos próximos 7 dias.</Text>}
    {groups.filter(group => group.items.length > 0).map(group => <View key={group.id} style={styles.group}>
      <Text style={[styles.groupTitle, { color: group.id === 'overdue' ? colors.danger : colors.textStrong }]}>{group.title} · {group.items.length}</Text>
      <View style={styles.grid}>
        {group.items.map(item => <View key={`${item.caseId}:${item.task.id}`} style={[styles.task, group.id === 'upcoming' ? { borderColor: colors.border, backgroundColor: colors.surface } : { borderColor: colors.danger, backgroundColor: colors.warningBackground }]}>
          <View style={[styles.stripe, { backgroundColor: group.id === 'upcoming' ? colors.accent : colors.danger }]} />
          <Text style={[styles.badge, { color: group.id === 'upcoming' ? colors.textMuted : colors.danger }]}>{group.id === 'overdue' ? 'EM ATRASO' : group.id === 'today' ? 'PRAZO FATAL HOJE' : `EM ${displayDate(item.task.dueDate)}`}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Abrir tarefa ${item.task.title} no caso ${item.caseTitle}`} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.caseId, panel: 'tasks', focusId: item.task.id } })} style={styles.taskLink}>
            <Text numberOfLines={2} style={[styles.taskTitle, { color: colors.textStrong }]}>{item.task.title}</Text>
            <Text numberOfLines={1} style={[styles.meta, { color: colors.textMuted }]}>{item.caseTitle}</Text>
            <Text numberOfLines={1} style={[styles.meta, { color: group.id === 'overdue' ? colors.danger : colors.textMuted }]}>{displayDate(item.task.dueDate)} · {item.task.priority}</Text>
          </Pressable>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Concluir ${item.task.title}`} onPress={() => toggleTask(item.caseId, item.task.id)} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.background }]}>Concluir</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Reagendar ${item.task.title}`} onPress={() => { setDueDate(item.task.dueDate ?? toLocalDate()); setSelected(item); }} style={[styles.button, { borderWidth: 1, borderColor: colors.borderStrong }]}><Text style={[styles.buttonText, { color: colors.textStrong }]}>Reagendar</Text></Pressable>
          </View>
        </View>)}
      </View>
    </View>)}
    <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={[styles.modal, { backgroundColor: colors.surface }]}><ScrollView keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: colors.textStrong }]}>Reagendar tarefa</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>{selected?.task.title}</Text>
        <Text style={[styles.label, { color: colors.textStrong }]}>Nova data</Text>
        {Platform.OS === 'web'
          ? createElement('input', {
              type: 'date', value: dueDate, onChange: (event: { target: { value: string } }) => setDueDate(event.target.value),
              style: { border: `1px solid ${colors.borderStrong}`, borderRadius: 10, height: 48, paddingLeft: 12, paddingRight: 12,
                fontSize: 16, background: colors.surfaceMuted, color: colors.textStrong, colorScheme: isDark ? 'dark' : 'light',
                width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
            })
          : Platform.OS === 'android' ? <>
            <Pressable accessibilityRole="button" onPress={() => setShowPicker(true)} style={[styles.input, styles.dateButton, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted }]}>
              <Text style={{ color: colors.textStrong, fontSize: 16 }}>{dueDate ? displayDate(dueDate) : 'Escolher data'}</Text>
            </Pressable>
            {showPicker && <DateTimePicker value={parseLocalDate(dueDate) ?? new Date()} mode="date" display="default"
              onChange={(_event, date) => { setShowPicker(false); if (date) setDueDate(toLocalDate(date)); }} />}
          </> : <DateTimePicker value={parseLocalDate(dueDate) ?? new Date()} mode="date" display="inline"
            themeVariant={isDark ? 'dark' : 'light'} accentColor={colors.primary}
            onChange={(_event, date) => { if (date) setDueDate(toLocalDate(date)); }} />}
        {!canSave && <Text accessibilityRole="alert" style={[styles.warning, { color: colors.danger }]}>Introduz uma data válida no formato AAAA-MM-DD.</Text>}
        {validation?.warnings.map((warning, index) => <Text key={`${index}:${warning}`} accessibilityRole="alert" style={[styles.warning, { backgroundColor: colors.warningBackground, color: colors.warningText }]}>{warning}</Text>)}
        {validation?.suggestedDate && validation.suggestedDate !== dueDate && <Pressable accessibilityRole="button" onPress={() => setDueDate(validation.suggestedDate!)} style={[styles.button, { backgroundColor: colors.surfaceMuted, marginTop: 8 }]}><Text style={[styles.buttonText, { color: colors.textStrong }]}>Usar {displayDate(validation.suggestedDate)}</Text></Pressable>}
        <View style={[styles.actions, { marginTop: 20 }]}>
          <Pressable accessibilityRole="button" onPress={close} style={[styles.button, { borderWidth: 1, borderColor: colors.borderStrong }]}><Text style={[styles.buttonText, { color: colors.textStrong }]}>Cancelar</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={save} style={[styles.button, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.45 }]}><Text style={[styles.buttonText, { color: colors.background }]}>Guardar data</Text></Pressable>
        </View>
      </ScrollView></View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 6, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 }, badge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 17, fontWeight: '800' }, subtitle: { fontSize: 13, lineHeight: 20 }, empty: { fontSize: 14, lineHeight: 21, paddingVertical: 16 },
  group: { gap: 8, marginTop: 16 }, groupTitle: { fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  task: { flexGrow: 1, flexBasis: 240, minWidth: 220, maxWidth: '100%', overflow: 'hidden', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingRight: 12, paddingLeft: 17, gap: 8 },
  taskLink: { gap: 3 }, taskTitle: { fontSize: 14, lineHeight: 19, fontWeight: '600' }, meta: { fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, button: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 12, lineHeight: 16, fontWeight: '600' }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 460, maxHeight: '90%', padding: 20, borderRadius: 16 }, label: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, minHeight: 48, paddingHorizontal: 12, fontSize: 16 }, warning: { fontSize: 13, lineHeight: 20, marginTop: 8, padding: 8, borderRadius: 8 },
  dateButton: { justifyContent: 'center' },
});
