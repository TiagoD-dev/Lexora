import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { useConflictCheck } from '@/services/conflicts-service';
import { radius, type ThemeColors } from '@/theme';
import type { ClientDraft, ClientStatus, ClientType } from '@/types/client';
import { hashTheme } from '@/utils/palette';

const types: ClientType[] = ['Particular', 'Empresa']; const statuses: ClientStatus[] = ['Ativo', 'Inativo'];
export function ClientForm({ initial, submitLabel, onSubmit }: { initial?: Partial<ClientDraft>; submitLabel: string; onSubmit: (value: ClientDraft) => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [value, setValue] = useState<ClientDraft>({ name: '', type: 'Particular', status: 'Ativo', nif: '', email: '', phone: '', address: '', notes: '', ...initial });
  const set = <K extends keyof ClientDraft>(key: K, next: ClientDraft[K]) => setValue((current) => ({ ...current, [key]: next }));
  const valid = value.name.trim() && (value.email.trim() || value.phone.trim());
  const initials = value.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '?';
  const theme = hashTheme(colors, value.name || 'novo-cliente');
  const isCompany = value.type === 'Empresa';
  const conflicts = useConflictCheck(value.name, value.nif).cases;

  return <View style={styles.form}>
    <View style={styles.hero}>
      <View style={[styles.avatar, { backgroundColor: theme.bg }]}><Text style={[styles.avatarText, { color: theme.fg }]}>{initials}</Text></View>
      <View style={styles.heroCopy}>
        <Text numberOfLines={1} style={styles.heroName}>{value.name.trim() || 'Novo cliente'}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>{isCompany ? 'Empresa' : 'Particular'}</Text>
          <View style={[styles.statusPill, value.status === 'Inativo' && styles.statusPillInactive]}>
            <View style={[styles.statusDot, value.status === 'Inativo' && styles.statusDotInactive]} />
            <Text style={[styles.statusText, value.status === 'Inativo' && styles.statusTextInactive]}>{value.status}</Text>
          </View>
        </View>
      </View>
    </View>

    <Text style={styles.sectionLabel}>TIPO E ESTADO</Text>
    <View style={styles.card}>
      <View style={styles.field}>
        <Text style={styles.label}>Tipo de cliente</Text>
        <View style={styles.chips}>{types.map((type) => <Pressable key={type} onPress={() => set('type', type)} style={[styles.chip, value.type === type && styles.active]}><Text style={[styles.chipText, value.type === type && styles.activeText]}>{type}</Text></Pressable>)}</View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Estado</Text>
        <View style={styles.chips}>{statuses.map((status) => { const active = value.status === status; const tone = status === 'Ativo' ? { bg: colors.successBackground, fg: colors.successText } : { bg: colors.surfaceMuted, fg: colors.textMuted }; return <Pressable key={status} onPress={() => set('status', status)} style={[styles.chip, active && { borderColor: tone.fg, backgroundColor: tone.bg }]}><Text style={[styles.chipText, active && { color: tone.fg, fontWeight: '800' }]}>{status}</Text></Pressable>; })}</View>
      </View>
    </View>

    <Text style={styles.sectionLabel}>IDENTIFICAÇÃO</Text>
    <View style={styles.card}>
      <AppInput label={isCompany ? 'Denominação social *' : 'Nome completo *'} value={value.name} onChangeText={(text) => set('name', text)} placeholder={isCompany ? 'Ex.: Lexora, Lda.' : 'Nome do cliente'} />
      <AppInput label="NIF / NIPC" value={value.nif} onChangeText={(text) => set('nif', text)} placeholder="Opcional" />
    </View>
    {conflicts.length > 0 && <Text accessibilityRole="alert" style={styles.conflict}>Possível conflito de interesses: figura como parte contrária em {conflicts.map((item) => `${item.reference} (${item.title})`).join(', ')}.</Text>}

    <Text style={styles.sectionLabel}>CONTACTO</Text>
    <View style={styles.card}>
      <AppInput label="Email" value={value.email} onChangeText={(text) => set('email', text)} placeholder="nome@exemplo.pt" />
      <AppInput label="Telefone" value={value.phone} onChangeText={(text) => set('phone', text)} placeholder="+351 …" />
      <AppInput label="Morada" value={value.address} onChangeText={(text) => set('address', text)} placeholder="Morada completa" />
      <Text style={styles.helper}>É necessário indicar pelo menos um email ou telefone.</Text>
    </View>

    <Text style={styles.sectionLabel}>NOTAS</Text>
    <View style={styles.card}>
      <AppInput label="Notas" multiline value={value.notes} onChangeText={(text) => set('notes', text)} placeholder="Preferências de contacto e informação relevante…" />
    </View>

    <AppButton disabled={!valid} onPress={() => onSubmit(Object.fromEntries(Object.entries(value).map(([key, text]) => [key, typeof text === 'string' ? text.trim() : text])) as ClientDraft)}>{submitLabel}</AppButton>
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: radius.xl, backgroundColor: colors.primary },
  avatar: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  avatarText: { fontSize: 20, fontWeight: '900' },
  heroCopy: { flex: 1 },
  heroName: { color: colors.white, fontSize: 18, fontWeight: '900' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  heroMeta: { color: colors.primarySoft, fontSize: 11, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.successBackground },
  statusPillInactive: { backgroundColor: colors.surfaceMuted },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.successText },
  statusDotInactive: { backgroundColor: colors.textSoft },
  statusText: { color: colors.successText, fontSize: 9, fontWeight: '800' },
  statusTextInactive: { color: colors.textMuted },
  sectionLabel: { marginTop: 10, marginBottom: -2, color: colors.textSoft, fontSize: 10, fontWeight: '800', letterSpacing: .9, textTransform: 'uppercase' },
  card: { gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  field: { gap: 8 },
  label: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  conflict: { padding: 12, borderRadius: radius.md, backgroundColor: colors.warningBackground, color: colors.warningText, fontSize: 12, lineHeight: 18 },
  helper: { marginTop: -8, color: colors.textMuted, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  active: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  activeText: { color: colors.background },
});
