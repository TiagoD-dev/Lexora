import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

const benefits = [
  { symbol: '▤', title: 'Documentos que se tornam contexto', text: 'Carrega o processo. A Lexora extrai factos, entidades e datas para revisão.' },
  { symbol: '✓', title: 'Factos sempre verificáveis', text: 'Cada afirmação mantém ligação ao documento, excerto e localização de origem.' },
  { symbol: '◷', title: 'Prazos sob controlo', text: 'Organiza tarefas, recorrências e datas importantes dentro do respetivo Caso.' },
];

const steps = [
  ['01', 'Carrega', 'Adiciona os documentos relevantes ao Caso.'],
  ['02', 'Revê', 'Confirma o que entra no contexto profissional.'],
  ['03', 'Trabalha', 'Consulta factos, fontes e próximos passos num só lugar.'],
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const compact = width < 820;
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <BrandLogo styles={styles} />
          <View style={styles.navActions}>
            {!compact ? <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={styles.navLink}><Text style={styles.navLinkText}>Planos</Text></Pressable> : null}
            <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginText}>Iniciar sessão</Text></Pressable>
          </View>
        </View>

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <View style={styles.eyebrowPill}><Text style={styles.eyebrow}>INTELIGÊNCIA JURÍDICA POR CASO</Text></View>
            <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>Do documento à decisão, com cada fonte à vista.</Text>
            <Text style={styles.heroText}>A Lexora organiza os factos, mostra o que falta e ajuda a preparar o próximo passo — sempre com revisão humana e contexto isolado por Caso.</Text>
            <View style={[styles.heroActions, compact && styles.heroActionsCompact]}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Experimentar a Lexora</Text><Text style={styles.primaryArrow}>→</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>Conhecer os planos</Text></Pressable>
            </View>
            <View style={styles.trustLine}><Text style={styles.trustCheck}>✓</Text><Text style={styles.trustText}>Revisão profissional obrigatória</Text><Text style={styles.trustDot}>•</Text><Text style={styles.trustText}>Contexto separado por Caso</Text></View>
          </View>

          <CaseIntelligencePreview styles={styles} />
        </View>

        <View style={styles.proofBar}>
          <Proof value="Fontes visíveis" label="Não confies numa resposta sem saber de onde veio." styles={styles} />
          <View style={styles.proofDivider} />
          <Proof value="Controlo humano" label="Nada entra no Caso sem revisão e confirmação." styles={styles} />
          <View style={styles.proofDivider} />
          <Proof value="Direito português" label="Pensada para a realidade de profissionais em Portugal." styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>MENOS TEMPO A PROCURAR. MAIS TEMPO A DECIDIR.</Text>
          <Text style={styles.sectionTitle}>Um espaço de trabalho que compreende cada Caso.</Text>
          <Text style={styles.sectionLead}>A informação deixa de estar dispersa entre ficheiros, notas e conversas. A Lexora reúne-a numa estrutura clara e auditável.</Text>
          <View style={styles.benefitGrid}>{benefits.map((benefit) => <View key={benefit.title} style={styles.benefitCard}><View style={styles.benefitIcon}><Text style={styles.benefitSymbol}>{benefit.symbol}</Text></View><Text style={styles.benefitTitle}>{benefit.title}</Text><Text style={styles.benefitText}>{benefit.text}</Text></View>)}</View>
        </View>

        <View style={[styles.workflow, compact && styles.workflowCompact]}>
          <View style={styles.workflowCopy}><Text style={styles.workflowEyebrow}>SIMPLES DESDE O PRIMEIRO CASO</Text><Text style={styles.workflowTitle}>Carregar. Rever. Trabalhar.</Text><Text style={styles.workflowText}>Sem configurações intermináveis ou uma curva de aprendizagem pesada. Começa com um documento real e vê o contexto tomar forma.</Text></View>
          <View style={styles.stepList}>{steps.map(([number, title, text], index) => <View key={number} style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View>{index < steps.length - 1 ? <View style={styles.stepLine} /> : null}</View>)}</View>
        </View>

        <View style={styles.finalCta}>
          <Text style={styles.finalEyebrow}>A PRIMEIRA ANÁLISE COMEÇA AQUI</Text>
          <Text style={styles.finalTitle}>Transforma um conjunto de documentos num Caso compreensível.</Text>
          <Text style={styles.finalText}>Experimenta gratuitamente. Manténs sempre o controlo sobre o que é confirmado e utilizado.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [styles.finalButton, pressed && styles.pressed]}><Text style={styles.finalButtonText}>Começar agora</Text><Text style={styles.finalButtonArrow}>→</Text></Pressable>
        </View>

        <View style={styles.footer}><BrandLogo compact styles={styles} /><Text style={styles.footerText}>Informação e organização jurídica. Não substitui a análise de um profissional habilitado.</Text><Text style={styles.footerMeta}>© 2026 Lexora · Portugal</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BrandLogo({ compact = false, styles }: { compact?: boolean; styles: ReturnType<typeof makeStyles> }) {
  return <View style={[styles.logoSurface, compact && styles.logoSurfaceCompact]}><Image accessibilityLabel="Lexora" resizeMode="contain" source={require('../../assets/brand/lexora-logo.png')} style={[styles.logoImage, compact && styles.logoImageCompact]} /></View>;
}

