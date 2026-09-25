import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '@/components/app-input';
import { CaseCard } from '@/components/case-card';
import { ClientCard } from '@/components/client-card';
import { EmptyState } from '@/components/empty-state';
import { useCases } from '@/providers/cases-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

type ContentResult = { key: string; kind: 'document' | 'note' | 'task'; itemId: string; caseId: string; caseTitle: string; title: string; excerpt: string };
export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-PT');
}
export function searchExcerpt(value: string, query: string) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= 180) return text;
  const match = normalizeSearch(text).indexOf(query);
  const start = Math.max(0, match - 55);
  const end = Math.min(text.length, Math.max(start + 180, match + query.length));
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
export default function SearchScreen() {
  const router = useRouter();
  const { cases } = useCases();
  const { clients } = useClients();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeSearch(query.trim());
  const filteredCases = useMemo(() => !normalizedQuery ? [] : cases.filter((item) =>
    normalizeSearch(`${item.title} ${item.client} ${item.reference} ${item.processNumber} ${item.area} ${item.court} ${item.description ?? ''} ${item.responsible ?? ''}`).includes(normalizedQuery)
  ), [cases, normalizedQuery]);
  const filteredClients = useMemo(() => !normalizedQuery ? [] : clients.filter((client) =>
    normalizeSearch(`${client.name} ${client.email ?? ''} ${client.phone ?? ''} ${client.nif ?? ''}`).includes(normalizedQuery)
  ), [clients, normalizedQuery]);
  const contentResults = useMemo(() => {
    const results: ContentResult[] = [];
    if (!normalizedQuery) return results;
    for (const item of cases) {
      for (const document of item.documents) {
        const text = document.extractedText ?? '';
        if (!normalizeSearch(`${document.name} ${document.type} ${text}`).includes(normalizedQuery)) continue;
        results.push({ key: `document:${item.id}:${document.id}`, kind: 'document', itemId: document.id,
          caseId: item.id, caseTitle: item.title, title: document.name,
          excerpt: searchExcerpt(normalizeSearch(text).includes(normalizedQuery) ? text : `${document.name} · ${document.type}`, normalizedQuery) });
      }
      for (const note of item.notes) {
        if (!normalizeSearch(note.text).includes(normalizedQuery)) continue;
        results.push({ key: `note:${item.id}:${note.id}`, kind: 'note', itemId: note.id,
          caseId: item.id, caseTitle: item.title, title: 'Nota do caso', excerpt: searchExcerpt(note.text, normalizedQuery) });
      }
      for (const task of item.tasks) {
        if (!normalizeSearch(`${task.title} ${task.description ?? ''}`).includes(normalizedQuery)) continue;
        results.push({ key: `task:${item.id}:${task.id}`, kind: 'task', itemId: task.id,
          caseId: item.id, caseTitle: item.title, title: task.title,
          excerpt: searchExcerpt(task.description && normalizeSearch(task.description).includes(normalizedQuery) ? task.description : task.title, normalizedQuery) });
      }
    }
    return results;
  }, [cases, normalizedQuery]);
  function openContent(result: ContentResult) {
    if (result.kind === 'document') {
      router.push({ pathname: '/documents/review/[caseId]/[documentId]', params: { caseId: result.caseId, documentId: result.itemId } });
      return;
    }
    router.push({ pathname: '/cases/[id]', params: { id: result.caseId, panel: result.kind === 'note' ? 'notes' : 'tasks', focusId: result.itemId } });
  }
  const totalResults = filteredCases.length + filteredClients.length + contentResults.length;
  const groups = [{ kind: 'document', label: 'Documentos' }, { kind: 'note', label: 'Notas' }, { kind: 'task', label: 'Tarefas' }] as const;
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PESQUISA</Text>
        <Text style={styles.title}>Pesquisa global</Text>
        <AppInput autoFocus accessibilityLabel="Pesquisar clientes, casos, documentos, notas e tarefas" value={query} onChangeText={setQuery} placeholder="Nome, processo ou palavras do conteúdo…" returnKeyType="search" />
        {!normalizedQuery && <View style={styles.section}><EmptyState symbol="⌕" title="Encontra informação em toda a app" description="Pesquisa clientes, casos, documentos, notas e tarefas, incluindo o texto extraído dos documentos." /></View>}
        {!!normalizedQuery && <Text style={styles.summary}>{totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}</Text>}
        {filteredClients.length > 0 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clientes ({filteredClients.length})</Text>
          <View style={styles.list}>{filteredClients.map((client, index) => <ClientCard key={client.id} client={client} index={index}
            caseCount={cases.filter((item) => item.clientId ? item.clientId === client.id : item.client === client.name).length}
            onPress={() => router.push({ pathname: '/clients/[id]', params: { id: client.id } })} />)}</View>
        </View>}
        {filteredCases.length > 0 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Casos ({filteredCases.length})</Text>
          <View style={styles.list}>{filteredCases.map((item, index) => <CaseCard key={item.id} item={item} index={index} onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })} />)}</View>
        </View>}
        {groups.map((group) => {
          const results = contentResults.filter((result) => result.kind === group.kind);
          if (!results.length) return null;
          return <View key={group.kind} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.label} ({results.length})</Text>
            <View style={styles.resultList}>{results.map((result) => <Pressable key={result.key} accessibilityRole="button"
              accessibilityLabel={`${result.title}, caso ${result.caseTitle}. ${result.excerpt}`}
              onPress={() => openContent(result)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
              <Text style={styles.resultTitle}>{result.title}</Text><Text style={styles.caseTitle}>{result.caseTitle}</Text><Text style={styles.excerpt}>{result.excerpt}</Text>
            </Pressable>)}</View>
          </View>;
        })}
        {!!normalizedQuery && totalResults === 0 && <View style={styles.section}><EmptyState symbol="⌕" title="Sem resultados" description="Tenta outro nome ou uma palavra do documento, nota ou tarefa." /></View>}
      </ScrollView>
    </SafeAreaView>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
    eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
    title: { marginTop: 5, marginBottom: 16, color: colors.text, fontSize: 28, fontWeight: '800' },
    summary: { marginTop: 12, color: colors.textMuted, fontSize: 14 }, section: { marginTop: 22 },
    sectionTitle: { marginBottom: 10, color: colors.textMuted, fontSize: 13, fontWeight: '800' },
    list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, resultList: { gap: 10 },
    result: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 6, minHeight: 48 },
    pressed: { opacity: 0.75 }, resultTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    caseTitle: { color: colors.textMuted, fontSize: 13 }, excerpt: { color: colors.text, fontSize: 14, lineHeight: 21 },
  });
}
