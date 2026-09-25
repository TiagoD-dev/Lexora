import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { LegalUpdate } from '@/types/legal-update';
import { hashTheme } from '@/utils/palette';

export const kindIcon: Record<LegalUpdate['sourceKind'], IconName> = { Portugal: 'bank-outline', 'União Europeia': 'star-circle-outline', Jurisprudência: 'gavel' };
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'Sem data';

export function LegalUpdateCard({ update }: { update: LegalUpdate }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const tone = hashTheme(colors, update.sourceKind);
  return <Pressable accessibilityRole="link" accessibilityLabel={`${update.title}. Abrir fonte original`} onPress={() => Linking.openURL(update.url)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.top}>
      <View style={[styles.symbol, { backgroundColor: tone.bg }]}><Icon name={kindIcon[update.sourceKind]} size={18} color={tone.fg} /></View>
      <View style={styles.grow}>
        <Text numberOfLines={1} style={styles.kind}>{update.sourceKind.toLocaleUpperCase('pt-PT')}</Text>
        <Text numberOfLines={1} style={styles.source}>{update.source}</Text>
      </View>
      {update.official ? <View style={styles.official}><Icon name="check-decagram" size={12} color={colors.successText} /><Text style={styles.officialText}>Oficial</Text></View> : null}
    </View>
    <Text numberOfLines={3} style={styles.title}>{update.title}</Text>
    {update.summary ? <Text numberOfLines={2} style={styles.summary}>{update.summary}</Text> : null}
    {update.areas.length ? <View style={styles.areas}>{update.areas.slice(0, 3).map((area) => <Text key={area} numberOfLines={1} style={styles.area}>{area}</Text>)}</View> : null}
    <View style={styles.footer}>
      <View style={styles.dateRow}><Icon name="calendar-blank-outline" size={13} color={colors.textSoft} /><Text style={styles.date}>{formatDate(update.publishedAt)}</Text></View>
      <View style={styles.dateRow}><Text style={styles.open}>Abrir fonte</Text><Icon name="open-in-new" size={14} color={colors.primary} /></View>
    </View>
  </Pressable>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 300, minWidth: 260, maxWidth: '100%', gap: 10, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  symbol: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  grow: { flex: 1 },
  kind: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .7 },
  source: { marginTop: 1, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  official: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.successBackground },
  officialText: { color: colors.successText, fontSize: 10, fontWeight: '800' },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  summary: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  areas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  area: { maxWidth: 200, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { color: colors.textSoft, fontSize: 12 },
  open: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});
