import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Copy, Feedback, Hero, Panel, PreviewPage, Stat } from '@/components/business-preview';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { createWorkflowRemote, deleteWorkflowRemote, listWorkflowsRemote, updateWorkflowRemote, type WorkflowRecord } from '@/services/workflows-service';
import { radius, type ThemeColors } from '@/theme';

const templates = {
  Laboral: { icon: 'briefcase-outline', documents: ['Contrato de trabalho', 'Recibos de vencimento', 'Comunicações relevantes'], steps: ['Consulta inicial', 'Recolher documentos', 'Rever factos e enquadramento', 'Preparar proposta de atuação'] },
  Família: { icon: 'account-group-outline', documents: ['Identificação necessária', 'Documentos da situação familiar', 'Informação financeira relevante'], steps: ['Consulta inicial', 'Identificar objetivos e intervenientes', 'Rever documentação', 'Preparar plano de acompanhamento'] },
  Cobranças: { icon: 'cash-multiple', documents: ['Faturas e documentos de suporte', 'Contrato ou encomenda', 'Histórico de comunicações'], steps: ['Identificar crédito e intervenientes', 'Conferir valores', 'Preparar comunicação para revisão', 'Avaliar resposta e próximos passos'] },
} as const satisfies Record<string, { icon: IconName; documents: readonly string[]; steps: readonly string[] }>;
const MODELS: { title: string; icon: IconName }[] = [{ title: 'Ficha de consulta', icon: 'clipboard-account-outline' }, { title: 'Pedido de documentação', icon: 'file-send-outline' }, { title: 'Resumo de acompanhamento', icon: 'text-box-check-outline' }];
type Area = keyof typeof templates;
type Step = { title: string; done: boolean };
type Workflow = { id: string; name: string; area: Area; steps: Step[] };
// Etapas vêm do modelo estático da área; o servidor guarda só os índices concluídos.
const toWorkflow = (record: WorkflowRecord): Workflow => { const area = (record.area in templates ? record.area : 'Laboral') as Area; return { id: record.id, name: record.name, area, steps: templates[area].steps.map((title, index) => ({ title, done: record.completed.includes(index) })) }; };
const AREAS = Object.keys(templates) as Area[];

