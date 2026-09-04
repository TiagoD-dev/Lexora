import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { CaseCard } from '@/components/case-card';
import { ClientCard } from '@/components/client-card';
import { EmptyState } from '@/components/empty-state';
import { useCases } from '@/providers/cases-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { cases } = useCases();
  const { clients } = useClients();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');

  const casesByClient = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((client) => map.set(client.id, cases.filter((item) => item.clientId === client.id || item.client === client.name).length));
    return map;
  }, [cases, clients]);

  const q = query.trim().toLocaleLowerCase('pt-PT');
  const visibleCases = useMemo(() => !q ? [] : cases.filter((item) => `${item.title} ${item.client} ${item.reference} ${item.processNumber} ${item.area} ${item.court}`.toLocaleLowerCase('pt-PT').includes(q)), [cases, q]);
  const visibleClients = useMemo(() => !q ? [] : clients.filter((client) => `${client.name} ${client.email} ${client.phone} ${client.nif}`.toLocaleLowerCase('pt-PT').includes(q)), [clients, q]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PESQUISA</Text>
        <Text style={styles.title}>Pesquisa global</Text>
        <AppInput autoFocus accessibilityLabel="Pesquisar casos e clientes" onChangeText={setQuery} placeholder="Nome, referência, processo, NIF…" returnKeyType="search" value={query} />

        {!q ? (
          <EmptyState symbol="⌕" title="Procura casos e clientes" description="Escreve um nome, referência de caso, número de processo ou NIF." />
        ) : !visibleCases.length && !visibleClients.length ? (
          <EmptyState symbol="⌕" title="Sem resultados" description="Tenta outro termo de pesquisa." />
        ) : (
          <>
            {visibleCases.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Casos ({visibleCases.length})</Text>
                <View style={styles.list}>
                  {visibleCases.map((item, index) => <CaseCard key={item.id} item={item} index={index} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })} />)}
                </View>
              </View>
            ) : null}
            {visibleClients.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clientes ({visibleClients.length})</Text>
                <View style={styles.list}>
                  {visibleClients.map((client, index) => <ClientCard key={client.id} client={client} caseCount={casesByClient.get(client.id) ?? 0} index={index} onPress={() => router.push({ pathname: '/clients/[id]', params: { id: client.id } })} />)}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, marginBottom: 16, color: colors.text, fontSize: 28, fontWeight: '800' },
  section: { marginTop: 22 },
  sectionTitle: { marginBottom: 10, color: colors.textSoft, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .8 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
