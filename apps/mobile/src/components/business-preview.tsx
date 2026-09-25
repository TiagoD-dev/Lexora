import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/theme-provider';

export function PreviewPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.page}>
    <View style={styles.content}>
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>LEXORA · ESCRITÓRIO</Text>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>{title}</Text>
      <Copy>{subtitle}</Copy>
      <View style={[styles.notice, { backgroundColor: colors.warningBackground }]}><Text style={{ color: colors.warningText, fontSize: 13, lineHeight: 20 }}>Demonstração · Dados fictícios. As alterações são temporárias e reiniciam ao recarregar. Não são enviados documentos, mensagens ou cobranças.</Text></View>
      {children}
    </View>
  </ScrollView>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 19, fontWeight: '700' }}>{title}</Text>{children}
  </View>;
}

export function Copy({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  const { colors } = useAppTheme();
  return <Text style={{ color: strong ? colors.text : colors.textMuted, fontSize: 14, lineHeight: 22, fontWeight: strong ? '600' : '400' }}>{children}</Text>;
}

export function Row({ children }: { children: ReactNode }) { return <View style={styles.row}>{children}</View>; }

export function Metrics({ items }: { items: { label: string; value: string }[] }) {
  const { colors } = useAppTheme();
  return <Row>{items.map(item => <View key={item.label} style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Copy>{item.label}</Copy><Text style={{ color: colors.primary, fontSize: 26, fontWeight: '700' }}>{item.value}</Text>
  </View>)}</Row>;
}

export function Choices<T extends string>({ values, value, onChange, counts }: { values: readonly T[]; value: T; onChange: (value: T) => void; counts?: Partial<Record<T, number>> }) {
  const { colors } = useAppTheme();
  return <Row>{values.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: option === value }} onPress={() => onChange(option)} style={[styles.choice, { backgroundColor: option === value ? colors.primaryLight : colors.surface, borderColor: option === value ? colors.primary : colors.border }]}>
    <Text style={{ color: option === value ? colors.primary : colors.textMuted, fontSize: 14, fontWeight: '600' }}>{option}{counts?.[option] !== undefined ? <Text style={{ fontWeight: '900' }}>{`  ${counts[option]}`}</Text> : null}</Text>
  </Pressable>)}</Row>;
}

export function Feedback({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return children ? <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.successText, backgroundColor: colors.successBackground, lineHeight: 21 }]}>{children}</Text> : null;
}

/** Cartão de resumo bordô (mesmo estilo do Copilot na ficha do caso). */
export function Hero({ label, value, caption, children }: { label: string; value: string; caption?: string; children?: ReactNode }) {
  return <View style={styles.hero}>
    <View style={styles.heroRing} />
    <Text style={{ color: '#D9B454', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }}>{label}</Text>
    <Text style={{ color: '#F7F1E4', fontSize: 36, fontWeight: '900' }}>{value}</Text>
    {caption ? <Text style={{ color: '#DDB0AC', fontSize: 13, lineHeight: 19 }}>{caption}</Text> : null}
    {children}
  </View>;
}

export function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={{ color: '#DDB0AC', fontSize: 11, fontWeight: '700' }}>{label}</Text><Text style={{ color: '#F7F1E4', fontSize: 17, fontWeight: '900' }}>{value}</Text></View>;
}

export const euros =(value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 48 }, content: { width: '100%', maxWidth: 1160, alignSelf: 'center', gap: 18 },
  panel: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 14 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  metric: { flexGrow: 1, flexBasis: 190, borderWidth: 1, borderRadius: 16, padding: 18, gap: 8 },
  choice: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 }, notice: { padding: 14, borderRadius: 12 },
  hero: { overflow: 'hidden', gap: 6, padding: 22, borderRadius: 20, backgroundColor: '#7A1620' },
  heroRing: { position: 'absolute', top: -70, right: -60, width: 200, height: 200, borderWidth: 36, borderColor: '#5E1119', borderRadius: 100 },
  stat: { flexGrow: 1, flexBasis: 120, gap: 2, padding: 12, borderRadius: 12, backgroundColor: '#5E1119' },
});
