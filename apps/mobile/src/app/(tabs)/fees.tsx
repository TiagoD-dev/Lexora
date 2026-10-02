import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, Choices, euros, Feedback, Hero, Panel, PreviewPage, Stat } from '@/components/business-preview';
import { FeeEntryForm, KIND_ICON, KINDS, type Kind } from '@/components/fee-entry-form';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { parseLocalDate, toLocalDate } from '@/utils/deadlines';
import { createFeeRemote, deleteFeeRemote, listFeesRemote, updateFeeRemote, type FeeEntry, type NewFeeEntry } from '@/services/fees-service';

type Entry = FeeEntry & { kind: Kind };
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
    {editing && <FeeEntryForm onSave={save} onCancel={() => setEditing(false)} />}

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
          <View style={{ flex: 1 }}><Text numberOfLines={2} style={styles.entryTitle}>{entry.client}</Text><Text style={styles.entryMeta}>{entry.kind} · {entry.description}{entry.workDate ? ` · ${parseLocalDate(entry.workDate)?.toLocaleDateString('pt-PT')}` : ''}</Text></View>
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  progressTrack: { height: 8, marginTop: 12, borderRadius: 4, backgroundColor: '#5E1119', overflow: 'hidden' }, progressFill: { height: 8, borderRadius: 4, backgroundColor: '#D9B454' },
  progressText: { color: '#DDB0AC', fontSize: 12 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  heroButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderRadius: radius.md, backgroundColor: '#D9B454' }, heroButtonText: { color: '#3D1319', fontSize: 14, fontWeight: '900' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, kindTile: { flexGrow: 1, flexBasis: 140, gap: 6, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  kindIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  kindLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' }, kindValue: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  totalLabel: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  entry: { overflow: 'hidden', gap: 12, paddingVertical: 16, paddingRight: 16, paddingLeft: 21, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 }, entryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '800' }, entryMeta: { marginTop: 2, color: colors.textMuted, fontSize: 12 }, entryAmount: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  entryBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  status: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, action: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm },
  actionPrimary: { borderColor: '#7A1620', backgroundColor: '#7A1620' }, actionText: { color: colors.textStrong, fontSize: 12, fontWeight: '800' },
  reminder: { gap: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: radius.sm, backgroundColor: colors.background }, reminderText: { color: colors.textStrong, fontSize: 13, lineHeight: 20 },
});
