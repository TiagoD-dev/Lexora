import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, euros, Feedback, Hero, Panel, PreviewPage, Stat } from '@/components/business-preview';
import { DateField } from '@/components/date-field';
import { SelectField } from '@/components/select-field';
import { useCases } from '@/providers/cases-provider';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { parseLocalDate, toLocalDate } from '@/utils/deadlines';
import { createFeeRemote, deleteFeeRemote, listFeesRemote, updateFeeRemote, type FeeEntry, type NewFeeEntry } from '@/services/fees-service';

const KINDS = ['Tempo', 'Honorário fixo', 'Avença', 'Despesa'] as const;
type Kind = typeof KINDS[number];
const KIND_ICON: Record<Kind, IconName> = { Tempo: 'clock-outline', 'Honorário fixo': 'file-document-outline', Avença: 'calendar-sync-outline', Despesa: 'receipt-text-outline' };
type Entry = FeeEntry & { kind: Kind };
const inDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return toLocalDate(date); };
const daysUntil = (date: string) => Math.round(((parseLocalDate(date)?.getTime() ?? Date.now()) - (parseLocalDate(toLocalDate())?.getTime() ?? Date.now())) / 86400000);
const FILTERS = ['Todos', 'Por receber', 'Em atraso', 'Recebidos'] as const;

