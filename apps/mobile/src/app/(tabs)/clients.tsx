import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icon';
import { ClientCard } from '@/components/client-card';
import { EmptyState } from '@/components/empty-state';
import { FilterChip, SearchBox, StatTiles } from '@/components/list-kit';
import { OfflineBanner } from '@/components/offline-banner';
import { useCases } from '@/providers/cases-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { Client } from '@/types/client';

type Filter = 'Todos' | 'Particular' | 'Empresa' | 'Inativos';
const filters: { key: Filter; icon: IconName; match: (client: Client) => boolean }[] = [
  { key: 'Todos', icon: 'account-group-outline', match: () => true },
  { key: 'Particular', icon: 'account-outline', match: (client) => client.type === 'Particular' },
  { key: 'Empresa', icon: 'domain', match: (client) => client.type === 'Empresa' },
  { key: 'Inativos', icon: 'archive-outline', match: (client) => client.status === 'Inativo' },
];
type Sort = 'recent' | 'name';

export default function ClientsScreen() {
  const router = useRouter();
  const { clients, hydrated } = useClients();
  const { cases } = useCases();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const [sort, setSort] = useState<Sort>('recent');

  const casesByClient = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((client) => map.set(client.id, cases.filter((item) => item.clientId === client.id || item.client === client.name).length));
    return map;
  }, [cases, clients]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-PT');
    const match = filters.find((item) => item.key === filter)!.match;
    return clients
      .filter((client) => match(client) && (!q || `${client.name} ${client.email} ${client.phone} ${client.nif}`.toLocaleLowerCase('pt-PT').includes(q)))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'pt-PT') : b.updatedAt.localeCompare(a.updatedAt));
  }, [clients, filter, query, sort]);

  const active = clients.filter((client) => client.status === 'Ativo').length;
  const withCases = clients.filter((client) => (casesByClient.get(client.id) ?? 0) > 0).length;
  const noContact = clients.filter((client) => !client.email && !client.phone).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>CARTEIRA DE CLIENTES</Text>
            <Text style={styles.title}>Clientes</Text>
            <Text style={styles.subtitle}>Contactos, Casos e informação organizada</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Criar novo cliente" onPress={() => router.push('/clients/new')} style={({ pressed }) => [styles.add, pressed && styles.pressed]}><Icon name="account-plus-outline" size={20} color={colors.background} /><Text style={styles.addText}>Novo cliente</Text></Pressable>
        </View>

        <View style={styles.statsWrap}><StatTiles items={[
          { icon: 'account-group-outline', value: clients.length, label: 'Total' },
          { icon: 'check-circle-outline', value: active, label: 'Ativos' },
          { icon: 'briefcase-outline', value: withCases, label: 'Com Casos' },
          { icon: 'phone-off-outline', value: noContact, label: 'Sem contacto', warn: noContact > 0 },
        ]} /></View>

        <OfflineBanner />
        <SearchBox label="Pesquisar clientes" value={query} onChange={setQuery} placeholder="Pesquisar por nome, contacto ou NIF…" />

        <View style={styles.toolbar}>
          <View style={styles.filters}>{filters.map((item) => <FilterChip key={item.key} icon={item.icon} label={item.key} count={clients.filter(item.match).length} active={filter === item.key} onPress={() => setFilter(item.key)} />)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Ordenar: ${sort === 'name' ? 'nome' : 'recentes'}`} onPress={() => setSort(sort === 'name' ? 'recent' : 'name')} style={styles.sort}><Icon name={sort === 'name' ? 'sort-alphabetical-ascending' : 'clock-outline'} size={16} color={colors.primary} /><Text style={styles.sortText}>{sort === 'name' ? 'A–Z' : 'Recentes'}</Text></Pressable>
        </View>

        {!hydrated ? (
          <View style={styles.skeletons}>{[1, 2, 3].map((n) => <View key={n} style={styles.skeleton} />)}</View>
        ) : visible.length ? (
          <>
            <Text style={styles.resultCount}>{visible.length} {visible.length === 1 ? 'cliente' : 'clientes'}</Text>
            <View style={styles.list}>
              {visible.map((client, index) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  caseCount={casesByClient.get(client.id) ?? 0}
                  index={index}
                  onPress={() => router.push({ pathname: '/clients/[id]', params: { id: client.id } })}
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState symbol="account-group-outline" title={clients.length ? 'Nenhum cliente encontrado' : 'Ainda sem clientes'} description={clients.length ? 'Altera os filtros ou a pesquisa.' : 'Cria a primeira ficha para começares a associar Casos.'} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  intro: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingTop: 24, paddingBottom: 20 },
  introCopy: { flexShrink: 1 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.textMuted, fontSize: 12 },
  add: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.primary },
  addText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  statsWrap: { marginBottom: 18 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sort: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  sortText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  resultCount: { marginTop: 20, color: colors.textSoft, fontSize: 11, fontWeight: '800', letterSpacing: .8, textTransform: 'uppercase' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  skeletons: { gap: 12, marginTop: 22 },
  skeleton: { height: 96, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
});
