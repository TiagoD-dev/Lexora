import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { ClientCard } from '@/components/client-card';
import { EmptyState } from '@/components/empty-state';
import { useCases } from '@/providers/cases-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type Filter = 'Todos' | 'Particular' | 'Empresa';
const filters: Filter[] = ['Todos', 'Particular', 'Empresa'];

export default function ClientsScreen() {
  const router = useRouter();
  const { clients, hydrated } = useClients();
  const { cases } = useCases();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');

  const casesByClient = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((client) => map.set(client.id, cases.filter((item) => item.clientId === client.id || item.client === client.name).length));
    return map;
  }, [cases, clients]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-PT');
    return clients.filter((client) => (filter === 'Todos' || client.type === filter) && (!q || `${client.name} ${client.email} ${client.phone} ${client.nif}`.toLocaleLowerCase('pt-PT').includes(q)));
  }, [clients, filter, query]);

  const active = clients.filter((client) => client.status === 'Ativo').length;
  const withCases = clients.filter((client) => (casesByClient.get(client.id) ?? 0) > 0).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View>
            <Text style={styles.eyebrow}>CARTEIRA DE CLIENTES</Text>
            <Text style={styles.title}>Clientes</Text>
            <Text style={styles.subtitle}>Contactos, Casos e informação organizada</Text>
          </View>
          <Pressable accessibilityLabel="Criar novo cliente" onPress={() => router.push('/clients/new')} style={styles.add}><Text style={styles.addText}>＋</Text></Pressable>
        </View>

        <View style={styles.hero}>
          <HeroStat value={clients.length} label="Total" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={active} label="Ativos" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={withCases} label="Com Casos" styles={styles} />
        </View>

        <AppInput accessibilityLabel="Pesquisar clientes" onChangeText={setQuery} placeholder="Pesquisar por nome, contacto ou NIF…" returnKeyType="search" value={query} />

        <View style={styles.filters}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>

        {!hydrated ? (
          <View style={styles.skeletons}>{[1, 2, 3].map((n) => <View key={n} style={styles.skeleton} />)}</View>
        ) : visible.length ? (
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
        ) : (
          <EmptyState symbol="◇" title="Nenhum cliente encontrado" description="Altera os filtros ou cria uma nova ficha de cliente." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.heroStat}><Text style={styles.heroValue}>{value}</Text><Text style={styles.heroLabel}>{label}</Text></View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 20 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.textMuted, fontSize: 12 },
  add: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary },
  addText: { color: colors.background, fontSize: 24 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 18, borderRadius: radius.xxl, backgroundColor: colors.primary },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: colors.background, fontSize: 26, fontWeight: '900' },
  heroLabel: { marginTop: 3, color: colors.primarySoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .6 },
  heroDivider: { width: 1, height: 34, backgroundColor: colors.primaryLight, opacity: 0.35 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14 },
  filter: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.background },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  skeletons: { gap: 12, marginTop: 22 },
  skeleton: { height: 96, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
});