function CaseIntelligencePreview({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.previewShell}><View style={styles.previewGlow} /><View style={styles.previewCard}>
    <View style={styles.previewTop}><View><Text style={styles.previewEyebrow}>CASO · LEX-2026-014</Text><Text style={styles.previewTitle}>Cessação contratual</Text></View><View style={styles.previewStatus}><Text style={styles.previewStatusText}>EM ANÁLISE</Text></View></View>
    <View style={styles.previewStats}><PreviewStat value="8" label="Factos" styles={styles} /><PreviewStat value="4" label="Documentos" styles={styles} /><PreviewStat value="2" label="Por confirmar" warning styles={styles} /></View>
    <View style={styles.insightCard}><View style={styles.insightTop}><Text style={styles.insightKind}>FACTO CONFIRMADO</Text><Text style={styles.insightCheck}>✓</Text></View><Text style={styles.insightText}>O contrato prevê um aviso prévio de 30 dias.</Text><View style={styles.sourceBox}><Text style={styles.sourceLabel}>FONTE</Text><Text style={styles.sourceName}>Contrato de prestação.pdf</Text><Text style={styles.sourceExcerpt}>“A denúncia deverá ser comunicada com uma antecedência mínima de 30 dias…”</Text><Text style={styles.sourceLocation}>Página 4 · Cláusula 8.ª</Text></View></View>
    <View style={styles.previewAction}><Text style={styles.previewActionIcon}>✦</Text><View style={styles.previewActionCopy}><Text style={styles.previewActionTitle}>Contexto pronto para consulta</Text><Text style={styles.previewActionText}>Apenas os elementos confirmados serão utilizados.</Text></View><Text style={styles.previewActionArrow}>›</Text></View>
  </View></View>;
}

