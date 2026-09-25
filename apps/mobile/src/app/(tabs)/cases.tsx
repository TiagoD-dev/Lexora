import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { CaseCard } from '@/components/case-card';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { OfflineBanner } from '@/components/offline-banner';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseStatus, LegalCase } from '@/types/case';
import { toLocalDate } from '@/utils/deadlines';

type Filter = 'Todos' | CaseStatus;
type Focus = 'overdue' | 'urgent' | 'week' | null;
const statuses: Filter[] = ['Todos', 'Rascunho', 'Em análise', 'Concluído', 'Arquivado'];
const priorityRank = { Urgente: 0, Alta: 1, Normal: 2, Baixa: 3 };
const isClosed = (item: LegalCase) => item.status === 'Concluído' || item.status === 'Arquivado';
const nextDue = (item: LegalCase) => item.tasks.filter((t) => !t.completed && t.dueDate).map((t) => t.dueDate as string).sort()[0];

export default function CasesScreen() {
  const router = useRouter(); const { cases, hydrated } = useCases(); const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [query, setQuery] = useState(''); const [status, setStatus] = useState<Filter>('Todos'); const [area, setArea] = useState('Todas'); const [court, setCourt] = useState('Todos'); const [focus, setFocus] = useState<Focus>(null);
  const today = toLocalDate(); const week = new Date(); week.setDate(week.getDate() + 7); const until = toLocalDate(week);
  const areas = useMemo(() => ['Todas', ...new Set(cases.map((item) => item.area))], [cases]);
  const courts = useMemo(() => ['Todos', ...new Set(cases.map((item) => item.court))], [cases]);
  const matches = (item: LegalCase, f: Focus) => { const due = nextDue(item); return f === 'overdue' ? !!due && due < today : f === 'urgent' ? !isClosed(item) && (item.priority === 'Urgente' || item.priority === 'Alta') : f === 'week' ? !!due && due >= today && due <= until : true; };
  const counts = { active: cases.filter((x) => !isClosed(x)).length, overdue: cases.filter((x) => matches(x, 'overdue')).length, urgent: cases.filter((x) => matches(x, 'urgent')).length, week: cases.filter((x) => matches(x, 'week')).length };
  const statusLabel = (s: string) => `${s} ${s === 'Todos' ? cases.length : cases.filter((x) => x.status === s).length}`;
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-PT');
    return cases
      .filter((item) => matches(item, focus) && (status === 'Todos' || item.status === status) && (area === 'Todas' || item.area === area) && (court === 'Todos' || item.court === court) && (!q || `${item.title} ${item.client} ${item.area} ${item.court} ${item.reference} ${item.processNumber}`.toLocaleLowerCase('pt-PT').includes(q)))
      // Abertos primeiro, depois por prioridade, prazo mais próximo e atualização mais recente.
      .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || priorityRank[a.priority] - priorityRank[b.priority] || (nextDue(a) ?? '9').localeCompare(nextDue(b) ?? '9') || b.updatedAt.localeCompare(a.updatedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, cases, court, focus, query, status, today]);
  const filtered = !!query.trim() || status !== 'Todos' || area !== 'Todas' || court !== 'Todos' || !!focus;
  const clear = () => { setQuery(''); setStatus('Todos'); setArea('Todas'); setCourt('Todos'); setFocus(null); };
  const stats: { key: Exclude<Focus, null>; value: number; label: string; icon: IconName }[] = [
    { key: 'overdue', value: counts.overdue, label: 'Prazos em atraso', icon: 'bell-alert-outline' },
    { key: 'week', value: counts.week, label: 'Prazos em 7 dias', icon: 'calendar-clock' },
    { key: 'urgent', value: counts.urgent, label: 'Prioridade alta', icon: 'fire' },
  ];
  return <SafeAreaView edges={['top']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.intro}><Text style={styles.eyebrow}>DOSSIÊS JUDICIAIS</Text><Text style={styles.title}>Processos & Casos</Text></View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View><Text style={styles.heroValue}>{counts.active}</Text><Text style={styles.heroLabel}>{counts.active === 1 ? 'processo ativo' : 'processos ativos'}</Text></View>
          <View style={styles.heroBadge}><Icon name="briefcase-outline" size={14} color={colors.primary} /><Text style={styles.heroBadgeText}>{cases.length} NO TOTAL</Text></View>
        </View>
        <View style={styles.stats}>{stats.map((s) => <Pressable key={s.key} accessibilityRole="button" accessibilityState={{ selected: focus === s.key }} onPress={() => setFocus(focus === s.key ? null : s.key)} style={[styles.stat, focus === s.key && styles.statActive]}>
          <View style={styles.statTop}><Icon name={s.icon} size={16} color={focus === s.key ? colors.primary : s.value ? (s.key === 'overdue' ? colors.accent : colors.white) : colors.primarySoft} /><Text style={[styles.statValue, focus === s.key && styles.statValueActive]}>{s.value}</Text></View>
          <Text numberOfLines={1} style={[styles.statLabel, focus === s.key && styles.statLabelActive]}>{s.label}</Text>
        </Pressable>)}</View>
      </View>
      <OfflineBanner />
      <View style={styles.search}><AppInput accessibilityLabel="Pesquisar casos" onChangeText={setQuery} placeholder="Pesquisar por n.º de processo, cliente…" returnKeyType="search" value={query} /></View>
      <Pills values={statuses} labels={statusLabel} selected={status} onSelect={(value) => setStatus(value as Filter)} styles={styles} primary />
      {areas.length > 2 ? <Pills values={areas} selected={area} onSelect={setArea} styles={styles} /> : null}
      {courts.length > 2 ? <Pills values={courts} selected={court} onSelect={setCourt} styles={styles} /> : null}
      <View style={styles.resultsRow}>
        <Text style={styles.results}>{visible.length} {visible.length === 1 ? 'RESULTADO' : 'RESULTADOS'}</Text>
        {filtered ? <Pressable accessibilityRole="button" onPress={clear} style={styles.clear}><Icon name="filter-remove-outline" size={14} color={colors.primary} /><Text style={styles.clearText}>Limpar filtros</Text></Pressable> : null}
      </View>
      {!hydrated ? <View style={styles.list}>{[1, 2, 3].map((n) => <View key={n} style={styles.skeleton}><View style={[styles.bar, { width: '35%' }]} /><View style={[styles.bar, styles.barTall, { width: '80%' }]} /><View style={[styles.bar, { width: '55%' }]} /><View style={styles.barBlock} /></View>)}</View>
        : visible.length ? <View style={styles.list}>{visible.map((item, index) => <CaseCard key={item.id} item={item} index={index} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })} />)}</View>
        : cases.length ? <EmptyState symbol="folder-search-outline" title="Nenhum caso encontrado" description="Nenhum processo corresponde à pesquisa ou aos filtros. Experimenta limpar os filtros." />
        : <EmptyState symbol="folder-plus-outline" title="Ainda sem processos" description="Cria o primeiro caso para acompanhar prazos, documentos e factos num só dossiê." />}
    </ScrollView>
    <Pressable accessibilityLabel="Criar novo caso" onPress={() => router.push('/cases/new')} style={styles.fab}><View style={styles.fabIcon}><Icon name="plus" size={16} color={colors.primary} /></View><Text style={styles.fabText}>Novo Processo</Text></Pressable>
  </SafeAreaView>;
}
function Pills({ values, labels, selected, onSelect, styles, primary }: { values: string[]; labels?: (v: string) => string; selected: string; onSelect: (v: string) => void; styles: ReturnType<typeof makeStyles>; primary?: boolean }) { return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} style={styles.pillsWrap}>{values.map((v) => <Pressable key={v} accessibilityState={{ selected: selected === v }} onPress={() => onSelect(v)} style={[styles.pill, primary && styles.pillPrimary, selected === v && (primary ? styles.pillPrimaryActive : styles.pillActive)]}><Text numberOfLines={1} style={[styles.pillText, selected === v && (primary ? styles.pillPrimaryTextActive : styles.pillTextActive)]}>{labels ? labels(v) : v}</Text></Pressable>)}</ScrollView>; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 110 },
  intro: { paddingTop: 16, paddingBottom: 14 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  title: { marginTop: 2, color: colors.text, fontSize: 28, fontWeight: '800' },
  hero: { gap: 14, padding: 16, marginBottom: 4, borderRadius: radius.xl, backgroundColor: colors.primary },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  heroValue: { color: colors.white, fontSize: 34, fontWeight: '800', lineHeight: 38 },
  heroLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  heroBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 4, padding: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)' },
  statActive: { backgroundColor: colors.surface },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { color: colors.white, fontSize: 20, fontWeight: '800' },
  statValueActive: { color: colors.primary },
  statLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '600' },
  statLabelActive: { color: colors.textStrong },
  search: { marginTop: 12 },
  pillsWrap: { marginTop: 10, flexGrow: 0 },
  pills: { gap: 8 },
  pill: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  pillActive: { backgroundColor: colors.primaryLight },
  pillText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: colors.primary, fontWeight: '800' },
  pillPrimary: { minHeight: 36, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillPrimaryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillPrimaryTextActive: { color: colors.white, fontWeight: '800' },
  resultsRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  results: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  clearText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  skeleton: { minWidth: 280, flexBasis: 420, flexGrow: 1, gap: 10, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted },
  barTall: { height: 16 },
  barBlock: { height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  fab: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10, paddingRight: 18, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.primary, boxShadow: '0 8px 20px rgba(122,22,32,0.35)', elevation: 8 },
  fabIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accent },
  fabText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
