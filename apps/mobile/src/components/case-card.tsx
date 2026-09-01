import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StatusBadge } from '@/components/status-badge';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { LegalCase } from '@/types/case';
import { hashTheme } from '@/utils/palette';
import { priorityTheme } from '@/utils/priority';

type CaseCardProps = { item: LegalCase; onPress: () => void; index?: number };

export function CaseCard({ item, onPress, index = 0 }: CaseCardProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const updatedDate = new Date(item.updatedAt);
  const updated = Number.isNaN(updatedDate.getTime()) ? 'sem data' : new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(updatedDate);
  const icon = hashTheme(colors, item.area || item.id);
  const priority = priorityTheme(colors, item.priority);
  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 35)} style={styles.wrap}>
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: icon.bg }]}><Text style={[styles.iconText, { color: icon.fg }]}>§</Text></View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.reference}>{item.reference}</Text>
          <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}><Text style={[styles.priorityText, { color: priority.fg }]}>{item.priority}</Text></View>
        </View>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{item.client} · {item.area}</Text>
        <Text numberOfLines={1} style={styles.meta}>{item.court} · Atualizado {updated}</Text>
      </View>
      <StatusBadge status={item.status} />
    </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 320, flexBasis: 420, flexGrow: 1 },
  card: {
    minHeight: 116,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.75 },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  iconText: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, marginHorizontal: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  reference: { flex: 1, color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  priorityText: { fontSize: 8, fontWeight: '800' },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  meta: { marginTop: 5, color: colors.textSoft, fontSize: 11 },
});
