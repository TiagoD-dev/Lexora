import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { CaseCard } from '@/components/case-card';
import { EmptyState } from '@/components/empty-state';
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
  const visible = useMemo(() => { const q = query.trim().toLocaleLowerCase('pt-PT'); return cases.filter((item) => (status === 'Todos' || item.status === status) && (area === 'Todas' || item.area === area) && (court === 'Todos' || item.court === court) && (!q || `${item.title} ${item.client} ${item.area} ${item.court}`.toLocaleLowerCase('pt-PT').includes(q))); }, [area, cases, court, query, status]);
  const emAnalise = cases.filter((x) => x.status === 'Em análise').length; const concluidos = cases.filter((x) => x.status === 'Concluído').length;
  return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.intro}><View><Text style={styles.eyebrow}>GESTÃO JURÍDICA</Text><Text style={styles.title}>Os meus casos</Text><Text style={styles.subtitle}>Casos, prazos e informação organizada por assunto</Text></View><Pressable accessibilityLabel="Criar novo caso" onPress={() => router.push('/cases/new')} style={styles.add}><Text style={styles.addText}>＋</Text></Pressable></View>
    <View style={styles.hero}><HeroStat value={cases.length} label="Total" styles={styles} /><View style={styles.heroDivider} /><HeroStat value={emAnalise} label="Em análise" styles={styles} /><View style={styles.heroDivider} /><HeroStat value={concluidos} label="Concluídos" styles={styles} /></View>
    <AppInput accessibilityLabel="Pesquisar casos" onChangeText={setQuery} placeholder="Pesquisar cliente, caso, área ou tribunal…" returnKeyType="search" value={query} />
    <FilterRow label="Estado" values={statuses} selected={status} onSelect={(value) => setStatus(value as Filter)} styles={styles} />
    <FilterRow label="Área" values={areas} selected={area} onSelect={setArea} styles={styles} />
    <FilterRow label="Tribunal" values={courts} selected={court} onSelect={setCourt} styles={styles} />
    {!hydrated ? <View style={styles.skeletons}>{[1,2,3].map((n) => <View key={n} style={styles.skeleton} />)}</View> : visible.length ? <View style={styles.list}>{visible.map((item, index) => <CaseCard key={item.id} item={item} index={index} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })} />)}</View> : <EmptyState symbol="⌕" title="Nenhum caso encontrado" description="Altera os filtros ou cria um novo caso." />}
  </ScrollView></SafeAreaView>;
}
function FilterRow({ label, values, selected, onSelect, styles }: { label: string; values: string[]; selected: string; onSelect: (v: string) => void; styles: ReturnType<typeof makeStyles> }) { return <View><Text style={styles.filterLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{values.map((v) => <Pressable key={v} onPress={() => onSelect(v)} style={[styles.filter, selected === v && styles.filterActive]}><Text numberOfLines={1} style={[styles.filterText, selected === v && styles.filterTextActive]}>{v}</Text></Pressable>)}</ScrollView></View>; }
function HeroStat({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.heroStat}><Text style={styles.heroValue}>{value}</Text><Text style={styles.heroLabel}>{label}</Text></View>; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 40 }, intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 20 }, eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' }, subtitle: { marginTop: 5, color: colors.textMuted, fontSize: 12 }, add: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary }, addText: { color: colors.background, fontSize: 24 }, hero: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 18, borderRadius: radius.xxl, backgroundColor: colors.primary }, heroStat: { flex: 1, alignItems: 'center' }, heroValue: { color: colors.background, fontSize: 26, fontWeight: '900' }, heroLabel: { marginTop: 3, color: colors.primarySoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .6 }, heroDivider: { width: 1, height: 34, backgroundColor: colors.primaryLight, opacity: 0.35 }, filterLabel: { marginTop: 14, marginBottom: 7, color: colors.textSoft, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .8 }, filters: { gap: 8 }, filter: { maxWidth: 230, minHeight: 36, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.surface }, filterActive: { borderColor: colors.primary, backgroundColor: colors.primary }, filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' }, filterTextActive: { color: colors.background }, list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 }, skeletons: { gap: 12, marginTop: 22 }, skeleton: { height: 94, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted } });
