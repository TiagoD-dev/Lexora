import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { ChoiceCard, FormProgress, FormRow, FormSection } from '@/components/form-section';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { useConflictCheck } from '@/services/conflicts-service';
import { radius, type ThemeColors } from '@/theme';
import type { ClientDraft, ClientStatus } from '@/types/client';
import { hashTheme } from '@/utils/palette';

const statuses: ClientStatus[] = ['Ativo', 'Inativo'];
export function ClientForm({ initial, submitLabel, onSubmit }: { initial?: Partial<ClientDraft>; submitLabel: string; onSubmit: (value: ClientDraft) => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [value, setValue] = useState<ClientDraft>({ name: '', type: 'Particular', status: 'Ativo', nif: '', email: '', phone: '', address: '', notes: '', ...initial });
  const set = <K extends keyof ClientDraft>(key: K, next: ClientDraft[K]) => setValue((current) => ({ ...current, [key]: next }));
  const isCompany = value.type === 'Empresa';
  const hasContact = !!(value.email.trim() || value.phone.trim());
  const missing = [!value.name.trim() && (isCompany ? 'denominação' : 'nome'), !hasContact && 'email ou telefone'].filter((item): item is string => !!item);
  const valid = missing.length === 0;
  const initials = value.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const theme = hashTheme(colors, value.name || 'novo-cliente');
  const contact = value.email.trim() || value.phone.trim();
  const conflicts = useConflictCheck(value.name, value.nif).cases;

  return <View style={styles.form}>
    <View style={styles.hero}>
      <View style={[styles.avatar, { backgroundColor: theme.bg }]}>{initials ? <Text style={[styles.avatarText, { color: theme.fg }]}>{initials}</Text> : <Icon name={isCompany ? 'domain' : 'account-outline'} size={28} color={theme.fg} />}</View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>PRÉ-VISUALIZAÇÃO DA FICHA</Text>
        <Text numberOfLines={1} style={styles.heroName}>{value.name.trim() || 'Novo cliente'}</Text>
        <View style={styles.heroMetaRow}>
          <Text numberOfLines={1} style={styles.heroMeta}>{value.type}{contact ? ` · ${contact}` : ''}</Text>
          <View style={[styles.statusPill, value.status === 'Inativo' && styles.statusPillInactive]}>
            <View style={[styles.statusDot, value.status === 'Inativo' && styles.statusDotInactive]} />
            <Text style={[styles.statusText, value.status === 'Inativo' && styles.statusTextInactive]}>{value.status}</Text>
          </View>
        </View>
        <FormProgress done={2 - missing.length} total={2} missing={missing} />
      </View>
    </View>

    <FormSection step={1} icon="card-account-details-outline" title="Identificação" hint="Pessoa singular ou coletiva." done={!!value.name.trim()}>
      <View style={styles.choices}>
        <ChoiceCard icon="account-outline" title="Particular" detail="Pessoa singular" active={!isCompany} onPress={() => set('type', 'Particular')} />
        <ChoiceCard icon="domain" title="Empresa" detail="Pessoa coletiva" active={isCompany} onPress={() => set('type', 'Empresa')} />
      </View>
      <FormRow>
        <AppInput label={isCompany ? 'Denominação social *' : 'Nome completo *'} value={value.name} onChangeText={(text) => set('name', text)} placeholder={isCompany ? 'Ex.: Lexora, Lda.' : 'Nome do cliente'} />
        <AppInput label={isCompany ? 'NIPC' : 'NIF'} value={value.nif} onChangeText={(text) => set('nif', text)} placeholder="Opcional" keyboardType="number-pad" />
      </FormRow>
      {conflicts.length > 0 && <Text accessibilityRole="alert" style={styles.conflict}>Possível conflito de interesses: figura como parte contrária em {conflicts.map((item) => `${item.reference} (${item.title})`).join(', ')}.</Text>}
    </FormSection>

    <FormSection step={2} icon="card-account-phone-outline" title="Contacto" hint="Indica pelo menos um email ou telefone." done={hasContact}>
      <FormRow>
        <AppInput label="Email" value={value.email} onChangeText={(text) => set('email', text)} placeholder="nome@exemplo.pt" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <AppInput label="Telefone" value={value.phone} onChangeText={(text) => set('phone', text)} placeholder="+351 …" keyboardType="phone-pad" autoComplete="tel" />
      </FormRow>
      <AppInput label="Morada" value={value.address} onChangeText={(text) => set('address', text)} placeholder="Rua, n.º, código postal, localidade" />
    </FormSection>

    <FormSection step={3} icon="note-text-outline" title="Estado e notas" hint="Clientes inativos não aparecem ao criar casos.">
      <View style={styles.chips}>{statuses.map((status) => { const active = value.status === status; const tone = status === 'Ativo' ? { bg: colors.successBackground, fg: colors.successText } : { bg: colors.surfaceMuted, fg: colors.textMuted }; return <Pressable key={status} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => set('status', status)} style={[styles.chip, active && { borderColor: tone.fg, backgroundColor: tone.bg }]}><View style={[styles.statusDot, { backgroundColor: tone.fg }]} /><Text style={[styles.chipText, active && { color: tone.fg, fontWeight: '800' }]}>{status}</Text></Pressable>; })}</View>
      <AppInput label="Notas" multiline value={value.notes} onChangeText={(text) => set('notes', text)} placeholder="Preferências de contacto e informação relevante…" />
    </FormSection>

    <AppButton disabled={!valid} onPress={() => onSubmit(Object.fromEntries(Object.entries(value).map(([key, text]) => [key, typeof text === 'string' ? text.trim() : text])) as ClientDraft)}>{submitLabel}</AppButton>
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, borderLeftColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.surface },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  avatarText: { fontSize: 22, fontWeight: '900' },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroMeta: { flexShrink: 1, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.successBackground },
  statusPillInactive: { backgroundColor: colors.surfaceMuted },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.successText },
  statusDotInactive: { backgroundColor: colors.textSoft },
  statusText: { color: colors.successText, fontSize: 10, fontWeight: '800' },
  statusTextInactive: { color: colors.textMuted },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  conflict: { padding: 12, borderRadius: radius.md, backgroundColor: colors.warningBackground, color: colors.warningText, fontSize: 12, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
