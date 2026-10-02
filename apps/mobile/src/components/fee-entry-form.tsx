import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, euros } from '@/components/business-preview';
import { DateField } from '@/components/date-field';
import { Icon, type IconName } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import type { NewFeeEntry } from '@/services/fees-service';
import { radius, type ThemeColors } from '@/theme';
import { parseLocalDate, toLocalDate } from '@/utils/deadlines';

export const KINDS = ['Tempo', 'Honorário fixo', 'Avença', 'Despesa'] as const;
export type Kind = typeof KINDS[number];
export const KIND_ICON: Record<Kind, IconName> = { Tempo: 'clock-outline', 'Honorário fixo': 'file-document-outline', Avença: 'calendar-sync-outline', Despesa: 'receipt-text-outline' };
export const inDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return toLocalDate(date); };
export const formatHours = (hours: number) => `${String(Math.round(hours * 100) / 100).replace('.', ',')} h`;

const HINTS: Record<Kind, string[]> = {
  Tempo: ['Consulta jurídica', 'Análise documental', 'Reunião com cliente', 'Presença em audiência', 'Redação de peça processual'],
  'Honorário fixo': ['Elaboração de contrato', 'Parecer jurídico', 'Constituição de sociedade', 'Processo de divórcio por mútuo consentimento'],
  Avença: ['Avença mensal de assessoria', 'Avença trimestral'],
  Despesa: ['Taxa de justiça', 'Certidões', 'Deslocação', 'Custas de registo', 'Portes e correio'],
};
const VAT = { 'IVA 23%': 0.23, 'Sem IVA': 0, Isento: 0 } as const;
type Vat = keyof typeof VAT;
const OTHER = 'Outro (escrever)';
const parse = (text: string) => Number(text.replace(',', '.'));

