import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, euros, Feedback, Hero, Panel, PreviewPage, Row } from '@/components/business-preview';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { useAuth } from '@/providers/auth-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { createLeadRemote, LEAD_STAGES as stages, listLeadsRemote, updateLeadRemote, type Lead, type LeadStage as Stage } from '@/services/leads-service';
import { radius, type ThemeColors } from '@/theme';

const AREAS = ['Laboral', 'Família', 'Cobranças', 'Arrendamento', 'Societário'];
const SOURCES = ['Website', 'Recomendação', 'Telefone'];
const SOURCE_ICON: Record<string, IconName> = { Website: 'web', Recomendação: 'account-heart-outline', Telefone: 'phone-outline' };
const DAY = 86400000;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('');
const age = (iso: string) => { const days = Math.floor((Date.now() - Date.parse(iso)) / DAY); return days === 0 ? 'hoje' : days === 1 ? 'há 1 dia' : `há ${days} dias`; };

export default function IntakePage() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors); const router = useRouter();
  const { user } = useAuth(); const { createClient } = useClients();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | Stage>('Todos');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('Laboral');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('Website');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState('');
  const [feedback, setFeedback] = useState('');
  const valid = !!name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const proposalValue = Number(proposal.replace(',', '.'));
  const count = (stage: Stage) => leads.filter(lead => lead.stage === stage).length;
  const active = leads.filter(lead => lead.stage !== 'Contratado');
  const conversion = leads.length ? Math.round(count('Contratado') / leads.length * 100) : 0;
  const stageColor: Record<Stage, string> = { 'Novo contacto': '#DDB0AC', Consulta: '#D9B454', Proposta: '#F7F1E4', Contratado: '#8BD3AA' };
  useEffect(() => {
    if (!user) return;
    let active = true; setLoading(true);
    listLeadsRemote().then(items => { if (active) setLeads(items); }).catch((error: Error) => { if (active) setFeedback(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);
  async function save(id: string, patch: Parameters<typeof updateLeadRemote>[1], message: string) {
    try { const saved = await updateLeadRemote(id, patch); setLeads(current => current.map(lead => lead.id === id ? saved : lead)); setFeedback(message); return true; }
    catch (error) { setFeedback((error as Error).message); return false; }
  }
  const changeStage = (id: string, stage: Stage) => save(id, { stage }, stage === 'Contratado' ? 'Contratado. Cria a ficha de cliente para começar a trabalhar o caso.' : `Movido para «${stage}».`);
  async function addLead() {
    try {
      const lead = await createLeadRemote({ name: name.trim(), email: email.trim(), area, source, notes: notes.trim() });
      setLeads(current => [lead, ...current]); setName(''); setEmail(''); setNotes(''); setOpen(false); setFilter('Todos'); setFeedback('Contacto adicionado.');
    } catch (error) { setFeedback((error as Error).message); }
  }
  async function convert(lead: Lead) {
    const clientId = lead.clientId || createClient({ name: lead.name, type: 'Particular', status: 'Ativo', nif: '', email: lead.email, phone: '', address: '', notes: lead.notes });
    if (!lead.clientId && !await save(lead.id, { clientId }, 'Ficha de cliente criada.')) return;
    router.push({ pathname: '/clients/[id]', params: { id: clientId } });
  }
  return <PreviewPage title="Captação de clientes" subtitle="Acompanha cada oportunidade, desde o primeiro contacto até à contratação.">
    <Hero label="PROPOSTAS EM ABERTO" value={euros(leads.filter(lead => lead.stage === 'Proposta').reduce((sum, lead) => sum + lead.value, 0))} caption={`${active.length} ${active.length === 1 ? 'oportunidade ativa' : 'oportunidades ativas'} · taxa de conversão ${conversion}%`}>
      <View style={styles.funnel}>{stages.map(stage => count(stage) > 0 && <View key={stage} style={{ flex: count(stage), backgroundColor: stageColor[stage] }} />)}</View>
      <View style={styles.legend}>{stages.map(stage => <View key={stage} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: stageColor[stage] }]} /><Text style={styles.legendText}>{stage} · {count(stage)}</Text></View>)}</View>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={styles.heroButton}><Icon name={open ? 'close' : 'account-plus-outline'} size={18} color="#3D1319" /><Text style={styles.heroButtonText}>{open ? 'Fechar formulário' : 'Novo contacto'}</Text></Pressable>
    </Hero>

    {open && <Panel title="Novo contacto">
      <AppInput label="Nome / empresa" value={name} onChangeText={setName} />
      <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Copy strong>Área de interesse</Copy><Choices values={AREAS} value={area} onChange={setArea} />
      <Copy strong>Origem</Copy>
      <View style={styles.sources}>{SOURCES.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === source }} onPress={() => setSource(item)} style={[styles.source, item === source && styles.sourceActive]}><Icon name={SOURCE_ICON[item]!} size={20} color={item === source ? colors.primary : colors.textMuted} /><Text style={[styles.sourceText, item === source && { color: colors.primary }]}>{item}</Text></Pressable>)}</View>
      <AppInput label="Resumo do pedido" multiline value={notes} onChangeText={setNotes} />
      <AppButton disabled={!valid} onPress={addLead}>Adicionar contacto</AppButton>
      {!valid && <Copy>Introduz um nome e um email válido.</Copy>}
    </Panel>}
    <Feedback>{feedback}</Feedback>

    {loading && <Panel title="A carregar contactos"><Copy>Um momento…</Copy></Panel>}
    {!loading && !leads.length && <EmptyState symbol="account-plus-outline" title="Sem contactos" description="Adiciona o primeiro contacto para acompanhar a oportunidade até à contratação." />}
    {!!leads.length && <Choices values={['Todos', ...stages] as const} value={filter} onChange={setFilter} counts={{ Todos: leads.length, ...Object.fromEntries(stages.map(stage => [stage, count(stage)])) }} />}
    {leads.filter(lead => filter === 'Todos' || lead.stage === filter).map(lead => {
      const index = stages.indexOf(lead.stage); const next = stages[index + 1]; const won = lead.stage === 'Contratado';
      return <View key={lead.id} style={styles.lead}>
        <View style={[styles.stripe, { backgroundColor: won ? colors.successText : colors.accent }]} />
        <View style={styles.leadTop}>
          <View style={[styles.avatar, won && { backgroundColor: colors.successBackground }]}><Text style={[styles.avatarText, won && { color: colors.successText }]}>{initials(lead.name)}</Text></View>
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.leadName}>{lead.name}</Text><View style={styles.leadMeta}><Icon name={SOURCE_ICON[lead.source] ?? 'web'} size={14} color={colors.textSoft} /><Text style={styles.metaText}>{lead.source} · {age(lead.createdAt)}</Text></View></View>
          <Text style={styles.areaChip}>{lead.area}</Text>
        </View>
        {lead.notes ? <Text style={styles.notes}>{lead.notes}</Text> : null}
        <View style={styles.stepper}>{stages.map((stage, step) => <Pressable key={stage} accessibilityRole="button" accessibilityLabel={`Mover para ${stage}`} accessibilityState={{ selected: step === index }} onPress={() => changeStage(lead.id, stage)} style={styles.step}>
          <View style={[styles.stepBar, { backgroundColor: step <= index ? (won ? colors.successText : colors.primary) : colors.border }]} />
          <Text numberOfLines={1} style={[styles.stepText, step === index && { color: colors.textStrong, fontWeight: '900' }]}>{stage}</Text>
        </Pressable>)}</View>
        {lead.value > 0 && <View style={styles.valueRow}><Text style={styles.valueLabel}>{won ? 'HONORÁRIOS ACORDADOS' : 'PROPOSTA'}</Text><Text style={styles.value}>{euros(lead.value)}</Text></View>}
        <View style={styles.actions}>
          {next && <Pressable accessibilityRole="button" onPress={() => changeStage(lead.id, next)} style={[styles.action, styles.actionPrimary]}><Text style={[styles.actionText, { color: colors.white }]}>Avançar para {next}</Text><Icon name="arrow-right" size={16} color={colors.white} /></Pressable>}
          {won && <Pressable accessibilityRole="button" onPress={() => convert(lead)} style={[styles.action, styles.actionPrimary]}><Icon name="account-plus-outline" size={16} color={colors.white} /><Text style={[styles.actionText, { color: colors.white }]}>{lead.clientId ? 'Abrir ficha de cliente' : 'Criar ficha de cliente'}</Text></Pressable>}
          {!won && <Pressable accessibilityRole="button" onPress={() => { setSelectedId(selectedId === lead.id ? null : lead.id); setProposal(lead.value ? String(lead.value) : ''); }} style={styles.action}><Icon name="file-sign" size={16} color={colors.textStrong} /><Text style={styles.actionText}>Proposta</Text></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel={`Enviar email a ${lead.name}`} onPress={() => Linking.openURL(`mailto:${lead.email}`)} style={styles.action}><Icon name="email-outline" size={16} color={colors.textStrong} /><Text style={styles.actionText}>Email</Text></Pressable>
        </View>
        {selectedId === lead.id && <View style={styles.proposal}>
          <Text style={styles.valueLabel}>PROPOSTA DE HONORÁRIOS · {lead.area.toUpperCase()}</Text>
          <Copy>O âmbito e as condições serão revistos pelo advogado antes do envio.</Copy>
          <AppInput label="Honorários propostos (€), sem IVA" value={proposal} onChangeText={setProposal} keyboardType="decimal-pad" />
          <Row><AppButton disabled={!Number.isFinite(proposalValue) || proposalValue <= 0} onPress={async () => { if (await save(lead.id, { value: Math.round(proposalValue * 100) / 100, stage: 'Proposta' }, 'Proposta guardada. Nenhum email foi enviado.')) setSelectedId(null); }}>Guardar proposta</AppButton><AppButton variant="ghost" onPress={() => setSelectedId(null)}>Cancelar</AppButton></Row>
        </View>}
      </View>;
    })}
    {!!leads.length && !leads.some(lead => filter === 'Todos' || lead.stage === filter) && <Panel title="Sem contactos nesta etapa"><Copy>Altera o filtro ou adiciona um contacto.</Copy></Panel>}
  </PreviewPage>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  funnel: { height: 10, flexDirection: 'row', gap: 3, marginTop: 12, borderRadius: 5, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: '#F3E1DF', fontSize: 12, fontWeight: '700' },
  heroButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderRadius: radius.md, backgroundColor: '#D9B454' }, heroButtonText: { color: '#3D1319', fontSize: 14, fontWeight: '900' },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, source: { flexGrow: 1, flexBasis: 110, alignItems: 'center', gap: 6, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  sourceActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, sourceText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  lead: { overflow: 'hidden', gap: 12, paddingVertical: 16, paddingRight: 16, paddingLeft: 21, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 }, leadTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.primaryLight }, avatarText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  leadName: { color: colors.textStrong, fontSize: 16, fontWeight: '800' }, leadMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }, metaText: { color: colors.textSoft, fontSize: 12 },
  areaChip: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.warningBackground, color: colors.warningText, fontSize: 11, fontWeight: '800' },
  notes: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  stepper: { flexDirection: 'row', gap: 6 }, step: { flex: 1, gap: 6, paddingVertical: 4 }, stepBar: { height: 5, borderRadius: 3 }, stepText: { color: colors.textSoft, fontSize: 10, fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  valueLabel: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, value: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, action: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm },
  actionPrimary: { borderColor: '#7A1620', backgroundColor: '#7A1620' }, actionText: { color: colors.textStrong, fontSize: 12, fontWeight: '800' },
  proposal: { gap: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: radius.sm, backgroundColor: colors.background },
});
