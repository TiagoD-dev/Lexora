import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { Client } from '@/types/client';
import { hashTheme } from '@/utils/palette';

type ClientCardProps = { client: Client; caseCount: number; onPress: () => void; index?: number };

export function ClientCard({ client, caseCount, onPress, index = 0 }: ClientCardProps) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const initials = client.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '?';
  const theme = hashTheme(colors, client.id || client.name);
  const inactive = client.status === 'Inativo';
  const isCompany = client.type === 'Empresa';

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 35)} style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.top}>
          <View style={[styles.avatar, { backgroundColor: theme.bg }]}><Text style={[styles.avatarText, { color: theme.fg }]}>{initials}</Text></View>
          <View style={[styles.statusPill, inactive && styles.statusPillInactive]}>
            <View style={[styles.statusDot, inactive && styles.statusDotInactive]} />
            <Text style={[styles.statusText, inactive && styles.statusTextInactive]}>{client.status}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.name}>{client.name}</Text>
        <Text style={styles.type}>{isCompany ? '◇  Empresa' : '○  Particular'}</Text>
        <View style={styles.divider} />
        <View style={styles.footer}>
          <Text numberOfLines={1} style={styles.contact}>{client.email || client.phone || 'Sem contacto registado'}</Text>
          <View style={styles.caseChip}><Text style={styles.caseChipText}>{caseCount} {caseCount === 1 ? 'Caso' : 'Casos'}</Text></View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 260, flexBasis: 280, flexGrow: 1 },
  card: { height: '100%', padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  avatarText: { fontSize: 15, fontWeight: '900' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.successBackground },
  statusPillInactive: { backgroundColor: colors.surfaceMuted },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.successText },
  statusDotInactive: { backgroundColor: colors.textSoft },
  statusText: { color: colors.successText, fontSize: 9, fontWeight: '800' },
  statusTextInactive: { color: colors.textMuted },
  name: { marginTop: 14, color: colors.textStrong, fontSize: 16, fontWeight: '800' },
  type: { marginTop: 3, color: colors.textSoft, fontSize: 11, fontWeight: '600' },
  divider: { height: 1, marginTop: 14, marginBottom: 12, backgroundColor: colors.border },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  contact: { flex: 1, color: colors.textMuted, fontSize: 11 },
  caseChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  caseChipText: { color: colors.primary, fontSize: 9, fontWeight: '800' },
});
