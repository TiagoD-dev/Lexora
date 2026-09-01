import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '@/components/document-card';
import { DocumentUpload } from '@/components/document-upload';
import { EmptyState } from '@/components/empty-state';
import { SelectField } from '@/components/select-field';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { openDocument } from '@/utils/documents';
import { confirmDestructive } from '@/utils/confirm-action';

export default function DocumentsScreen() {
  const router = useRouter();
  const { cases, addDocument, deleteDocument } = useCases();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const activeCases = cases.filter((item) => item.status !== 'Arquivado');
  const [caseId, setCaseId] = useState(activeCases[0]?.id ?? '');
  const caseOptions = activeCases.map((item) => `${item.reference} — ${item.title}`);
  const selectedCase = activeCases.find((item) => item.id === caseId) ?? activeCases[0];
  const documents = useMemo(() => cases.flatMap((item) => item.documents.map((document) => ({ ...document, caseId: item.id, caseTitle: item.title, reference: item.reference }))).sort((a, b) => b.addedAt.localeCompare(a.addedAt)), [cases]);
  const toReview = documents.filter((document) => document.extractionStatus === 'Por rever').length;
  const reviewed = documents.filter((document) => document.extractionStatus === 'Revisto').length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>GESTÃO DOCUMENTAL</Text>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.subtitle}>Ficheiros associados aos Casos, com extração e revisão de conteúdo</Text>
        </View>

        <View style={styles.hero}>
          <HeroStat value={documents.length} label="Total" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={toReview} label="Por rever" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={reviewed} label="Revistos" styles={styles} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carregar novo documento</Text>
          {selectedCase ? (
            <>
              <SelectField label="Associar ao Caso" value={`${selectedCase.reference} — ${selectedCase.title}`} options={caseOptions} onChange={(label) => setCaseId(activeCases[caseOptions.indexOf(label)]?.id ?? '')} />
              <DocumentUpload onAdd={(document) => addDocument(selectedCase.id, document)} />
            </>
          ) : <Text style={styles.muted}>Cria primeiro um Caso para poderes associar documentos.</Text>}
        </View>

        <View style={styles.listHeading}><Text style={styles.sectionTitle}>Todos os documentos</Text><View style={styles.count}><Text style={styles.countText}>{documents.length}</Text></View></View>

        {documents.length === 0 ? (
          <EmptyState symbol="▤" title="Ainda não existem documentos" description="Carrega o primeiro ficheiro para começares a extrair factos e entidades." />
        ) : (
          <View style={styles.grid}>
            {documents.map((document, index) => (
              <DocumentCard
                key={`${document.reference}-${document.id}`}
                document={document}
                index={index}
                onReview={() => router.push({ pathname: '/documents/review/[caseId]/[documentId]' as never, params: { caseId: document.caseId, documentId: document.id } } as never)}
                onOpen={document.uri ? () => openDocument(document) : undefined}
                onDelete={() => confirmDestructive({ title: 'Eliminar documento?', message: `O registo "${document.name}" será removido do Caso ${document.reference}.`, onConfirm: () => deleteDocument(document.caseId, document.id) })}
              />
            ))}
          </View>
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
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 45, gap: 18 },
  intro: {},
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.textMuted, fontSize: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: radius.xxl, backgroundColor: colors.primary },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: colors.background, fontSize: 26, fontWeight: '900' },
  heroLabel: { marginTop: 3, color: colors.primarySoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .6 },
  heroDivider: { width: 1, height: 34, backgroundColor: colors.primaryLight, opacity: 0.35 },
  card: { gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  cardTitle: { color: colors.textStrong, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 13 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  count: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  countText: { color: colors.primary, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
