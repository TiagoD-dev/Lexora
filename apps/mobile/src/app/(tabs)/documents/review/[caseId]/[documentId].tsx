import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { ScreenHeader } from '@/components/screen-header';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { normalizeExtractedDate } from '@/utils/deadlines';

export default function DocumentReviewScreen() {
  const { caseId, documentId } = useLocalSearchParams<{ caseId: string; documentId: string }>(); const router = useRouter();
  const { getCase, addFact, addEntity, addLegalIssue, addTask, updateDocument } = useCases(); const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const item = getCase(caseId); const document = item?.documents.find((entry) => entry.id === documentId); const suggestions = document?.suggestions ?? [];
  const [selected, setSelected] = useState<string[]>([]); const pending = suggestions.filter((suggestion) => !suggestion.accepted);
  if (!item || !document) return <SafeAreaView style={styles.screen}><ScreenHeader title="Documento não encontrado" /><Text style={styles.empty}>Este documento já não está disponível.</Text></SafeAreaView>;
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  const finish = () => router.replace({ pathname: '/cases/[id]', params: { id: caseId } });
  const offerTasks = (list: typeof suggestions) => {
    if (!list.length) return finish();
    const [suggestion, ...rest] = list; const dueDate = normalizeExtractedDate(suggestion.value)!;
    Alert.alert('Data encontrada', `“${suggestion.value}” foi registada como facto. Criar também uma tarefa com este prazo?`, [
      { text: 'Só registar', style: 'cancel', onPress: () => offerTasks(rest) },
      { text: 'Criar tarefa', onPress: () => { addTask(caseId, { title: suggestion.detail ? `${suggestion.detail}: ${suggestion.value}` : `Prazo: ${suggestion.value}`, dueDate, deadlineKind: 'Judicial' }); offerTasks(rest); } },
    ]);
  };
  const apply = () => {
    const chosen = suggestions.filter((suggestion) => selected.includes(suggestion.id) && !suggestion.accepted);
    chosen.forEach((suggestion) => {
      if (suggestion.type === 'Entidade') addEntity(caseId, suggestion.value, `Extraído de ${document.name}`);
      else if (suggestion.type === 'Questão jurídica') addLegalIssue(caseId, suggestion.value);
      else addFact(caseId, suggestion.type === 'Data' ? `Data mencionada em ${document.name}: ${suggestion.value}` : suggestion.value, {
        source: 'Documento',
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        sourceSuggestionId: suggestion.id,
        sourceExcerpt: suggestion.excerpt || suggestion.value,
        sourceLocation: suggestion.characterStart !== undefined ? `Texto extraído · caracteres ${suggestion.characterStart + 1}–${suggestion.characterEnd ?? suggestion.characterStart + suggestion.value.length}` : 'Texto extraído',
        reviewedAt: new Date().toISOString(),
        relevantDate: suggestion.type === 'Data' ? suggestion.value : undefined,
      });
    });
    updateDocument(caseId, documentId, { extractionStatus: 'Revisto', reviewedAt: new Date().toISOString(), suggestions: suggestions.map((suggestion) => selected.includes(suggestion.id) ? { ...suggestion, accepted: true } : suggestion) });
    offerTasks(chosen.filter((suggestion) => suggestion.type === 'Data' && normalizeExtractedDate(suggestion.value)));
  };
  const finishWithoutAdding = () => { updateDocument(caseId, documentId, { extractionStatus: 'Revisto', reviewedAt: new Date().toISOString() }); router.replace({ pathname: '/cases/[id]', params: { id: caseId } }); };
  return <SafeAreaView style={styles.screen}><View style={styles.wrap}><ScreenHeader title="Rever extração" subtitle={`${item.reference} · ${document.name}`} /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.summary}><View><Text style={styles.summaryEyebrow}>CONTEÚDO EXTRAÍDO</Text><Text style={styles.summaryTitle}>{document.name}</Text><Text style={styles.summaryMeta}>{[document.pageCount ? `${document.pageCount} páginas` : undefined, document.extractedCharacterCount ? `${document.extractedCharacterCount.toLocaleString('pt-PT')} caracteres` : undefined, `${suggestions.length} sugestões`].filter(Boolean).join(' · ')}</Text></View><View style={styles.status}><Text style={styles.statusText}>{document.extractionStatus}</Text></View></View>
    {document.extractionError ? <View style={styles.errorBox}><Text style={styles.errorTitle}>A extração falhou</Text><Text style={styles.errorText}>{document.extractionError}</Text></View> : null}
    <View style={styles.preview}><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Pré-visualização do texto</Text><Text style={styles.caption}>Confirma sempre no documento original</Text></View><Text style={styles.previewText}>{document.extractedText?.slice(0, 2400) || 'Não existe texto extraído.'}</Text>{(document.extractedText?.length ?? 0) > 2400 ? <Text style={styles.truncated}>Pré-visualização limitada aos primeiros 2 400 caracteres.</Text> : null}</View>
    <View style={styles.review}><View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Elementos propostos</Text><Text style={styles.caption}>Nada é adicionado sem confirmação.</Text></View>{pending.length ? <Pressable onPress={() => setSelected(selected.length === pending.length ? [] : pending.map((entry) => entry.id))}><Text style={styles.selectAll}>{selected.length === pending.length ? 'Limpar' : 'Selecionar todos'}</Text></Pressable> : null}</View>
      {suggestions.length === 0 ? <Text style={styles.empty}>Não foram encontrados elementos estruturados.</Text> : suggestions.map((suggestion) => { const checked = suggestion.accepted || selected.includes(suggestion.id); return <Pressable disabled={suggestion.accepted} key={suggestion.id} onPress={() => toggle(suggestion.id)} style={[styles.suggestion, checked && styles.suggestionSelected, suggestion.accepted && styles.suggestionAccepted]}><View style={[styles.check, checked && styles.checkActive]}><Text style={styles.checkText}>{checked ? '✓' : ''}</Text></View><View style={styles.suggestionCopy}><Text style={styles.kind}>{suggestion.type.toUpperCase()}</Text><Text style={styles.value}>{suggestion.value}</Text>{suggestion.detail ? <Text style={styles.detail}>{suggestion.detail}</Text> : null}{suggestion.excerpt ? <View style={styles.evidence}><Text style={styles.evidenceLabel}>EXCERTO DE ORIGEM</Text><Text style={styles.evidenceText}>{suggestion.excerpt}</Text><Text style={styles.evidenceLocation}>{suggestion.characterStart !== undefined ? `Caracteres ${suggestion.characterStart + 1}–${suggestion.characterEnd ?? suggestion.characterStart + suggestion.value.length}` : 'Texto extraído'}</Text></View> : null}</View>{suggestion.accepted ? <Text style={styles.added}>ADICIONADO</Text> : null}</Pressable>; })}
    </View>
    <View style={styles.footer}><View><Text style={styles.footerText}>{selected.length} elemento{selected.length === 1 ? '' : 's'} selecionado{selected.length === 1 ? '' : 's'}</Text><Pressable onPress={finishWithoutAdding}><Text style={styles.finishWithout}>Concluir sem adicionar elementos</Text></Pressable></View><View style={styles.footerButton}><AppButton disabled={!selected.length} onPress={apply}>Adicionar ao contexto do Caso</AppButton></View></View>
  </ScrollView></View></SafeAreaView>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, wrap: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 20 }, content: { gap: 17, paddingBottom: 45 }, summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 18, borderRadius: radius.xl, backgroundColor: colors.primary }, summaryEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: .9 }, summaryTitle: { marginTop: 5, color: colors.background, fontSize: 17, fontWeight: '900' }, summaryMeta: { marginTop: 4, color: colors.primarySoft, fontSize: 9 }, status: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primaryLight }, statusText: { color: colors.primary, fontSize: 8, fontWeight: '900' }, preview: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }, sectionTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '900' }, caption: { marginTop: 3, color: colors.textSoft, fontSize: 9 }, previewText: { color: colors.textMuted, fontSize: 10, lineHeight: 17 }, truncated: { marginTop: 12, color: colors.accent, fontSize: 8, fontWeight: '800' }, review: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, selectAll: { color: colors.primary, fontSize: 9, fontWeight: '900' }, suggestion: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border }, suggestionSelected: { marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.md, backgroundColor: colors.primaryLight }, suggestionAccepted: { opacity: .7 }, check: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 7, backgroundColor: colors.surface }, checkActive: { borderColor: colors.primary, backgroundColor: colors.primary }, checkText: { color: colors.background, fontSize: 11, fontWeight: '900' }, suggestionCopy: { flex: 1 }, kind: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: .7 }, value: { marginTop: 4, color: colors.textStrong, fontSize: 11, lineHeight: 17, fontWeight: '700' }, detail: { marginTop: 3, color: colors.textSoft, fontSize: 8 }, evidence:{marginTop:10,padding:10,borderLeftWidth:3,borderLeftColor:colors.accent,borderRadius:radius.sm,backgroundColor:colors.background},evidenceLabel:{color:colors.accent,fontSize:7,fontWeight:'900',letterSpacing:.6},evidenceText:{marginTop:5,color:colors.textMuted,fontSize:9,lineHeight:15},evidenceLocation:{marginTop:6,color:colors.textSoft,fontSize:7}, added: { color: colors.successText, fontSize: 7, fontWeight: '900' }, footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 15, borderRadius: radius.xl, backgroundColor: colors.primaryLight }, footerText: { color: colors.textMuted, fontSize: 9 }, finishWithout:{marginTop:7,color:colors.primary,fontSize:8,fontWeight:'800',textDecorationLine:'underline'},footerButton: { minWidth: 240 }, empty: { padding: 24, color: colors.textMuted, fontSize: 11, textAlign: 'center' }, errorBox: { padding: 15, borderRadius: radius.lg, backgroundColor: colors.warningBackground }, errorTitle: { color: colors.danger, fontSize: 11, fontWeight: '900' }, errorText: { marginTop: 4, color: colors.warningText, fontSize: 9, lineHeight: 15 } });
