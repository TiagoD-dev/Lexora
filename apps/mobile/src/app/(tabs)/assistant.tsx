import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAssistant } from '@/providers/assistant-provider';
import { useCases } from '@/providers/cases-provider';
import { Icon } from '@/components/icon';
import { EmptyState } from '@/components/empty-state';
import { StatTiles } from '@/components/list-kit';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { hashTheme } from '@/utils/palette';

export default function AssistantScreen() {
  const router = useRouter(); const { cases } = useCases(); const { threads, createThread } = useAssistant();
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const activeCases = cases.filter((item) => item.status !== 'Arquivado');
  const openCase = (caseId: string, fresh = false) => { const existing = fresh ? undefined : threads.find((thread) => thread.caseId === caseId); const threadId = existing?.id ?? createThread(caseId); router.push({ pathname: '/assistant/[caseId]' as never, params: { caseId, threadId } } as never); };
  return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.intro}><Text style={styles.eyebrow}>ASSISTENTE CONTEXTUAL</Text><Text style={styles.title}>Assistente Lexora por Caso</Text><Text style={styles.subtitle}>Cada conversa fica isolada no respetivo Caso e utiliza apenas os factos, entidades, questões e documentos aí registados.</Text></View>
    <StatTiles items={[{ icon: 'briefcase-outline', value: activeCases.length, label: 'Casos disponíveis' }, { icon: 'forum-outline', value: threads.length, label: 'Conversas guardadas' }, { icon: 'comment-question-outline', value: threads.reduce((sum, thread) => sum + thread.messages.filter((message) => message.role === 'user').length, 0), label: 'Perguntas realizadas' }]} />
    <View style={styles.notice}><Icon name="shield-check-outline" size={18} color={colors.primary} /><Text style={styles.noticeText}><Text style={styles.noticeTitle}>Separação de contexto. </Text>O assistente não mistura informação entre Casos. Confirma sempre documentos, datas e fontes antes de utilizar uma resposta.</Text></View>
    <Text style={styles.sectionTitle}>Escolher um Caso</Text>{activeCases.length ? null : <EmptyState symbol="briefcase-outline" title="Ainda sem Casos ativos" description="Cria um Caso para começares a conversar com o assistente sobre ele." />}<View style={styles.grid}>{activeCases.map((item) => { const count = threads.filter((thread) => thread.caseId === item.id).length; const icon = hashTheme(colors, item.area || item.id); return <Pressable key={item.id} onPress={() => openCase(item.id)} style={({ pressed }) => [styles.caseCard, pressed && styles.pressed]}><View style={styles.caseTop}><View style={[styles.caseIcon,{backgroundColor:icon.bg}]}><Icon name="gavel" size={17} color={icon.fg}/></View><View style={styles.caseTopCopy}><Text style={styles.reference}>{item.reference}</Text><Text style={styles.count}>{count} conversa{count === 1 ? '' : 's'}</Text></View></View><Text style={styles.caseTitle}>{item.title}</Text><Text style={styles.caseMeta}>{item.client} · {item.area}</Text><View style={styles.context}><Context value={item.facts.length} label="factos" styles={styles}/><Context value={item.entities.length} label="entidades" styles={styles}/><Context value={item.documents.length} label="documentos" styles={styles}/></View><View style={styles.openRow}><Text style={styles.open}>{count ? 'Continuar conversa' : 'Começar conversa'}</Text><Icon name="arrow-right" size={16} color={colors.primary}/></View></Pressable>; })}</View>
    {threads.length ? <><Text style={styles.sectionTitle}>Conversas recentes</Text><View style={styles.list}>{threads.slice(0, 8).map((thread) => { const item = cases.find((entry) => entry.id === thread.caseId); if (!item) return null; const icon = hashTheme(colors, item.area || item.id); return <Pressable key={thread.id} onPress={() => router.push({ pathname: '/assistant/[caseId]' as never, params: { caseId: item.id, threadId: thread.id } } as never)} style={styles.thread}><View style={[styles.threadIcon,{backgroundColor:icon.bg}]}><Icon name="creation" size={17} color={icon.fg}/></View><View style={styles.threadCopy}><Text numberOfLines={1} style={styles.threadTitle}>{thread.title}</Text><Text style={styles.threadMeta}>{item.reference} · {thread.messages.length} mensagens</Text></View><Icon name="chevron-right" size={20} color={colors.textSoft}/></Pressable>; })}</View></> : null}
  </ScrollView></SafeAreaView>;
}
function Context({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof makeStyles> }) { return <Text style={styles.contextText}><Text style={styles.contextValue}>{value}</Text> {label}</Text>; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 45 },
  intro: { paddingTop: 24, paddingBottom: 6 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { maxWidth: 720, marginTop: 6, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.primaryLight },
  noticeTitle: { color: colors.primary, fontWeight: '800' },
  noticeText: { flex: 1, color: colors.textStrong, fontSize: 12, lineHeight: 18 },
  sectionTitle: { marginTop: 14, color: colors.textSoft, fontSize: 11, fontWeight: '800', letterSpacing: .8, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  caseCard: { minWidth: 280, flex: 1, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: .75 },
  caseTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caseIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  caseTopCopy: { flex: 1 },
  reference: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: .8 },
  count: { marginTop: 2, color: colors.textSoft, fontSize: 11 },
  caseTitle: { marginTop: 12, color: colors.textStrong, fontSize: 16, fontWeight: '800' },
  caseMeta: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  context: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  contextText: { color: colors.textMuted, fontSize: 12 },
  contextValue: { color: colors.primary, fontWeight: '900' },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  open: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  list: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  thread: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  threadIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  threadCopy: { flex: 1 },
  threadTitle: { color: colors.textStrong, fontSize: 14, fontWeight: '800' },
  threadMeta: { marginTop: 3, color: colors.textSoft, fontSize: 12 },
});