export default function FeesPage() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Todos');
  const [editing, setEditing] = useState(false);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const fail = (error: unknown) => setFeedback(error instanceof Error ? error.message : 'Não foi possível contactar o servidor.');
  useEffect(() => { listFeesRemote().then(list => setEntries(list as Entry[])).catch(fail).finally(() => setLoading(false)); }, []);
  const sum = (list: Entry[]) => list.reduce((acc, entry) => acc + entry.amount, 0);
  const open = entries.filter(entry => !entry.paid);
  const overdue = open.filter(entry => daysUntil(entry.dueDate) < 0);
  const received = sum(entries.filter(entry => entry.paid));
  const registered = sum(entries);
  const share = registered ? Math.round(received / registered * 100) : 0;
  const visible = entries.filter(entry => filter === 'Todos' || (filter === 'Recebidos' ? entry.paid : filter === 'Em atraso' ? overdue.includes(entry) : !entry.paid)).sort((a, b) => Number(a.paid) - Number(b.paid) || a.dueDate.localeCompare(b.dueDate));
  async function save(entry: NewFeeEntry) {
    try {
      const created = await createFeeRemote(entry) as Entry;
      setEntries(current => [...current, created]);
      setEditing(false); setFilter('Todos');
      setFeedback('Registo guardado. Não foi emitida uma fatura.');
    } catch (error) { fail(error); }
  }
  async function togglePaid(entry: Entry) {
    try {
      const updated = await updateFeeRemote(entry.id, { paid: !entry.paid }) as Entry;
      setEntries(current => current.map(item => item.id === entry.id ? updated : item)); setReminderId(null); setFeedback('Estado atualizado.');
    } catch (error) { fail(error); }
  }
  async function remove(entry: Entry) {
    try {
      await deleteFeeRemote(entry.id);
      setEntries(current => current.filter(item => item.id !== entry.id)); setFeedback('Registo eliminado.');
    } catch (error) { fail(error); }
  }
  return <PreviewPage title="Honorários e cobranças" subtitle="Do trabalho realizado ao valor recebido. Acompanha os honorários do escritório num só lugar.">
    <Hero label="POR RECEBER" value={euros(sum(open))} caption={`${open.length} ${open.length === 1 ? 'valor em aberto' : 'valores em aberto'}${overdue.length ? ` · ${overdue.length} em atraso (${euros(sum(overdue))})` : ''}`}>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${share}%` }]} /></View>
      <Text style={styles.progressText}>{share}% do total registado já foi recebido</Text>
      <View style={styles.stats}><Stat label="Recebido" value={euros(received)} /><Stat label="Total registado" value={euros(registered)} /></View>
      <Pressable accessibilityRole="button" onPress={() => setEditing(!editing)} style={styles.heroButton}><Icon name={editing ? 'close' : 'plus'} size={18} color="#3D1319" /><Text style={styles.heroButtonText}>{editing ? 'Fechar formulário' : 'Registar trabalho ou despesa'}</Text></Pressable>
    </Hero>
    {editing && <EntryForm onSave={save} onCancel={() => setEditing(false)} />}

    <View style={styles.kinds}>{KINDS.map(item => <View key={item} style={styles.kindTile}><View style={styles.kindIcon}><Icon name={KIND_ICON[item]} size={18} color={colors.primary} /></View><Text style={styles.kindLabel}>{item}</Text><Text style={styles.kindValue}>{euros(sum(entries.filter(entry => entry.kind === item)))}</Text></View>)}</View>

    <Feedback>{feedback}</Feedback>

    <Choices values={FILTERS} value={filter} onChange={setFilter} counts={{ Todos: entries.length, 'Por receber': open.length, 'Em atraso': overdue.length, Recebidos: entries.length - open.length }} />
    {visible.map(entry => {
      const days = daysUntil(entry.dueDate);
      const tone = entry.paid ? colors.successText : days < 0 ? colors.danger : colors.accent;
      const status = entry.paid ? 'RECEBIDO' : days < 0 ? `EM ATRASO · ${-days} ${days === -1 ? 'DIA' : 'DIAS'}` : days === 0 ? 'VENCE HOJE' : `VENCE EM ${days} ${days === 1 ? 'DIA' : 'DIAS'}`;
      return <View key={entry.id} style={[styles.entry, !entry.paid && days < 0 && { borderColor: colors.danger }]}>
        <View style={[styles.stripe, { backgroundColor: tone }]} />
        <View style={styles.entryTop}>
          <View style={styles.kindIcon}><Icon name={KIND_ICON[entry.kind]} size={18} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><Text numberOfLines={2} style={styles.entryTitle}>{entry.client}</Text><Text style={styles.entryMeta}>{entry.kind} · {entry.description}</Text></View>
          <Text style={[styles.entryAmount, entry.paid && { color: colors.successText }]}>{euros(entry.amount)}</Text>
        </View>
        <View style={styles.entryBottom}>
          <Text style={[styles.status, { color: tone, backgroundColor: entry.paid ? colors.successBackground : days < 0 ? colors.primaryLight : colors.warningBackground }]}>{status}</Text>
          <Text style={styles.entryMeta}>Vencimento {parseLocalDate(entry.dueDate)?.toLocaleDateString('pt-PT')}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => togglePaid(entry)} style={[styles.action, !entry.paid && styles.actionPrimary]}><Icon name={entry.paid ? 'undo' : 'check'} size={16} color={entry.paid ? colors.textStrong : colors.white} /><Text style={[styles.actionText, !entry.paid && { color: colors.white }]}>{entry.paid ? 'Reabrir' : 'Marcar recebido'}</Text></Pressable>
          {!entry.paid && <Pressable accessibilityRole="button" onPress={() => setReminderId(reminderId === entry.id ? null : entry.id)} style={styles.action}><Icon name="email-outline" size={16} color={colors.textStrong} /><Text style={styles.actionText}>Lembrete</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={() => remove(entry)} style={styles.action}><Icon name="delete-outline" size={16} color={colors.danger} /><Text style={[styles.actionText, { color: colors.danger }]}>Eliminar</Text></Pressable>
        </View>
        {reminderId === entry.id && <View style={styles.reminder}><Text style={styles.totalLabel}>RASCUNHO DE LEMBRETE · NÃO ENVIADO</Text><Text style={styles.reminderText}>Caro(a) cliente, encontra-se por regularizar o valor de {euros(entry.amount)}, referente a «{entry.description}», com vencimento em {parseLocalDate(entry.dueDate)?.toLocaleDateString('pt-PT')}. Agradecemos a sua atenção.</Text></View>}
      </View>;
    })}
    {loading && <ActivityIndicator color={colors.primary} />}
    {!loading && visible.length === 0 && <Panel title="Sem registos"><Copy>{entries.length ? 'Não existem valores neste estado.' : 'Ainda não registou trabalho ou despesas.'}</Copy></Panel>}
  </PreviewPage>;
}

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

function EntryForm({ onSave, onCancel }: { onSave: (entry: NewFeeEntry) => void; onCancel: () => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const { cases } = useCases();
  const active = cases.filter(item => item.status !== 'Arquivado');
  const caseOptions = [...active.map(item => `${item.client} · ${item.title}`), OTHER];
  const [kind, setKind] = useState<Kind>('Tempo');
  const [caseLabel, setCaseLabel] = useState(caseOptions[0]!);
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('1');
  const [vat, setVat] = useState<Vat>('IVA 23%');
  const [dueDate, setDueDate] = useState(inDays(30));
  const chooseKind = (next: Kind) => { setKind(next); setVat(next === 'Despesa' ? 'Isento' : 'IVA 23%'); if (HINTS[kind].includes(description)) setDescription(''); };
  const who = caseLabel === OTHER ? client.trim() : caseLabel;
  const value = parse(amount); const duration = parse(hours);
  const subtotal = kind === 'Tempo' ? value * duration : value;
  const tax = Math.round(subtotal * VAT[vat] * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const missing = [!who && 'cliente', !description.trim() && 'descrição', !(value > 0 && (kind !== 'Tempo' || duration > 0)) && 'valor', !parseLocalDate(dueDate) && 'vencimento'].filter(Boolean);
  const submit = () => { if (missing.length) return; onSave({ caseId: active[caseOptions.indexOf(caseLabel)]?.id ?? null, client: who, description: kind === 'Tempo' ? `${description.trim()} · ${String(duration).replace('.', ',')} h` : description.trim(), amount: total, hours: kind === 'Tempo' ? duration : null, vat, kind, dueDate }); };
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

    <Step n={4} title="Valor e vencimento" styles={styles} />
    <View style={styles.columns}>
      <View style={styles.column}><AppInput label={kind === 'Tempo' ? 'Valor por hora (€)' : kind === 'Avença' ? 'Valor da avença (€)' : 'Valor (€)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0,00" /></View>
      {kind === 'Tempo' && <View style={styles.column}><AppInput label="Horas" keyboardType="decimal-pad" value={hours} onChangeText={setHours} /><View style={styles.hints}>{['0,5', '1', '2', '4'].map(item => <Pressable key={item} accessibilityRole="button" onPress={() => setHours(item)} style={[styles.hint, hours === item && styles.hintActive]}><Text style={[styles.hintText, hours === item && { color: colors.primary }]}>{item} h</Text></Pressable>)}</View></View>}
    </View>
    <Choices values={Object.keys(VAT) as Vat[]} value={vat} onChange={setVat} />
    <DateField label="Data de vencimento" value={dueDate} onChange={setDueDate} />
    <View style={styles.hints}>{[15, 30, 60].map(days => <Pressable key={days} accessibilityRole="button" onPress={() => setDueDate(inDays(days))} style={[styles.hint, dueDate === inDays(days) && styles.hintActive]}><Text style={[styles.hintText, dueDate === inDays(days) && { color: colors.primary }]}>A {days} dias</Text></Pressable>)}</View>

    <View style={styles.summary}>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{kind === 'Tempo' && value > 0 && duration > 0 ? `${euros(value)} × ${String(duration).replace('.', ',')} h` : 'Subtotal'}</Text><Text style={styles.summaryValue}>{subtotal > 0 ? euros(subtotal) : '—'}</Text></View>
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
  formTitle: { color: colors.textStrong, fontSize: 19, fontWeight: '900' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  stepNumber: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '900', color: colors.white, backgroundColor: '#7A1620' },
  stepTitle: { color: colors.textStrong, fontSize: 14, fontWeight: '900' },
  hints: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, hint: { paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.background },
  hintActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, hintText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  summary: { gap: 8, padding: 16, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: colors.textMuted, fontSize: 13 }, summaryValue: { color: colors.textStrong, fontSize: 14, fontWeight: '800' }, summaryTotal: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderStrong },
  submit: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, backgroundColor: '#7A1620' }, submitText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  progressTrack: { height: 8, marginTop: 12, borderRadius: 4, backgroundColor: '#5E1119', overflow: 'hidden' }, progressFill: { height: 8, borderRadius: 4, backgroundColor: '#D9B454' },
  progressText: { color: '#DDB0AC', fontSize: 12 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  heroButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderRadius: radius.md, backgroundColor: '#D9B454' }, heroButtonText: { color: '#3D1319', fontSize: 14, fontWeight: '900' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, kindTile: { flexGrow: 1, flexBasis: 140, gap: 6, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  kindIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  kindLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' }, kindValue: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  kindPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, kindOption: { flexGrow: 1, flexBasis: 120, alignItems: 'center', gap: 6, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  kindOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, kindOptionText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, column: { flexGrow: 1, flexBasis: 160 },
  totalLabel: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, totalValue: { color: colors.textStrong, fontSize: 26, fontWeight: '900' },
  entry: { overflow: 'hidden', gap: 12, paddingVertical: 16, paddingRight: 16, paddingLeft: 21, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 }, entryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '800' }, entryMeta: { marginTop: 2, color: colors.textMuted, fontSize: 12 }, entryAmount: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  entryBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  status: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, action: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm },
  actionPrimary: { borderColor: '#7A1620', backgroundColor: '#7A1620' }, actionText: { color: colors.textStrong, fontSize: 12, fontWeight: '800' },
  reminder: { gap: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: radius.sm, backgroundColor: colors.background }, reminderText: { color: colors.textStrong, fontSize: 13, lineHeight: 20 },
});
