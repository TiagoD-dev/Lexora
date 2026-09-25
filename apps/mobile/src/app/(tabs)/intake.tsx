import { useState } from 'react';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, euros, Feedback, Metrics, Panel, PreviewPage, Row } from '@/components/business-preview';

const stages = ['Novo contacto', 'Consulta', 'Proposta', 'Contratado'] as const;
type Stage = typeof stages[number];
type Lead = { id: number; name: string; email: string; area: string; source: string; stage: Stage; value: number; notes: string };
const initial: Lead[] = [
  { id: 1, name: 'Inês Pereira', email: 'ines@example.com', area: 'Laboral', source: 'Website', stage: 'Novo contacto', value: 0, notes: 'Pretende agendar uma consulta inicial.' },
  { id: 2, name: 'Oficina do Bairro', email: 'oficina@example.com', area: 'Cobranças', source: 'Recomendação', stage: 'Proposta', value: 750, notes: 'Proposta de acompanhamento em preparação.' },
  { id: 3, name: 'João Silva', email: 'joao@example.com', area: 'Família', source: 'Website', stage: 'Consulta', value: 0, notes: 'Recolher disponibilidade para consulta.' },
];

export default function IntakePage() {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState('Todos');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('Laboral');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('Website');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [proposal, setProposal] = useState('');
  const [feedback, setFeedback] = useState('');
  const selected = leads.find(lead => lead.id === selectedId);
  const valid = !!name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const proposalValue = Number(proposal.replace(',', '.'));
  function changeStage(id: number, stage: Stage) {
    setLeads(current => current.map(lead => lead.id === id ? { ...lead, stage } : lead));
    setFeedback(stage === 'Contratado' ? 'Contratação simulada. Não foi criado um cliente nem celebrado um contrato.' : 'Etapa atualizada na demonstração.');
  }
  return <PreviewPage title="Captação de clientes" subtitle="Acompanha cada oportunidade, desde o primeiro contacto até à contratação.">
    <Metrics items={[{ label: 'Contactos em aberto', value: String(leads.filter(lead => lead.stage !== 'Contratado').length) }, { label: 'Propostas em aberto', value: euros(leads.filter(lead => lead.stage === 'Proposta').reduce((sum, lead) => sum + lead.value, 0)) }, { label: 'Contratados', value: String(leads.filter(lead => lead.stage === 'Contratado').length) }]} />
    <Row><AppButton onPress={() => setOpen(!open)}>{open ? 'Fechar formulário' : '+ Novo contacto'}</AppButton></Row>
    {open && <Panel title="Modelo de formulário de entrada">
      <AppInput label="Nome / empresa" value={name} onChangeText={setName} />
      <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Copy strong>Área de interesse</Copy><Choices values={['Laboral', 'Família', 'Cobranças']} value={area} onChange={setArea} />
      <Copy strong>Origem</Copy><Choices values={['Website', 'Recomendação', 'Telefone']} value={source} onChange={setSource} />
      <AppInput label="Resumo do pedido" multiline value={notes} onChangeText={setNotes} />
      <Copy>Introduz um nome e um email válido para experimentar o registo.</Copy>
      <AppButton disabled={!valid} onPress={() => { setLeads(current => [...current, { id: Date.now(), name: name.trim(), email: email.trim(), area, source, notes: notes.trim(), stage: 'Novo contacto', value: 0 }]); setName(''); setEmail(''); setNotes(''); setOpen(false); setFilter('Todos'); setFeedback('Contacto adicionado à demonstração.'); }}>Adicionar contacto de demonstração</AppButton>
    </Panel>}
    <Feedback>{feedback}</Feedback>
    <Choices values={['Todos', ...stages]} value={filter} onChange={setFilter} />
    {leads.filter(lead => filter === 'Todos' || lead.stage === filter).map(lead => <Panel key={lead.id} title={lead.name}>
      <Copy>{lead.area} · {lead.source} · {lead.email}</Copy><Copy strong>{lead.stage}{lead.value > 0 ? ` · ${euros(lead.value)}` : ''}</Copy><Copy>{lead.notes}</Copy>
      <Choices values={stages} value={lead.stage} onChange={stage => changeStage(lead.id, stage)} />
      <Row><AppButton variant="ghost" onPress={() => { setSelectedId(lead.id); setProposal(lead.value ? String(lead.value) : ''); }}>Preparar proposta</AppButton></Row>
    </Panel>)}
    {!leads.some(lead => filter === 'Todos' || lead.stage === filter) && <Panel title="Sem contactos nesta etapa"><Copy>Altera o filtro ou adiciona um contacto.</Copy></Panel>}
    {selected && <Panel title={`Proposta · ${selected.name}`}>
      <Copy>Modelo de proposta para acompanhamento na área de {selected.area.toLowerCase()}. O âmbito e as condições serão revistos pelo advogado.</Copy>
      <AppInput label="Honorários propostos (€), sem IVA" value={proposal} onChangeText={setProposal} keyboardType="decimal-pad" />
      <Row><AppButton disabled={!Number.isFinite(proposalValue) || proposalValue <= 0} onPress={() => { setLeads(current => current.map(lead => lead.id === selected.id ? { ...lead, value: Math.round(proposalValue * 100) / 100, stage: 'Proposta' } : lead)); setSelectedId(null); setFeedback('Proposta guardada na demonstração. Nenhum email foi enviado.'); }}>Guardar proposta de demonstração</AppButton><AppButton variant="ghost" onPress={() => setSelectedId(null)}>Cancelar</AppButton></Row>
    </Panel>}
  </PreviewPage>;
}
