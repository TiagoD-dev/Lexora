import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { FormProgress, FormRow, FormSection } from '@/components/form-section';
import { Icon, type IconName } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { LEGAL_AREAS } from '@/constants/legal-areas';
import { useClients } from '@/providers/clients-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { useConflictCheck } from '@/services/conflicts-service';
import { radius, type ThemeColors } from '@/theme';
import type { CasePriority, CaseStatus, LegalCase } from '@/types/case';
import { hashTheme } from '@/utils/palette';
import { priorityTheme } from '@/utils/priority';

export type CaseFormValue = Pick<LegalCase, 'title' | 'client' | 'clientId' | 'area' | 'court' | 'processNumber' | 'responsible' | 'priority' | 'description' | 'status'>;
const statuses: CaseStatus[] = ['Rascunho', 'Em análise', 'Concluído'];
const statusIcon: Record<CaseStatus, IconName> = { Rascunho: 'pencil-outline', 'Em análise': 'magnify', Concluído: 'check-circle-outline', Arquivado: 'archive-outline' };
const priorities: CasePriority[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export function CaseForm({ initial, submitLabel, onSubmit, askOpposingParty = false }: { initial?: Partial<CaseFormValue>; submitLabel: string; onSubmit: (value: CaseFormValue, opposingParty: string) => void; askOpposingParty?: boolean }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const router = useRouter();
  const { clients } = useClients();
  const { settings } = useSettings();
  const availableClients = clients.filter((client) => client.status === 'Ativo' || client.id === initial?.clientId);
  const [value, setValue] = useState<CaseFormValue>({ title: '', client: '', clientId: undefined, area: 'Direito do Trabalho', court: '', processNumber: '', responsible: settings.displayName.trim(), priority: 'Normal', description: '', status: 'Rascunho', ...initial });
  const [opposingParty, setOpposingParty] = useState('');
  const clientConflicts = useConflictCheck(value.client, clients.find((client) => client.id === value.clientId)?.nif).cases;
  const opposingConflicts = useConflictCheck(opposingParty).clients;
  const set = <K extends keyof CaseFormValue>(key: K, next: CaseFormValue[K]) => setValue((current) => ({ ...current, [key]: next }));
  const missing = [!value.title.trim() && 'título', !value.client.trim() && 'cliente', !value.description.trim() && 'descrição'].filter((item): item is string => !!item);
  const valid = missing.length === 0;
  const icon = hashTheme(colors, value.area || 'novo-caso');
  const priority = priorityTheme(colors, value.priority);

  return <View style={styles.form}>
    <View style={styles.hero}>
      <View style={[styles.icon, { backgroundColor: icon.bg }]}><Icon name="gavel" size={26} color={icon.fg} /></View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>PRÉ-VISUALIZAÇÃO</Text>
        <Text numberOfLines={1} style={styles.heroName}>{value.title.trim() || 'Novo Caso'}</Text>
        <View style={styles.heroMetaRow}>
          <Text numberOfLines={1} style={styles.heroMeta}>{value.client || 'Sem cliente'} · {value.area}</Text>
          <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}><Text style={[styles.priorityText, { color: priority.fg }]}>{value.priority}</Text></View>
        </View>
        <FormProgress done={3 - missing.length} total={3} missing={missing} />
      </View>
    </View>

    <FormSection step={1} icon="briefcase-outline" title="Assunto e cliente" hint="O essencial para identificar o caso." done={!!value.title.trim() && !!value.client.trim()}>
      <AppInput label="Título do caso *" value={value.title} onChangeText={(text) => set('title', text)} placeholder="Ex.: Cessação do contrato" />
      <FormRow>
        {availableClients.length > 0 ? <SelectField label="Cliente *" value={value.client || 'Selecionar cliente'} options={availableClients.map((client) => client.name)} onChange={(name) => { const client = availableClients.find((item) => item.name === name); setValue((current) => ({ ...current, client: name, clientId: client?.id })); }} /> : <View style={styles.field}>
          <Text style={styles.label}>Cliente *</Text>
          <Text style={styles.helper}>Ainda não existem clientes ativos. Cria primeiro uma ficha para poderes associar este caso.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/clients/new')} style={styles.secondaryButton}><Icon name="account-plus-outline" size={16} color={colors.primary} /><Text style={styles.secondaryButtonText}>Criar cliente</Text></Pressable>
        </View>}
        <SelectField label="Área jurídica" value={value.area} options={LEGAL_AREAS} onChange={(area) => set('area', area)} />
      </FormRow>
      {clientConflicts.length > 0 && <Text accessibilityRole="alert" style={styles.conflict}>Possível conflito de interesses: o cliente figura como parte contrária em {clientConflicts.map((item) => `${item.reference} (${item.title})`).join(', ')}.</Text>}
      {askOpposingParty && <AppInput label="Parte contrária" value={opposingParty} onChangeText={setOpposingParty} placeholder="Opcional" />}
      {opposingConflicts.length > 0 && <Text accessibilityRole="alert" style={styles.conflict}>Possível conflito de interesses: a parte contrária é cliente do escritório ({opposingConflicts.map((item) => item.name).join(', ')}).</Text>}
    </FormSection>

    <FormSection step={2} icon="scale-balance" title="Tribunal e processo" hint="Opcional — podes completar mais tarde." done={!!value.court.trim() && !!value.processNumber.trim()}>
      <FormRow>
        <AppInput label="Tribunal ou entidade" value={value.court} onChangeText={(text) => set('court', text)} placeholder="Ex.: Juízo do Trabalho de Lisboa" />
        <AppInput label="Número de processo" value={value.processNumber} onChangeText={(text) => set('processNumber', text)} placeholder="Ex.: 1234/26.0T8LSB" />
      </FormRow>
      <AppInput label="Responsável" value={value.responsible} onChangeText={(text) => set('responsible', text)} placeholder="Nome do responsável" />
    </FormSection>

    <FormSection step={3} icon="text-box-outline" title="Contexto e prioridade" hint="Os factos alimentam o assistente e a análise do caso." done={!!value.description.trim()}>
      <AppInput label="Descrição *" multiline value={value.description} onChangeText={(text) => set('description', text)} placeholder="Factos, datas e contexto relevante…" style={styles.description} />
      <View style={styles.field}>
        <Text style={styles.label}>Prioridade</Text>
        <View style={styles.chips}>{priorities.map((item) => { const active = value.priority === item; const tone = priorityTheme(colors, item); return <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => set('priority', item)} style={[styles.chip, active && { borderColor: tone.fg, backgroundColor: tone.bg }]}><View style={[styles.dot, { backgroundColor: tone.fg }]} /><Text style={[styles.chipText, active && { color: tone.fg, fontWeight: '800' }]}>{item}</Text></Pressable>; })}</View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Estado</Text>
        <View style={styles.chips}>{statuses.map((status) => { const active = value.status === status; return <Pressable key={status} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => set('status', status)} style={[styles.chip, active && styles.active]}><Icon name={statusIcon[status]} size={15} color={active ? colors.background : colors.textMuted} /><Text style={[styles.chipText, active && styles.activeText]}>{status}</Text></Pressable>; })}</View>
      </View>
    </FormSection>

    <AppButton disabled={!valid} onPress={() => onSubmit({ ...value, title: value.title.trim(), client: value.client.trim(), court: value.court.trim() || 'Sem tribunal atribuído', description: value.description.trim() }, opposingParty.trim())}>{submitLabel}</AppButton>
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, borderLeftColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.surface },
  icon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroMeta: { flexShrink: 1, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  priorityPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: 10, fontWeight: '800' },
  field: { gap: 8 },
  label: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  secondaryButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  description: { minHeight: 150 },
  conflict: { padding: 12, borderRadius: radius.md, backgroundColor: colors.warningBackground, color: colors.warningText, fontSize: 12, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  dot: { width: 8, height: 8, borderRadius: 4 },
  active: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  activeText: { color: colors.background },
});
