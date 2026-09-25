import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { CaseCard } from '@/components/case-card';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { OfflineBanner } from '@/components/offline-banner';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseStatus } from '@/types/case';

type Filter = 'Todos' | CaseStatus;
const statuses: Filter[] = ['Todos', 'Rascunho', 'Em análise', 'Concluído', 'Arquivado'];
export default function CasesScreen() {
  const router = useRouter(); const { cases, hydrated } = useCases(); const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [query, setQuery] = useState(''); const [status, setStatus] = useState<Filter>('Todos'); const [area, setArea] = useState('Todas'); const [court, setCourt] = useState('Todos');
  const areas = useMemo(() => ['Todas', ...new Set(cases.map((item) => item.area))], [cases]);
  const courts = useMemo(() => ['Todos', ...new Set(cases.map((item) => item.court))], [cases]);
  const visible = useMemo(() => { const q = query.trim().toLocaleLowerCase('pt-PT'); return cases.filter((item) => (status === 'Todos' || item.status === status) && (area === 'Todas' || item.area === area) && (court === 'Todos' || item.court === court) && (!q || `${item.title} ${item.client} ${item.area} ${item.court} ${item.reference}`.toLocaleLowerCase('pt-PT').includes(q))); }, [area, cases, court, query, status]);
  const active = cases.filter((x) => x.status !== 'Concluído' && x.status !== 'Arquivado').length;
  return <SafeAreaView edges={['top']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.intro}>
        <View><Text style={styles.eyebrow}>DOSSIÊS JUDICIAIS</Text><Text style={styles.title}>Processos & Casos</Text></View>
        <View style={styles.activeChip}><View style={styles.activeDot} /><Text style={styles.activeText}>{active} Ativos</Text></View>
      </View>
      <OfflineBanner />
      <AppInput accessibilityLabel="Pesquisar casos" onChangeText={setQuery} placeholder="Pesquisar por n.º de processo, cliente…" returnKeyType="search" value={query} />
      <Pills values={areas} selected={area} onSelect={setArea} styles={styles} primary />
      <Pills values={statuses} selected={status} onSelect={(value) => setStatus(value as Filter)} styles={styles} />
      {courts.length > 2 ? <Pills values={courts} selected={court} onSelect={setCourt} styles={styles} /> : null}
      {!hydrated ? <View style={styles.skeletons}>{[1, 2, 3].map((n) => <View key={n} style={styles.skeleton} />)}</View> : visible.length ? <View style={styles.list}>{visible.map((item, index) => <CaseCard key={item.id} item={item} index={index} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })} />)}</View> : <EmptyState symbol="magnify" title="Nenhum caso encontrado" description="Altera os filtros ou cria um novo caso." />}
    </ScrollView>
    <Pressable accessibilityLabel="Criar novo caso" onPress={() => router.push('/cases/new')} style={styles.fab}><View style={styles.fabIcon}><Icon name="plus" size={16} color={colors.primary} /></View><Text style={styles.fabText}>Novo Processo</Text></Pressable>
  </SafeAreaView>;
}
function Pills({ values, selected, onSelect, styles, primary }: { values: string[]; selected: string; onSelect: (v: string) => void; styles: ReturnType<typeof makeStyles>; primary?: boolean }) { return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} style={styles.pillsWrap}>{values.map((v) => <Pressable key={v} onPress={() => onSelect(v)} style={[styles.pill, primary && styles.pillPrimary, selected === v && (primary ? styles.pillPrimaryActive : styles.pillActive)]}><Text numberOfLines={1} style={[styles.pillText, selected === v && (primary ? styles.pillPrimaryTextActive : styles.pillTextActive)]}>{v}</Text></Pressable>)}</ScrollView>; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 110 },
  intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 14 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  title: { marginTop: 2, color: colors.text, fontSize: 28, fontWeight: '800' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  activeText: { color: colors.textStrong, fontSize: 12, fontWeight: '800' },
  pillsWrap: { marginTop: 12, flexGrow: 0 },
  pills: { gap: 8 },
  pill: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  pillActive: { backgroundColor: colors.primaryLight },
  pillText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: colors.primary, fontWeight: '800' },
  pillPrimary: { minHeight: 36, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillPrimaryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillPrimaryTextActive: { color: colors.white, fontWeight: '800' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  skeletons: { gap: 12, marginTop: 18 },
  skeleton: { height: 180, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  fab: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10, paddingRight: 18, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.primary, boxShadow: '0 8px 20px rgba(122,22,32,0.35)', elevation: 8 },
  fabIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accent },
  fabText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
