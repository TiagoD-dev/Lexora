import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { SelectField } from '@/components/select-field';
import { LEGAL_AREAS } from '@/constants/legal-areas';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CasePriority, CaseStatus, LegalCase } from '@/types/case';
import { hashTheme } from '@/utils/palette';
import { priorityTheme } from '@/utils/priority';

export type CaseFormValue = Pick<LegalCase, 'title' | 'client' | 'clientId' | 'area' | 'court' | 'processNumber' | 'responsible' | 'priority' | 'description' | 'status'>;
const statuses: CaseStatus[] = ['Rascunho', 'Em análise', 'Concluído'];
const priorities: CasePriority[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export function CaseForm({ initial, submitLabel, onSubmit }: { initial?: Partial<CaseFormValue>; submitLabel: string; onSubmit: (value: CaseFormValue) => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const { clients } = useClients();
  const availableClients = clients.filter((client) => client.status === 'Ativo' || client.id === initial?.clientId);
  const [value, setValue] = useState<CaseFormValue>({ title: '', client: '', clientId: undefined, area: 'Direito do Trabalho', court: '', processNumber: '', responsible: 'Tiago', priority: 'Normal', description: '', status: 'Rascunho', ...initial });
  const set = <K extends keyof CaseFormValue>(key: K, next: CaseFormValue[K]) => setValue((current) => ({ ...current, [key]: next }));
  const valid = value.title.trim() && value.client.trim() && value.description.trim();
  const icon = hashTheme(colors, value.area || 'novo-caso');
  const priority = priorityTheme(colors, value.priority);

  return <View style={styles.form}>
    <View style={styles.hero}>
      <View style={[styles.icon, { backgroundColor: icon.bg }]}><Text style={[styles.iconText, { color: icon.fg }]}>§</Text></View>
      <View style={styles.heroCopy}>
        <Text numberOfLines={1} style={styles.heroName}>{value.title.trim() || 'Novo Caso'}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>{value.area}</Text>
          <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}><Text style={[styles.priorityText, { color: priority.fg }]}>{value.priority}</Text></View>
        </View>
      </View>
    </View>

    <Text style={styles.sectionLabel}>ASSUNTO E CLIENTE</Text>
    <View style={styles.card}>
      <AppInput label="Título do caso *" value={value.title} onChangeText={(text) => set('title', text)} placeholder="Ex.: Cessação do contrato" />
      {availableClients.length > 0 ? <SelectField label="Cliente *" value={value.client || 'Selecionar cliente'} options={availableClients.map((client) => client.name)} onChange={(name) => { const client = availableClients.find((item) => item.name === name); setValue((current) => ({ ...current, client: name, clientId: client?.id })); }} /> : <Text style={styles.helper}>Ainda não existem clientes. Cria primeiro uma ficha em "Clientes".</Text>}
      <SelectField label="Área jurídica" value={value.area} options={LEGAL_AREAS} onChange={(area) => set('area', area)} />
    </View>

    <Text style={styles.sectionLabel}>TRIBUNAL E PROCESSO</Text>
    <View style={styles.card}>
      <AppInput label="Tribunal ou entidade" value={value.court} onChangeText={(text) => set('court', text)} placeholder="Opcional" />
      <AppInput label="Número de processo" value={value.processNumber} onChangeText={(text) => set('processNumber', text)} placeholder="Opcional" />
      <AppInput label="Responsável" value={value.responsible} onChangeText={(text) => set('responsible', text)} placeholder="Nome do responsável" />
    </View>

    <Text style={styles.sectionLabel}>PRIORIDADE E CONTEXTO</Text>
    <View style={styles.card}>
      <View style={styles.field}>
        <Text style={styles.label}>Prioridade</Text>
        <View style={styles.chips}>{priorities.map((item) => { const active = value.priority === item; const tone = priorityTheme(colors, item); return <Pressable key={item} onPress={() => set('priority', item)} style={[styles.chip, active && { borderColor: tone.fg, backgroundColor: tone.bg }]}><Text style={[styles.chipText, active && { color: tone.fg, fontWeight: '800' }]}>{item}</Text></Pressable>; })}</View>
      </View>
      <AppInput label="Descrição *" multiline value={value.description} onChangeText={(text) => set('description', text)} placeholder="Factos, datas e contexto relevante…" />
    </View>

    <Text style={styles.sectionLabel}>ESTADO</Text>
    <View style={styles.card}>
      <View style={styles.chips}>{statuses.map((status) => <Pressable key={status} onPress={() => set('status', status)} style={[styles.chip, value.status === status && styles.active]}><Text style={[styles.chipText, value.status === status && styles.activeText]}>{status}</Text></Pressable>)}</View>
    </View>

    <AppButton disabled={!valid} onPress={() => onSubmit({ ...value, title: value.title.trim(), client: value.client.trim(), court: value.court.trim() || 'Sem tribunal atribuído', description: value.description.trim() })}>{submitLabel}</AppButton>
  </View>;
}
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  form: { gap: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: radius.xl, backgroundColor: colors.primary },
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  iconText: { fontSize: 22, fontWeight: '700' },
  heroCopy: { flex: 1 },
  heroName: { color: colors.white, fontSize: 18, fontWeight: '900' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  heroMeta: { color: colors.primarySoft, fontSize: 11, fontWeight: '700' },
  priorityPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: 9, fontWeight: '800' },
  sectionLabel: { marginTop: 10, marginBottom: -2, color: colors.textSoft, fontSize: 10, fontWeight: '800', letterSpacing: .9, textTransform: 'uppercase' },
  card: { gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  field: { gap: 8 },
  label: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  active: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  activeText: { color: colors.background },
});
