import { useState } from 'react';
import { Pressable } from 'react-native';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, Feedback, Panel, PreviewPage, Row } from '@/components/business-preview';

const templates = {
  Laboral: { documents: ['Contrato de trabalho', 'Recibos de vencimento', 'Comunicações relevantes'], steps: ['Consulta inicial', 'Recolher documentos', 'Rever factos e enquadramento', 'Preparar proposta de atuação'] },
  Família: { documents: ['Identificação necessária', 'Documentos da situação familiar', 'Informação financeira relevante'], steps: ['Consulta inicial', 'Identificar objetivos e intervenientes', 'Rever documentação', 'Preparar plano de acompanhamento'] },
  Cobranças: { documents: ['Faturas e documentos de suporte', 'Contrato ou encomenda', 'Histórico de comunicações'], steps: ['Identificar crédito e intervenientes', 'Conferir valores', 'Preparar comunicação para revisão', 'Avaliar resposta e próximos passos'] },
} as const;
type Area = keyof typeof templates;
type Workflow = { id: number; name: string; area: Area; steps: { title: string; done: boolean }[] };

export default function WorkflowsPage() {
  const [area, setArea] = useState<Area>('Laboral');
  const [name, setName] = useState('');
  const [active, setActive] = useState<Workflow[]>([]);
  const [feedback, setFeedback] = useState('');
  const [model, setModel] = useState('');
  const template = templates[area];
  return <PreviewPage title="Fluxos por área jurídica" subtitle="Organiza o método do escritório em etapas claras, documentos pedidos e modelos reutilizáveis.">
    <Choices values={Object.keys(templates) as Area[]} value={area} onChange={value => { setArea(value); setModel(''); }} />
    <Panel title={`${area} · Modelo de acompanhamento`}>
      <Copy>O advogado deve validar os passos e definir os prazos de cada processo.</Copy>
      {template.steps.map((step, index) => <Copy key={step} strong>{String(index + 1).padStart(2, '0')} · {step}</Copy>)}
    </Panel>
    <Panel title="Documentos a reunir">{template.documents.map(document => <Copy key={document}>□ {document}</Copy>)}</Panel>
    <Panel title="Modelos do escritório"><Row>{['Ficha de consulta', 'Pedido de documentação', 'Resumo de acompanhamento'].map(title => <AppButton key={title} variant="ghost" onPress={() => setModel(`${title} · ${area}\n\nCliente: [nome]\nProcesso: [referência]\nResponsável: [advogado]\n\nObjetivo: [descrever]\n\nDocumentos:\n${template.documents.map(item => `• ${item}`).join('\n')}\n\nPróxima ação: [a definir]\nData de revisão: [a definir]`)}>{title}</AppButton>)}</Row>
      {model && <><AppInput label="Modelo editável" multiline value={model} onChangeText={setModel} style={{ minHeight: 300 }} /><Copy>Rascunho temporário para revisão; não é anexado a um processo.</Copy></>}
    </Panel>
    <Panel title="Experimentar este fluxo"><AppInput label="Nome do processo de demonstração" value={name} onChangeText={setName} placeholder="Ex.: Ana Martins · Acompanhamento laboral" />
      <AppButton disabled={!name.trim()} onPress={() => { setActive(current => [...current, { id: Date.now(), name: name.trim(), area, steps: template.steps.map(title => ({ title, done: false })) }]); setName(''); setFeedback('Fluxo criado na demonstração. Experimenta concluir as etapas abaixo.'); }}>Criar fluxo de demonstração</AppButton>
    </Panel>
    <Feedback>{feedback}</Feedback>
    {active.length === 0 && <Copy>Ainda não há fluxos de demonstração. Escolhe uma área e cria o primeiro.</Copy>}
    {active.map(workflow => <Panel key={workflow.id} title={workflow.name}>
      <Copy>{workflow.area} · {workflow.steps.filter(step => step.done).length}/{workflow.steps.length} etapas concluídas</Copy>
      {workflow.steps.map((step, index) => <Pressable key={step.title} accessibilityRole="checkbox" accessibilityLabel={step.title} accessibilityState={{ checked: step.done }} style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => setActive(current => current.map(item => item.id === workflow.id ? { ...item, steps: item.steps.map((entry, i) => i === index ? { ...entry, done: !entry.done } : entry) } : item))}><Copy strong>{step.done ? '✓' : '□'} {step.title}</Copy></Pressable>)}
    </Panel>)}
  </PreviewPage>;
}
