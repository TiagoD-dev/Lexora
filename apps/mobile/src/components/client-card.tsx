import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
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

  const contact = client.phone || client.email || 'Sem contacto registado';

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 35)} style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.avatar, { backgroundColor: theme.bg }]}><Text style={[styles.avatarText, { color: theme.fg }]}>{initials}</Text></View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text numberOfLines={1} style={styles.name}>{client.name}</Text>
            <View style={[styles.statusPill, inactive && styles.statusPillInactive]}>
              <View style={[styles.statusDot, inactive && styles.statusDotInactive]} />
              <Text style={[styles.statusText, inactive && styles.statusTextInactive]}>{client.status}</Text>
            </View>
          </View>
          <View style={styles.typeRow}><Icon name={isCompany ? 'domain' : 'account-outline'} size={12} color={colors.textSoft} /><Text numberOfLines={1} style={styles.meta}>{isCompany ? 'Empresa' : 'Particular'} · NIF {client.nif || '—'}</Text></View>
          <View style={styles.typeRow}><Icon name={client.phone ? 'phone-outline' : client.email ? 'email-outline' : 'alert-circle-outline'} size={12} color={colors.textSoft} /><Text numberOfLines={1} style={styles.meta}>{contact}</Text></View>
        </View>
        <View style={styles.side}>
          <View style={styles.caseChip}><Text style={styles.caseChipText}>{caseCount}</Text><Text style={styles.caseChipLabel}>{caseCount === 1 ? 'Caso' : 'Casos'}</Text></View>
          <View style={styles.quick}>
            {client.phone ? <Pressable accessibilityRole="link" accessibilityLabel={`Ligar a ${client.name}`} hitSlop={6} onPress={() => Linking.openURL(`tel:${client.phone.replace(/\s/g, '')}`)} style={styles.quickButton}><Icon name="phone-outline" size={15} color={colors.primary} /></Pressable> : null}
            {client.email ? <Pressable accessibilityRole="link" accessibilityLabel={`Enviar email a ${client.name}`} hitSlop={6} onPress={() => Linking.openURL(`mailto:${client.email}`)} style={styles.quickButton}><Icon name="email-outline" size={15} color={colors.primary} /></Pressable> : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 320, flexBasis: 420, flexGrow: 1 },
  card: { minHeight: 96, height: '100%', flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  avatar: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  avatarText: { fontSize: 15, fontWeight: '900' },
  content: { flex: 1, marginHorizontal: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: colors.textStrong, fontSize: 15, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.successBackground },
  statusPillInactive: { backgroundColor: colors.surfaceMuted },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.successText },
  statusDotInactive: { backgroundColor: colors.textSoft },
  statusText: { color: colors.successText, fontSize: 9, fontWeight: '800' },
  statusTextInactive: { color: colors.textMuted },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  meta: { flexShrink: 1, color: colors.textSoft, fontSize: 12 },
  side: { alignItems: 'center', gap: 8 },
  quick: { flexDirection: 'row', gap: 6 },
  quickButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  caseChip: { alignItems: 'center', minWidth: 52, paddingHorizontal: 9, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: colors.primaryLight },
  caseChipText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  caseChipLabel: { marginTop: 1, color: colors.primary, fontSize: 8, fontWeight: '800' },
});
