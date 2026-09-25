import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

export function StatTiles({ items }: { items: { icon: IconName; value: number; label: string; warn?: boolean }[] }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <View style={styles.stats}>{items.map((item) => <View key={item.label} style={styles.stat}>
    <View style={[styles.statIcon, item.warn && styles.statIconWarn]}><Icon name={item.icon} size={18} color={item.warn ? colors.warningText : colors.primary} /></View>
    <View style={styles.statCopy}><Text style={styles.statValue}>{item.value}</Text><Text numberOfLines={1} style={styles.statLabel}>{item.label}</Text></View>
  </View>)}</View>;
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (text: string) => void; placeholder: string; label: string }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <View style={styles.search}>
    <Icon name="magnify" size={20} color={colors.textMuted} />
    <TextInput accessibilityLabel={label} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.placeholder} returnKeyType="search" value={value} style={styles.searchInput} />
    {value ? <Pressable accessibilityLabel="Limpar pesquisa" hitSlop={8} onPress={() => onChange('')}><Icon name="close-circle" size={18} color={colors.textSoft} /></Pressable> : null}
  </View>;
}

export function FilterChip({ icon, label, count, active, onPress }: { icon: IconName; label: string; count: number; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
    <Icon name={icon} size={15} color={active ? colors.background : colors.textMuted} />
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    <Text style={[styles.filterCount, active && styles.filterTextActive]}>{count}</Text>
  </Pressable>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  statIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primaryLight },
  statIconWarn: { backgroundColor: colors.warningBackground },
  statCopy: { flexShrink: 1 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.surface },
  searchInput: { flex: 1, minHeight: 50, color: colors.text, fontSize: 16 },
  filter: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterCount: { color: colors.textSoft, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.background },
});