function PreviewStat({ value, label, warning, styles }: { value: string; label: string; warning?: boolean; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.previewStat}><Text style={[styles.previewStatValue, warning && styles.previewStatWarning]}>{value}</Text><Text style={styles.previewStatLabel}>{label}</Text></View>; }
function Proof({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.proof}><Text style={styles.proofValue}>{value}</Text><Text style={styles.proofLabel}>{label}</Text></View>; }

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, page: { paddingBottom: 0 }, pressed: { opacity: .72 },
  nav: { width: '100%', maxWidth: 1200, alignSelf: 'center', minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }, navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, navLink: { paddingHorizontal: 16, paddingVertical: 12 }, navLinkText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' }, loginButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 17, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.surface }, loginText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  logoSurface: { width: 220, height: 64, overflow: 'hidden', borderRadius: radius.md, backgroundColor: '#F7F4EB' }, logoSurfaceCompact: { width: 164, height: 48 }, logoImage: { position: 'absolute', top: -34, left: 0, width: 220, height: 124 }, logoImageCompact: { top: -25, width: 164, height: 92 },
  hero: { width: '100%', maxWidth: 1200, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 56, minHeight: 610, paddingHorizontal: 24, paddingVertical: 54 }, heroCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 42, paddingTop: 38 }, heroCopy: { flex: 1 }, eyebrowPill: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primaryLight }, eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, heroTitle: { maxWidth: 620, marginTop: 20, color: colors.text, fontSize: 50, lineHeight: 56, fontWeight: '900', letterSpacing: -1.5 }, heroTitleCompact: { fontSize: 38, lineHeight: 44 }, heroText: { maxWidth: 600, marginTop: 20, color: colors.textMuted, fontSize: 16, lineHeight: 26 }, heroActions: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 30 }, heroActionsCompact: { flexDirection: 'column', alignItems: 'stretch' }, primaryButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 22, borderRadius: radius.lg, backgroundColor: colors.primary }, primaryText: { color: colors.white, fontSize: 12, fontWeight: '900' }, primaryArrow: { color: colors.accent, fontSize: 18 }, secondaryButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, backgroundColor: colors.surface }, secondaryText: { color: colors.textStrong, fontSize: 12, fontWeight: '800' }, trustLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 20 }, trustCheck: { color: colors.successText, fontSize: 10, fontWeight: '900' }, trustText: { color: colors.textSoft, fontSize: 9 }, trustDot: { color: colors.borderStrong, fontSize: 10 },
  previewShell: { flex: 1, minWidth: 310, maxWidth: 520, alignSelf: 'center', position: 'relative', padding: 12 }, previewGlow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.xxl, backgroundColor: colors.primaryLight, transform: [{ rotate: '3deg' }] }, previewCard: { position: 'relative', padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xxl, backgroundColor: colors.surface, boxShadow: '0 22px 55px rgba(18,55,42,0.16)' }, previewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, previewEyebrow: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: .8 }, previewTitle: { marginTop: 6, color: colors.textStrong, fontSize: 18, fontWeight: '900' }, previewStatus: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.warningBackground }, previewStatusText: { color: colors.warningText, fontSize: 7, fontWeight: '900' }, previewStats: { flexDirection: 'row', gap: 8, marginTop: 18 }, previewStat: { flex: 1, padding: 11, borderRadius: radius.md, backgroundColor: colors.background }, previewStatValue: { color: colors.primary, fontSize: 19, fontWeight: '900' }, previewStatWarning: { color: colors.accent }, previewStatLabel: { marginTop: 2, color: colors.textSoft, fontSize: 7 }, insightCard: { marginTop: 12, padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background }, insightTop: { flexDirection: 'row', justifyContent: 'space-between' }, insightKind: { color: colors.successText, fontSize: 7, fontWeight: '900', letterSpacing: .7 }, insightCheck: { color: colors.successText, fontSize: 12, fontWeight: '900' }, insightText: { marginTop: 9, color: colors.textStrong, fontSize: 12, lineHeight: 18, fontWeight: '800' }, sourceBox: { marginTop: 13, padding: 11, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: radius.sm, backgroundColor: colors.surface }, sourceLabel: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: .6 }, sourceName: { marginTop: 4, color: colors.textStrong, fontSize: 9, fontWeight: '800' }, sourceExcerpt: { marginTop: 7, color: colors.textMuted, fontSize: 8, lineHeight: 13, fontStyle: 'italic' }, sourceLocation: { marginTop: 6, color: colors.textSoft, fontSize: 7 }, previewAction: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingHorizontal: 13, borderRadius: radius.md, backgroundColor: colors.primary }, previewActionIcon: { color: colors.accent, fontSize: 15 }, previewActionCopy: { flex: 1 }, previewActionTitle: { color: colors.white, fontSize: 9, fontWeight: '900' }, previewActionText: { marginTop: 3, color: colors.primarySoft, fontSize: 7 }, previewActionArrow: { color: colors.accent, fontSize: 18 },
  proofBar: { width: '100%', maxWidth: 1152, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 18, padding: 22, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, proof: { minWidth: 210, flex: 1, paddingHorizontal: 12 }, proofValue: { color: colors.primary, fontSize: 12, fontWeight: '900' }, proofLabel: { marginTop: 5, color: colors.textMuted, fontSize: 9, lineHeight: 14 }, proofDivider: { width: 1, minHeight: 42, backgroundColor: colors.border },
  section: { width: '100%', maxWidth: 1152, alignSelf: 'center', paddingHorizontal: 4, paddingVertical: 105 }, sectionEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, textAlign: 'center' }, sectionTitle: { maxWidth: 680, alignSelf: 'center', marginTop: 13, color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: '900', textAlign: 'center' }, sectionLead: { maxWidth: 650, alignSelf: 'center', marginTop: 13, color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: 'center' }, benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 38 }, benefitCard: { minWidth: 240, flex: 1, padding: 22, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, benefitIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primaryLight }, benefitSymbol: { color: colors.primary, fontSize: 17, fontWeight: '900' }, benefitTitle: { marginTop: 17, color: colors.textStrong, fontSize: 15, fontWeight: '900' }, benefitText: { marginTop: 8, color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  workflow: { width: '100%', maxWidth: 1152, alignSelf: 'center', flexDirection: 'row', gap: 60, padding: 48, borderRadius: radius.xxl, backgroundColor: '#7A1620' }, workflowCompact: { flexDirection: 'column', gap: 35, marginHorizontal: 20, width: 'auto', padding: 28 }, workflowCopy: { flex: 1 }, workflowEyebrow: { color: '#B4872B', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, workflowTitle: { marginTop: 13, color: '#F7F1E4', fontSize: 31, fontWeight: '900' }, workflowText: { maxWidth: 450, marginTop: 14, color: '#DDB0AC', fontSize: 11, lineHeight: 19 }, stepList: { flex: 1 }, step: { minHeight: 82, flexDirection: 'row', position: 'relative', gap: 14 }, stepNumber: { zIndex: 1, width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: '#B4872B' }, stepNumberText: { color: '#7A1620', fontSize: 8, fontWeight: '900' }, stepCopy: { flex: 1, paddingTop: 2 }, stepTitle: { color: '#F7F1E4', fontSize: 13, fontWeight: '900' }, stepText: { marginTop: 5, color: '#DDB0AC', fontSize: 9, lineHeight: 14 }, stepLine: { position: 'absolute', top: 34, left: 17, width: 1, height: 48, backgroundColor: '#5E3235' },
  finalCta: { width: '100%', maxWidth: 1152, alignSelf: 'center', alignItems: 'center', marginVertical: 105, paddingHorizontal: 24 }, finalEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, finalTitle: { maxWidth: 700, marginTop: 14, color: colors.text, fontSize: 34, lineHeight: 41, fontWeight: '900', textAlign: 'center' }, finalText: { maxWidth: 560, marginTop: 12, color: colors.textMuted, fontSize: 11, lineHeight: 18, textAlign: 'center' }, finalButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 25, paddingHorizontal: 24, borderRadius: radius.lg, backgroundColor: colors.primary }, finalButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' }, finalButtonArrow: { color: colors.accent, fontSize: 18 },
  footer: { minHeight: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, paddingHorizontal: 28, paddingVertical: 25, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }, footerText: { maxWidth: 460, color: colors.textSoft, fontSize: 8, lineHeight: 13, textAlign: 'center' }, footerMeta: { color: colors.textSoft, fontSize: 8 },
});
