import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '@/components/app-input';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { hashTheme } from '@/utils/palette';

const sources = [
  { type: 'LEGISLAÇÃO', title: 'Código do Trabalho', detail: 'Lei n.º 7/2009 · versão a confirmar' },
  { type: 'JURISPRUDÊNCIA', title: 'Decisões relacionadas com cessação', detail: 'Fontes demonstrativas do caso atual' },
];

export default function SourcesScreen() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const legislacao = sources.filter((source) => source.type === 'LEGISLAÇÃO').length;
  const jurisprudencia = sources.filter((source) => source.type === 'JURISPRUDÊNCIA').length;
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>BASE DE CONHECIMENTO</Text>
          <Text style={styles.pageTitle}>Fontes jurídicas</Text>
          <Text style={styles.pageSubtitle}>Legislação e jurisprudência utilizadas nas análises.</Text>
        </View>
        <View style={styles.hero}>
          <HeroStat value={sources.length} label="Total" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={legislacao} label="Legislação" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={jurisprudencia} label="Jurisprudência" styles={styles} />
        </View>
        <AppInput accessibilityLabel="Pesquisar fontes" placeholder="Pesquisar legislação ou jurisprudência..." />
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Fontes verificadas</Text>
          <Text style={styles.infoText}>Cada referência indicará a redação temporal e a passagem que suporta a resposta.</Text>
        </View>
        <Text style={styles.sectionTitle}>Consultadas recentemente</Text>
        <View style={styles.list}>
          {sources.map((source) => {
            const icon = hashTheme(colors, source.type);
            return (
              <Pressable key={source.title} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: icon.bg }]}><Text style={[styles.iconText, { color: icon.fg }]}>§</Text></View>
                <View style={styles.copy}>
                  <Text style={styles.type}>{source.type}</Text>
                  <Text style={styles.title}>{source.title}</Text>
                  <Text style={styles.detail}>{source.detail}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.heroStat}><Text style={styles.heroValue}>{value}</Text><Text style={styles.heroLabel}>{label}</Text></View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  pageIntro: { paddingTop: 20 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  pageTitle: { marginTop: 5, color: colors.text, fontSize: 26, fontWeight: '700' },
  pageSubtitle: { marginTop: 5, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: radius.xxl, backgroundColor: colors.primary },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: colors.background, fontSize: 26, fontWeight: '900' },
  heroLabel: { marginTop: 3, color: colors.primarySoft, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .6 },
  heroDivider: { width: 1, height: 34, backgroundColor: colors.primaryLight, opacity: 0.35 },
  info: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.primaryLight },
  infoTitle: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  infoText: { marginTop: 5, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { marginTop: 10, marginBottom: -4, color: colors.text, fontSize: 18, fontWeight: '700' },
  list: { gap: 12 },
  card: { minHeight: 92, flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.7 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  iconText: { fontSize: 20, fontWeight: '700' },
  copy: { flex: 1, marginHorizontal: 12 },
  type: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title: { marginTop: 3, color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  detail: { marginTop: 4, color: colors.textMuted, fontSize: 11 },
  chevron: { color: colors.textSoft, fontSize: 24 },
});