export default function WorkflowsPage() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const [area, setArea] = useState<Area>('Laboral');
  const [name, setName] = useState('');
  const [active, setActive] = useState<Workflow[]>([]);
  const [feedback, setFeedback] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { listWorkflowsRemote().then(records => setActive(records.map(toWorkflow))).catch(() => setFeedback('Não foi possível carregar os fluxos.')).finally(() => setLoading(false)); }, []);
  const template = templates[area];
  const allSteps = active.flatMap(workflow => workflow.steps);
  const doneSteps = allSteps.filter(step => step.done).length;
  const share = allSteps.length ? Math.round(doneSteps / allSteps.length * 100) : 0;
  const finished = active.filter(workflow => workflow.steps.every(step => step.done)).length;
  const toggle = (workflow: Workflow, index: number) => {
    const completed = workflow.steps.map((step, i) => (i === index ? !step.done : step.done) ? i : -1).filter(i => i >= 0);
    updateWorkflowRemote(workflow.id, completed).then(record => setActive(current => current.map(item => item.id === record.id ? toWorkflow(record) : item))).catch(() => setFeedback('Não foi possível guardar a etapa.'));
  };
  const create = () => createWorkflowRemote({ name: name.trim(), area }).then(record => { setActive(current => [toWorkflow(record), ...current]); setName(''); setFeedback('Fluxo criado. Toca nas etapas para as marcar como concluídas.'); }).catch(() => setFeedback('Não foi possível criar o fluxo.'));
  const remove = (id: string) => deleteWorkflowRemote(id).then(() => setActive(current => current.filter(item => item.id !== id))).catch(() => setFeedback('Não foi possível remover o fluxo.'));

  return <PreviewPage title="Fluxos jurídicos" subtitle="Organiza o método do escritório em etapas claras, documentos pedidos e modelos reutilizáveis.">
    <Hero label="FLUXOS EM CURSO" value={String(active.length - finished)} caption={active.length ? `${doneSteps} de ${allSteps.length} etapas concluídas em ${active.length} ${active.length === 1 ? 'fluxo' : 'fluxos'}` : 'Escolhe uma área jurídica e inicia o primeiro fluxo guiado.'}>
      <View style={styles.track}><View style={[styles.fill, { width: `${share}%` }]} /></View>
      <View style={styles.row}><Stat label="Progresso global" value={`${share}%`} /><Stat label="Concluídos" value={String(finished)} /></View>
    </Hero>

    <SectionTitle icon="scale-balance" title="Área jurídica" styles={styles} />
    <View style={styles.row}>{AREAS.map(option => { const selected = option === area; return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { setArea(option); setModel(''); }} style={[styles.areaTile, selected && styles.areaSelected]}>
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}><Icon name={templates[option].icon} size={20} color={selected ? colors.white : colors.primary} /></View>
      <Text style={styles.areaName}>{option}</Text>
      <Text style={styles.muted}>{templates[option].steps.length} etapas · {templates[option].documents.length} documentos</Text>
    </Pressable>; })}</View>

    <Panel title={`Percurso · ${area}`}>
      <Copy>Modelo de acompanhamento. O advogado valida os passos e define os prazos de cada processo.</Copy>
      <Timeline steps={template.steps.map(title => ({ title, done: false }))} styles={styles} colors={colors} />
    </Panel>

    <Panel title="Documentos a reunir">
      {template.documents.map(document => <View key={document} style={styles.docRow}><View style={styles.iconBox}><Icon name="file-document-outline" size={18} color={colors.primary} /></View><Text style={styles.strong}>{document}</Text></View>)}
    </Panel>

    <Panel title="Modelos do escritório">
      <View style={styles.row}>{MODELS.map(item => <Pressable key={item.title} accessibilityRole="button" onPress={() => setModel(`${item.title} · ${area}\n\nCliente: [nome]\nProcesso: [referência]\nResponsável: [advogado]\n\nObjetivo: [descrever]\n\nDocumentos:\n${template.documents.map(entry => `• ${entry}`).join('\n')}\n\nPróxima ação: [a definir]\nData de revisão: [a definir]`)} style={styles.modelTile}>
        <Icon name={item.icon} size={20} color={colors.primary} /><Text style={styles.strong}>{item.title}</Text><Icon name="chevron-right" size={18} color={colors.textMuted} />
      </Pressable>)}</View>
      {model ? <><AppInput label="Modelo editável" multiline value={model} onChangeText={setModel} style={{ minHeight: 300 }} /><Copy>Rascunho temporário para revisão; não é anexado a um processo.</Copy></> : null}
    </Panel>

    <View style={styles.cta}>
      <View style={styles.ctaHead}><View style={styles.iconBoxSelected}><Icon name="rocket-launch-outline" size={20} color={colors.white} /></View><View style={styles.grow}><Text style={styles.ctaTitle}>Iniciar fluxo de {area}</Text><Text style={styles.muted}>Cria um processo com as {template.steps.length} etapas deste modelo.</Text></View></View>
      <AppInput label="Nome do processo" value={name} onChangeText={setName} placeholder="Ex.: Ana Martins · Acompanhamento laboral" />
      <AppButton disabled={!name.trim()} onPress={create}>Iniciar fluxo</AppButton>
    </View>
    <Feedback>{feedback}</Feedback>

    <SectionTitle icon="timeline-check-outline" title={`Os meus fluxos (${active.length})`} styles={styles} />
    {loading && <ActivityIndicator color={colors.primary} />}
    {!loading && active.length === 0 && <EmptyState symbol="timeline-text-outline" title="Ainda sem fluxos" description="Escolhe uma área, dá um nome ao processo e inicia o primeiro fluxo guiado." />}
    {active.map(workflow => {
      const done = workflow.steps.filter(step => step.done).length;
      const next = workflow.steps.find(step => !step.done);
      const percent = Math.round(done / workflow.steps.length * 100);
      return <View key={workflow.id} style={styles.card}>
        <View style={[styles.stripe, { backgroundColor: next ? colors.accent : colors.successText }]} />
        <View style={styles.ctaHead}>
          <View style={styles.iconBox}><Icon name={templates[workflow.area].icon} size={20} color={colors.primary} /></View>
          <View style={styles.grow}><Text style={styles.ctaTitle}>{workflow.name}</Text><Text style={styles.muted}>{workflow.area} · {done}/{workflow.steps.length} etapas</Text></View>
          <View style={[styles.badge, { backgroundColor: next ? colors.warningBackground : colors.successBackground }]}><Text style={[styles.badgeText, { color: next ? colors.warningText : colors.successText }]}>{next ? `${percent}%` : 'CONCLUÍDO'}</Text></View>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: next ? colors.primary : colors.successText }]} /></View>
        {next && <View style={styles.next}><Icon name="arrow-right-circle" size={16} color={colors.primary} /><Text style={styles.nextText}>Próxima etapa: {next.title}</Text></View>}
        <Timeline steps={workflow.steps} onToggle={index => toggle(workflow, index)} styles={styles} colors={colors} />
        <Pressable accessibilityRole="button" onPress={() => remove(workflow.id)}><Text style={styles.muted}>Remover fluxo</Text></Pressable>
      </View>;
    })}
  </PreviewPage>;
}