/** Formulário de honorários; com `caseId` abre já nesse caso (usado em «Registar horas» na ficha do caso). */
export function FeeEntryForm({ caseId, onSave, onCancel }: { caseId?: string; onSave: (entry: NewFeeEntry) => void; onCancel: () => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const { cases } = useCases();
  const active = cases.filter(item => item.status !== 'Arquivado' || item.id === caseId);
  const caseOptions = [...active.map(item => `${item.client} · ${item.title}`), OTHER];
  const [kind, setKind] = useState<Kind>('Tempo');
  const [caseLabel, setCaseLabel] = useState(caseOptions[Math.max(0, active.findIndex(item => item.id === caseId))]!);
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('1');
  const [workDate, setWorkDate] = useState(toLocalDate());
  const [vat, setVat] = useState<Vat>('IVA 23%');
  const [dueDate, setDueDate] = useState(inDays(30));
  const chooseKind = (next: Kind) => { setKind(next); setVat(next === 'Despesa' ? 'Isento' : 'IVA 23%'); if (HINTS[kind].includes(description)) setDescription(''); };
  const who = caseLabel === OTHER ? client.trim() : caseLabel;
  const value = parse(amount); const duration = parse(hours);
  const isTime = kind === 'Tempo';
  const subtotal = isTime ? value * duration : value;
  const tax = Math.round(subtotal * VAT[vat] * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const missing = [!who && 'cliente', !description.trim() && 'descrição', !(value > 0 && (!isTime || duration > 0)) && 'valor', isTime && !parseLocalDate(workDate) && 'data do trabalho', !parseLocalDate(dueDate) && 'vencimento'].filter(Boolean);
  const submit = () => { if (missing.length) return; onSave({ caseId: active[caseOptions.indexOf(caseLabel)]?.id ?? null, client: who, description: isTime ? `${description.trim()} · ${formatHours(duration)}` : description.trim(), amount: total, hours: isTime ? duration : null, workDate: isTime ? workDate : null, vat, kind, dueDate }); };
  return <View style={styles.form}>
    <View style={styles.formHead}><View style={styles.formIcon}><Icon name="cash-register" size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.formTitle}>Novo registo</Text><Text style={styles.entryMeta}>Trabalho, avença ou despesa a cobrar ao cliente.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onCancel} hitSlop={10}><Icon name="close" size={22} color={colors.textMuted} /></Pressable></View>

    <Step n={1} title="Tipo de registo" styles={styles} />
    <View style={styles.kindPicker}>{KINDS.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === kind }} onPress={() => chooseKind(item)} style={[styles.kindOption, item === kind && styles.kindOptionActive]}><Icon name={KIND_ICON[item]} size={22} color={item === kind ? colors.primary : colors.textMuted} /><Text style={[styles.kindOptionText, item === kind && { color: colors.primary }]}>{item}</Text></Pressable>)}</View>

    <Step n={2} title="Cliente e processo" styles={styles} />
    <SelectField label="Caso" value={caseLabel} options={caseOptions} onChange={setCaseLabel} />
    {caseLabel === OTHER && <AppInput label="Cliente / assunto" value={client} onChangeText={setClient} placeholder="Ex.: Ana Martins · Consulta avulsa" />}

    <Step n={3} title={kind === 'Despesa' ? 'Despesa' : 'Trabalho realizado'} styles={styles} />
    <AppInput label="Descrição" value={description} onChangeText={setDescription} placeholder={kind === 'Despesa' ? 'Ex.: Taxa de justiça' : 'Ex.: Análise documental'} />
    <View style={styles.hints}>{HINTS[kind].map(hint => <Pressable key={hint} accessibilityRole="button" onPress={() => setDescription(hint)} style={[styles.hint, description === hint && styles.hintActive]}><Text style={[styles.hintText, description === hint && { color: colors.primary }]}>{hint}</Text></Pressable>)}</View>
    {isTime && <DateField label="Data do trabalho" value={workDate} onChange={setWorkDate} />}

    <Step n={4} title="Valor e vencimento" styles={styles} />
    <View style={styles.columns}>
      <View style={styles.column}><AppInput label={isTime ? 'Valor por hora (€)' : kind === 'Avença' ? 'Valor da avença (€)' : 'Valor (€)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0,00" /></View>
      {isTime && <View style={styles.column}><AppInput label="Horas" keyboardType="decimal-pad" value={hours} onChangeText={setHours} /><View style={styles.hints}>{['0,25', '0,5', '1', '2', '4'].map(item => <Pressable key={item} accessibilityRole="button" onPress={() => setHours(item)} style={[styles.hint, hours === item && styles.hintActive]}><Text style={[styles.hintText, hours === item && { color: colors.primary }]}>{item} h</Text></Pressable>)}</View></View>}
    </View>
    <Choices values={Object.keys(VAT) as Vat[]} value={vat} onChange={setVat} />
    <DateField label="Data de vencimento" value={dueDate} onChange={setDueDate} />
    <View style={styles.hints}>{[15, 30, 60].map(days => <Pressable key={days} accessibilityRole="button" onPress={() => setDueDate(inDays(days))} style={[styles.hint, dueDate === inDays(days) && styles.hintActive]}><Text style={[styles.hintText, dueDate === inDays(days) && { color: colors.primary }]}>A {days} dias</Text></Pressable>)}</View>

    <View style={styles.summary}>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{isTime && value > 0 && duration > 0 ? `${euros(value)} × ${formatHours(duration)}` : 'Subtotal'}</Text><Text style={styles.summaryValue}>{subtotal > 0 ? euros(subtotal) : '—'}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{vat === 'Isento' ? 'IVA (isento)' : vat}</Text><Text style={styles.summaryValue}>{subtotal > 0 ? euros(tax) : '—'}</Text></View>
      <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.totalLabel}>TOTAL A COBRAR</Text><Text style={styles.totalValue}>{subtotal > 0 ? euros(total) : '—'}</Text></View>
    </View>
    {missing.length > 0 && <Copy>Falta preencher: {missing.join(', ')}.</Copy>}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: missing.length > 0 }} disabled={missing.length > 0} onPress={submit} style={[styles.submit, missing.length > 0 && { opacity: 0.45 }]}><Icon name="check" size={18} color={colors.white} /><Text style={styles.submitText}>Adicionar registo</Text></Pressable>
  </View>;
}

function Step({ n, title, styles }: { n: number; title: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.step}><Text style={styles.stepNumber}>{n}</Text><Text style={styles.stepTitle}>{title}</Text></View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 14, padding: 20, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.xl, backgroundColor: colors.surface },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, formIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.warningBackground },
  formTitle: { color: colors.textStrong, fontSize: 19, fontWeight: '900' }, entryMeta: { marginTop: 2, color: colors.textMuted, fontSize: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  stepNumber: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '900', color: colors.white, backgroundColor: '#7A1620' },
  stepTitle: { color: colors.textStrong, fontSize: 14, fontWeight: '900' },
  hints: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, hint: { paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.background },
  hintActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, hintText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  summary: { gap: 8, padding: 16, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: colors.textMuted, fontSize: 13 }, summaryValue: { color: colors.textStrong, fontSize: 14, fontWeight: '800' }, summaryTotal: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderStrong },
  totalLabel: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, totalValue: { color: colors.textStrong, fontSize: 26, fontWeight: '900' },
  submit: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, backgroundColor: '#7A1620' }, submitText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  kindPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindOption: { flexGrow: 1, flexBasis: 120, alignItems: 'center', gap: 6, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  kindOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, kindOptionText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, column: { flexGrow: 1, flexBasis: 160 },
});
