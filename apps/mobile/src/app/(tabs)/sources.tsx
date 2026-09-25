import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { LegalUpdateCard } from '@/components/legal-update-card';
import { FilterChip, SearchBox, StatTiles } from '@/components/list-kit';
import { useLegalUpdates } from '@/providers/legal-updates-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { LegalUpdate } from '@/types/legal-update';

type Type = 'Todas' | 'Legislação' | 'Jurisprudência';
const types: { key: Type; icon: IconName; match: (update: LegalUpdate) => boolean }[] = [
  { key: 'Todas', icon: 'bookshelf', match: () => true },
  { key: 'Legislação', icon: 'book-open-page-variant-outline', match: (update) => update.sourceKind !== 'Jurisprudência' },
  { key: 'Jurisprudência', icon: 'gavel', match: (update) => update.sourceKind === 'Jurisprudência' },
];

export default function SourcesScreen() {
  const { updates, hydrated, error, refresh } = useLegalUpdates();
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<Type>('Todas');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-PT');
    const match = types.find((item) => item.key === type)!.match;
    return updates.filter((u) => match(u) && (!q || `${u.title} ${u.summary} ${u.source} ${u.areas.join(' ')}`.toLocaleLowerCase('pt-PT').includes(q)));
  }, [updates, query, type]);
  const countOf = (key: Type) => updates.filter(types.find((item) => item.key === key)!.match).length;
  const official = updates.filter((u) => u.official).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>BASE DE CONHECIMENTO</Text>
          <Text style={styles.pageTitle}>Fontes jurídicas</Text>
          <Text style={styles.pageSubtitle}>Legislação e jurisprudência utilizadas nas análises.</Text>
        </View>
        <StatTiles items={[
          { icon: 'bookshelf', value: updates.length, label: 'Total' },
          { icon: 'book-open-page-variant-outline', value: countOf('Legislação'), label: 'Legislação' },
          { icon: 'gavel', value: countOf('Jurisprudência'), label: 'Jurisprudência' },
          { icon: 'check-decagram-outline', value: official, label: 'Oficiais' },
        ]} />
        <View style={styles.info}>
          <View style={styles.infoIcon}><Icon name="shield-check-outline" size={20} color={colors.primary} /></View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Fontes verificadas</Text>
            <Text style={styles.infoText}>Cada referência indicará a redação temporal e a passagem que suporta a resposta.</Text>
          </View>
        </View>
        <SearchBox label="Pesquisar fontes" value={query} onChange={setQuery} placeholder="Pesquisar legislação ou jurisprudência…" />
        <View style={styles.filters}>{types.map((item) => <FilterChip key={item.key} icon={item.icon} label={item.key} count={countOf(item.key)} active={type === item.key} onPress={() => setType(item.key)} />)}</View>
        {!hydrated ? (
          <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>A consultar fontes oficiais…</Text></View>
        ) : error ? (
          <View style={styles.state}>
            <Icon name="cloud-off-outline" size={28} color={colors.textSoft} />
            <Text style={styles.stateText}>Não foi possível obter as fontes agora.</Text>
            <Pressable onPress={refresh}><Text style={styles.stateRetry}>Tentar novamente</Text></Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState symbol="bookshelf" title={updates.length ? 'Nenhuma fonte encontrada' : 'Sem fontes de momento'} description={updates.length ? 'Altera o filtro ou a pesquisa.' : 'Volta a tentar mais tarde.'} />
        ) : (
          <View style={styles.list}>{filtered.map((source) => <LegalUpdateCard key={source.id} update={source} />)}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  pageIntro: { paddingTop: 24, paddingBottom: 8 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  pageTitle: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  pageSubtitle: { marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.primaryLight },
  infoIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface },
  infoCopy: { flex: 1 },
  infoTitle: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  infoText: { marginTop: 3, color: colors.textStrong, fontSize: 12, lineHeight: 18 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  state: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  stateText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  stateRetry: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  list: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
