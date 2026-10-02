import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { DateField } from '@/components/date-field';
import { FormProgress, FormRow, FormSection } from '@/components/form-section';
import { Icon } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { DeadlineKind, RecurrenceRule, TaskPriority } from '@/types/case';
import { DEADLINE_KINDS, RECURRENCE_RULES, validateDeadline } from '@/utils/deadlines';
import { priorityTheme } from '@/utils/priority';

const priorities: TaskPriority[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];
const reminderOptions = [{ days: 0, label: 'No próprio dia' }, { days: 1, label: '1 dia antes' }, { days: 3, label: '3 dias antes' }, { days: 7, label: '7 dias antes' }];
type TaskDraft = { title: string; description?: string; dueDate?: string; priority: TaskPriority; deadlineKind: DeadlineKind; recurrence: RecurrenceRule; reminderDays: number[] };

export function TaskForm({ initialCaseId, onSubmit }: { initialCaseId?: string; onSubmit: (caseId: string, value: TaskDraft) => void }) {
  const { cases } = useCases();
  const available = cases.filter((item) => item.status !== 'Arquivado' && item.status !== 'Concluído');
  const [caseId, setCaseId] = useState(initialCaseId && available.some((item) => item.id === initialCaseId) ? initialCaseId : available[0]?.id ?? '');
  // Os Casos carregam de forma assíncrona; se o formulário montar antes de chegarem, seleciona um assim que estiverem disponíveis.
  useEffect(() => {
    if (caseId || available.length === 0) return;
    setCaseId(initialCaseId && available.some((item) => item.id === initialCaseId) ? initialCaseId : available[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.length]);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Normal'); const [deadlineKind, setDeadlineKind] = useState<DeadlineKind>('Interno');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('Nenhuma'); const [reminderDays, setReminderDays] = useState<number[]>([1]);
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const selected = available.find((item) => item.id === caseId);
  const validation = validateDeadline(dueDate, deadlineKind);
  const toggleReminder = (days: number) => setReminderDays((current) => current.includes(days) ? current.filter((item) => item !== days) : [...current, days].sort((a, b) => a - b));
  const submit = () => onSubmit(caseId, { title: title.trim(), description: description.trim() || undefined, dueDate: dueDate || undefined, priority, deadlineKind, recurrence, reminderDays });
  const tone = priorityTheme(colors, priority);
  const missing = [!caseId && 'caso', !title.trim() && 'tarefa', recurrence !== 'Nenhuma' && !dueDate && 'data limite', !validation.valid && 'data válida'].filter((item): item is string => !!item);

  return <View style={styles.form}>
    <View style={styles.hero}>
      <View style={[styles.heroIcon, { backgroundColor: tone.bg }]}><Icon name="calendar-clock" size={28} color={tone.fg} /></View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>MOTOR DE PRAZOS</Text>
        <Text numberOfLines={1} style={styles.heroTitle}>{title.trim() || 'Nova tarefa'}</Text>
        <View style={styles.heroMetaRow}>
          <Text numberOfLines={1} style={styles.heroMeta}>{[selected?.reference, deadlineKind, dueDate].filter(Boolean).join(' · ')}</Text>
          <View style={[styles.priorityPill, { backgroundColor: tone.bg }]}><Text style={[styles.priorityText, { color: tone.fg }]}>{priority}</Text></View>
        </View>
        <FormProgress done={3 - missing.length} total={3} missing={missing} />
      </View>
    </View>

    <FormSection step={1} icon="briefcase-outline" title="Caso e tarefa" hint="A que Caso pertence e o que há a fazer." done={!!caseId && !!title.trim()}>
      {selected ? <SelectField label="Caso *" value={`${selected.reference} — ${selected.title}`} options={available.map((item) => `${item.reference} — ${item.title}`)} onChange={(label) => setCaseId(available.find((item) => `${item.reference} — ${item.title}` === label)?.id ?? '')} /> : <Text style={styles.helper}>Não existem Casos ativos aos quais associar a tarefa.</Text>}
      <AppInput label="Tarefa *" value={title} onChangeText={setTitle} placeholder="Ex.: Apresentar contestação" />
      <AppInput label="Descrição" multiline value={description} onChangeText={setDescription} placeholder="Informação, fundamento ou instruções adicionais…" />
    </FormSection>

    <FormSection step={2} icon="calendar-range" title="Prazo" hint="Verificamos fins de semana e feriados nacionais." done={!!dueDate && validation.valid}>
      <FormRow>
        <SelectField label="Natureza do prazo" value={deadlineKind} options={DEADLINE_KINDS} onChange={(value) => setDeadlineKind(value as DeadlineKind)} />
        <SelectField label="Recorrência" value={recurrence} options={RECURRENCE_RULES} onChange={(value) => setRecurrence(value as RecurrenceRule)} />
      </FormRow>
      <DateField label="Data limite" value={dueDate} onChange={setDueDate} />
      {!validation.valid ? <Text style={styles.error}>{validation.warnings[0]}</Text> : validation.warnings.length ? <View style={styles.warning}><Text style={styles.warningTitle}>Atenção ao calendário</Text>{validation.warnings.map((warning) => <Text key={warning} style={styles.warningText}>• {warning}</Text>)}{validation.suggestedDate ? <Pressable onPress={() => setDueDate(validation.suggestedDate!)}><Text style={styles.suggestion}>Usar o dia útil seguinte: {validation.suggestedDate}</Text></Pressable> : null}</View> : <Text style={styles.helper}>As verificações de calendário são auxiliares; confirma sempre no regime jurídico aplicável.</Text>}
    </FormSection>

    <FormSection step={3} icon="bell-ring-outline" title="Prioridade e alertas" hint="Quando queres ser avisado." done={reminderDays.length > 0}>
      <View style={styles.field}><Text style={styles.label}>Prioridade</Text><View style={styles.chips}>{priorities.map((item) => { const itemTone = priorityTheme(colors, item); const active = priority === item; return <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setPriority(item)} style={[styles.chip, active && { borderColor: itemTone.fg, backgroundColor: itemTone.bg }]}><Text style={[styles.chipText, active && { color: itemTone.fg, fontWeight: '800' }]}>{item}</Text></Pressable>; })}</View></View>
      <View style={styles.field}>
        <Text style={styles.label}>Notificar</Text><View style={styles.chips}>{reminderOptions.map((item) => <Chip key={item.days} label={item.label} selected={reminderDays.includes(item.days)} onPress={() => toggleReminder(item.days)} styles={styles} />)}</View>
        <Text style={styles.reminderNote}>{reminderDays.length ? `${reminderDays.length} alerta${reminderDays.length === 1 ? '' : 's'} interno${reminderDays.length === 1 ? '' : 's'} configurado${reminderDays.length === 1 ? '' : 's'}.` : 'Sem alertas configurados.'}</Text>
      </View>
    </FormSection>

    <AppButton disabled={missing.length > 0} onPress={submit}>Criar tarefa e prazo</AppButton>
  </View>;
}

function Chip({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles> }) { return <Pressable onPress={onPress} style={[styles.chip, selected && styles.active]}><Text style={[styles.chipText, selected && styles.activeText]}>{selected ? '✓ ' : ''}{label}</Text></Pressable>; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, borderLeftColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.surface },
  heroIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroMeta: { flexShrink: 1, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  priorityPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: 11, fontWeight: '800' },
  field: { gap: 8 },
  label: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  active: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  activeText: { color: colors.background },
  warning: { gap: 5, padding: 13, borderRadius: radius.md, backgroundColor: colors.warningBackground },
  warningTitle: { color: colors.warningText, fontSize: 12, fontWeight: '900' },
  warningText: { color: colors.warningText, fontSize: 12 },
  suggestion: { marginTop: 4, color: colors.primary, fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
  reminderNote: { color: colors.textSoft, fontSize: 11 },
});
