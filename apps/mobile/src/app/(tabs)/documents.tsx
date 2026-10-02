import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '@/components/document-card';
import type { CaseDocument } from '@/types/case';
import { DocumentUpload } from '@/components/document-upload';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { FilterChip, SearchBox, StatTiles } from '@/components/list-kit';
import { OfflineBanner } from '@/components/offline-banner';
import { SelectField } from '@/components/select-field';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { openDocument } from '@/utils/documents';
import { confirmDestructive } from '@/utils/confirm-action';

type Filter = 'Todos' | 'Por rever' | 'Revistos' | 'Com erro';
const filters: { key: Filter; icon: IconName; match: (document: CaseDocument) => boolean }[] = [
  { key: 'Todos', icon: 'file-multiple-outline', match: () => true },
  { key: 'Por rever', icon: 'file-eye-outline', match: (document) => document.extractionStatus === 'Por rever' },
  { key: 'Revistos', icon: 'file-check-outline', match: (document) => document.extractionStatus === 'Revisto' },
  { key: 'Com erro', icon: 'file-alert-outline', match: (document) => document.extractionStatus === 'Erro' },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ caseId?: string }>();
  const { cases, addDocument, deleteDocument } = useCases();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const activeCases = cases.filter((item) => item.status !== 'Arquivado');
  const [caseId, setCaseId] = useState(activeCases[0]?.id ?? '');
  const caseOptions = activeCases.map((item) => `${item.reference} — ${item.title}`);
  const selectedCase = activeCases.find((item) => item.id === caseId) ?? activeCases[0];
  const [filterCaseId, setFilterCaseId] = useState(params.caseId ?? '');
  const filterOptions = ['Todos os Casos', ...cases.map((item) => `${item.reference} — ${item.title}`)];
  const filterLabel = filterCaseId ? filterOptions[cases.findIndex((item) => item.id === filterCaseId) + 1] ?? 'Todos os Casos' : 'Todos os Casos';
  const documents = useMemo(() => cases.flatMap((item) => item.documents.map((document) => ({ ...document, caseId: item.id, caseTitle: item.title, reference: item.reference }))).filter((document) => !filterCaseId || document.caseId === filterCaseId).sort((a, b) => b.addedAt.localeCompare(a.addedAt)), [cases, filterCaseId]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const count = (key: Filter) => documents.filter(filters.find((item) => item.key === key)!.match).length;
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-PT');
    const match = filters.find((item) => item.key === filter)!.match;
    return documents.filter((document) => match(document) && (!q || `${document.name} ${document.type} ${document.reference} ${document.caseTitle}`.toLocaleLowerCase('pt-PT').includes(q)));
  }, [documents, filter, query]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>GESTÃO DOCUMENTAL</Text>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.subtitle}>Ficheiros associados aos Casos, com extração e revisão de conteúdo</Text>
        </View>

        <StatTiles items={[
          { icon: 'file-multiple-outline', value: documents.length, label: 'Total' },
          { icon: 'file-eye-outline', value: count('Por rever'), label: 'Por rever', warn: count('Por rever') > 0 },
          { icon: 'file-check-outline', value: count('Revistos'), label: 'Revistos' },
          { icon: 'file-alert-outline', value: count('Com erro'), label: 'Com erro', warn: count('Com erro') > 0 },
        ]} />

        <OfflineBanner />

        <View style={styles.card}>
          <View style={styles.cardHead}><View style={styles.cardIcon}><Icon name="file-upload-outline" size={18} color={colors.primary} /></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>Carregar novo documento</Text><Text style={styles.cardHint}>O texto é extraído automaticamente para revisão.</Text></View></View>
          <View style={styles.cardBody}>
            {selectedCase ? (
              <>
                <SelectField label="Associar ao Caso" value={`${selectedCase.reference} — ${selectedCase.title}`} options={caseOptions} onChange={(label) => setCaseId(activeCases[caseOptions.indexOf(label)]?.id ?? '')} />
                <DocumentUpload onAdd={(document) => addDocument(selectedCase.id, document)} />
              </>
            ) : <Text style={styles.muted}>Cria primeiro um Caso para poderes associar documentos.</Text>}
          </View>
        </View>

        <SearchBox label="Pesquisar documentos" value={query} onChange={setQuery} placeholder="Pesquisar por nome, tipo ou Caso…" />
        <View style={styles.toolbar}>
          <View style={styles.filters}>{filters.map((item) => <FilterChip key={item.key} icon={item.icon} label={item.key} count={count(item.key)} active={filter === item.key} onPress={() => setFilter(item.key)} />)}</View>
          <View style={styles.caseFilter}><SelectField label="Caso" value={filterLabel} options={filterOptions} onChange={(label) => setFilterCaseId(label === 'Todos os Casos' ? '' : cases[filterOptions.indexOf(label) - 1]?.id ?? '')} /></View>
        </View>

        {visible.length === 0 ? (
          documents.length
            ? <EmptyState symbol="file-search-outline" title="Nenhum documento encontrado" description="Altera os filtros ou a pesquisa." />
            : <EmptyState symbol="folder-open-outline" title={filterCaseId ? 'Este Caso ainda não tem documentos' : 'Ainda não existem documentos'} description="Carrega o primeiro ficheiro para começares a extrair factos e entidades." />
        ) : (
          <>
          <Text style={styles.resultCount}>{visible.length} {visible.length === 1 ? 'documento' : 'documentos'}</Text>
          <View style={styles.grid}>
            {visible.map((document, index) => (
              <DocumentCard
                key={`${document.reference}-${document.id}`}
                document={document}
                index={index}
                onReview={() => router.push({ pathname: '/documents/review/[caseId]/[documentId]' as never, params: { caseId: document.caseId, documentId: document.id } } as never)}
                onOpen={document.fileId ? () => openDocument(document) : undefined}
                onDelete={() => confirmDestructive({ title: 'Eliminar documento?', message: `O registo "${document.name}" será removido do Caso ${document.reference}.`, onConfirm: () => deleteDocument(document.caseId, document.id) })}
              />
            ))}
          </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 45, gap: 18 },
  intro: {},
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.textMuted, fontSize: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceMuted },
  cardIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surface },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '800' },
  cardHint: { marginTop: 2, color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  cardBody: { gap: 16, padding: 18 },
  muted: { color: colors.textMuted, fontSize: 13 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: -4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caseFilter: { minWidth: 240, flexGrow: 1, maxWidth: 360 },
  resultCount: { marginBottom: -8, color: colors.textSoft, fontSize: 11, fontWeight: '800', letterSpacing: .8, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