type Styles = ReturnType<typeof makeStyles>;
function SectionTitle({ icon, title, styles }: { icon: IconName; title: string; styles: Styles }) {
  const { colors } = useAppTheme();
  return <View style={styles.sectionTitle}><Icon name={icon} size={18} color={colors.primary} /><Text accessibilityRole="header" style={styles.sectionText}>{title}</Text></View>;
}

function Timeline({ steps, onToggle, styles, colors }: { steps: Step[]; onToggle?: (index: number) => void; styles: Styles; colors: ThemeColors }) {
  const current = steps.findIndex(step => !step.done);
  return <View>{steps.map((step, index) => {
    const isCurrent = !!onToggle && index === current;
    const node = <>
      <View style={styles.rail}>
        <View style={[styles.node, step.done ? styles.nodeDone : isCurrent ? styles.nodeCurrent : null]}>
          {step.done ? <Icon name="check" size={16} color={colors.background} /> : <Text style={[styles.nodeText, isCurrent && { color: colors.background }]}>{index + 1}</Text>}
        </View>
        {index < steps.length - 1 && <View style={[styles.line, step.done && { backgroundColor: colors.successText }]} />}
      </View>
      <View style={styles.stepBody}>
        <Text style={[styles.strong, step.done && styles.stepDone]}>{step.title}</Text>
        <Text style={[styles.stepMeta, isCurrent && { color: colors.primary }]}>{step.done ? 'Concluída' : isCurrent ? 'Em curso' : `Etapa ${index + 1}`}</Text>
      </View>
    </>;
    return onToggle
      ? <Pressable key={step.title} accessibilityRole="checkbox" accessibilityLabel={step.title} accessibilityState={{ checked: step.done }} onPress={() => onToggle(index)} style={styles.step}>{node}</Pressable>
      : <View key={step.title} style={styles.step}>{node}</View>;
  })}</View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, grow: { flex: 1 },
  track: { height: 8, marginTop: 12, borderRadius: 4, backgroundColor: '#5E1119', overflow: 'hidden' }, fill: { height: 8, borderRadius: 4, backgroundColor: '#D9B454' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }, sectionText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  areaTile: { flexGrow: 1, flexBasis: 150, gap: 6, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  areaSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  areaName: { color: colors.textStrong, fontSize: 15, fontWeight: '800' },
  iconBox: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  iconBoxSelected: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 }, strong: { flexShrink: 1, color: colors.textStrong, fontSize: 14, fontWeight: '600' },
  docRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelTile: { flexGrow: 1, flexBasis: 220, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  cta: { gap: 14, padding: 20, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.surface },
  ctaHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, ctaTitle: { color: colors.textStrong, fontSize: 16, fontWeight: '800' },
  card: { overflow: 'hidden', gap: 12, paddingVertical: 18, paddingRight: 18, paddingLeft: 23, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  stripe: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }, badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: radius.sm, backgroundColor: colors.primaryLight }, nextText: { flexShrink: 1, color: colors.primary, fontSize: 13, fontWeight: '700' },
  step: { minHeight: 56, flexDirection: 'row', gap: 12 }, rail: { width: 32, alignItems: 'center' },
  node: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.borderStrong, borderRadius: radius.pill, backgroundColor: colors.surface },
  nodeDone: { borderColor: colors.successText, backgroundColor: colors.successText }, nodeCurrent: { borderColor: colors.primary, backgroundColor: colors.primary },
  nodeText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' }, line: { flex: 1, width: 2, minHeight: 16, backgroundColor: colors.border },
  stepBody: { flex: 1, paddingTop: 5, paddingBottom: 14, gap: 2 }, stepMeta: { color: colors.textMuted, fontSize: 12 }, stepDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
