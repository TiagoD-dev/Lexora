import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '@/components/app-input';
import { useLegalUpdates } from '@/providers/legal-updates-provider';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { hashTheme } from '@/utils/palette';
import type { LegalUpdate } from '@/types/legal-update';

const typeOf = (update: LegalUpdate) => (update.sourceKind === 'Jurisprudência' ? 'JURISPRUDÊNCIA' : 'LEGISLAÇÃO');

export default function SourcesScreen() {
  const { updates, hydrated, error, refresh } = useLegalUpdates();
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return updates;
    return updates.filter((u) => u.title.toLowerCase().includes(q) || u.summary.toLowerCase().includes(q));
  }, [updates, query]);

  const legislacao = updates.filter((u) => typeOf(u) === 'LEGISLAÇÃO').length;
  const jurisprudencia = updates.filter((u) => typeOf(u) === 'JURISPRUDÊNCIA').length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>BASE DE CONHECIMENTO</Text>
          <Text style={styles.pageTitle}>Fontes jurídicas</Text>
          <Text style={styles.pageSubtitle}>Legislação e jurisprudência utilizadas nas análises.</Text>
        </View>
        <View style={styles.hero}>
          <HeroStat value={updates.length} label="Total" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={legislacao} label="Legislação" styles={styles} />
          <View style={styles.heroDivider} />
          <HeroStat value={jurisprudencia} label="Jurisprudência" styles={styles} />
        </View>
        <AppInput
          accessibilityLabel="Pesquisar fontes"
          placeholder="Pesquisar legislação ou jurisprudência..."
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Fontes verificadas</Text>
          <Text style={styles.infoText}>Cada referência indicará a redação temporal e a passagem que suporta a resposta.</Text>
        </View>
        <Text style={styles.sectionTitle}>Consultadas recentemente</Text>
        {!hydrated ? (
          <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>A consultar fontes oficiais…</Text></View>
        ) : error ? (
          <View style={styles.state}>
            <Text style={styles.stateText}>Não foi possível obter as fontes agora.</Text>
            <Pressable onPress={refresh}><Text style={styles.stateRetry}>Tentar novamente</Text></Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.state}><Text style={styles.stateText}>Sem fontes disponíveis de momento.</Text></View>
        ) : (
          <View style={styles.list}>
            {filtered.map((source) => {
              const type = typeOf(source);
              const icon = hashTheme(colors, type);
              return (
                <Pressable
                  key={source.id}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(source.url)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                >
                  <View style={[styles.icon, { backgroundColor: icon.bg }]}><Icon name="book-open-page-variant-outline" size={19} color={icon.fg} /></View>
                  <View style={styles.copy}>
                    <Text style={styles.type}>{type}</Text>
                    <Text numberOfLines={1} style={styles.title}>{source.title}</Text>
                    <Text numberOfLines={1} style={styles.detail}>{source.summary}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.textSoft} />
                </Pressable>
              );
            })}
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
  state: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  stateText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  stateRetry: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexGrow: 1, flexBasis: 280, minWidth: 260, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.7 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  iconText: { fontSize: 16, fontWeight: '700' },
  copy: { flex: 1, marginHorizontal: 10 },
  type: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title: { marginTop: 3, color: colors.textStrong, fontSize: 13, fontWeight: '700' },
  detail: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  chevron: { color: colors.textSoft, fontSize: 20 },
});
