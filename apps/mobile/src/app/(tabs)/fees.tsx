import { useState } from 'react';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, euros, Feedback, Metrics, Panel, PreviewPage, Row } from '@/components/business-preview';

type Entry = { id: number; client: string; description: string; amount: number; kind: string; paid: boolean };
const initial: Entry[] = [
  { id: 1, client: 'Ana Martins · Processo laboral', description: 'Análise documental · 2 horas', amount: 180, kind: 'Tempo', paid: false },
  { id: 2, client: 'Norte & Forma · Assessoria', description: 'Avença de setembro', amount: 650, kind: 'Avença', paid: false },
  { id: 3, client: 'Miguel Costa · Arrendamento', description: 'Consulta e preparação de minuta', amount: 250, kind: 'Honorário fixo', paid: true },
];

export default function FeesPage() {
  const [entries, setEntries] = useState(initial);
  const [filter, setFilter] = useState('Todos');
  const [kind, setKind] = useState('Tempo');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('1');
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const value = Number(amount.replace(',', '.'));
  const duration = Number(hours.replace(',', '.'));
  const total = kind === 'Tempo' ? value * duration : value;
  const valid = !!client.trim() && !!description.trim() && Number.isFinite(total) && value > 0 && total > 0;
  const received = entries.filter(entry => entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
  const pending = entries.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
  function save() {
    if (!valid) return;
    setEntries(current => [...current, { id: Date.now(), client: client.trim(), description: description.trim(), amount: Math.round(total * 100) / 100, kind, paid: false }]);
    setClient(''); setDescription(''); setAmount(''); setHours('1'); setEditing(false);
    setFeedback('Registo adicionado à demonstração. Não foi emitida uma fatura.');
  }
  return <PreviewPage title="Honorários e cobranças" subtitle="Do trabalho realizado ao valor recebido. Acompanha os honorários do escritório num só lugar.">
    <Metrics items={[{ label: 'Por receber', value: euros(pending) }, { label: 'Recebido', value: euros(received) }, { label: 'Total registado', value: euros(pending + received) }]} />
    <Row><AppButton onPress={() => setEditing(!editing)}>{editing ? 'Fechar formulário' : '+ Registar trabalho ou despesa'}</AppButton></Row>
    {editing && <Panel title="Novo registo">
      <Choices values={['Tempo', 'Honorário fixo', 'Avença', 'Despesa']} value={kind} onChange={setKind} />
      <AppInput label="Cliente / processo" value={client} onChangeText={setClient} placeholder="Ex.: Ana Martins · Processo laboral" />
      <AppInput label="Descrição" value={description} onChangeText={setDescription} placeholder="Trabalho realizado ou despesa" />
      <AppInput label={kind === 'Tempo' ? 'Valor por hora (€)' : 'Valor (€)'} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      {kind === 'Tempo' && <AppInput label="Horas" keyboardType="decimal-pad" value={hours} onChangeText={setHours} />}
      <Copy>Valores sem IVA. {valid ? `Total: ${euros(total)}` : 'Preenche os campos com valores positivos para adicionar.'}</Copy>
      <Row><AppButton disabled={!valid} onPress={save}>Adicionar registo</AppButton><AppButton variant="ghost" onPress={() => setEditing(false)}>Cancelar</AppButton></Row>
    </Panel>}
    <Feedback>{feedback}</Feedback>
    <Choices values={['Todos', 'Por receber', 'Recebidos']} value={filter} onChange={setFilter} />
    {entries.filter(entry => filter === 'Todos' || (filter === 'Recebidos' ? entry.paid : !entry.paid)).map(entry => <Panel key={entry.id} title={entry.client}>
      <Copy>{entry.kind} · {entry.description}</Copy><Copy strong>{euros(entry.amount)} · {entry.paid ? 'Recebido' : 'Por receber'}</Copy>
      <Row><AppButton variant="ghost" onPress={() => { setEntries(current => current.map(item => item.id === entry.id ? { ...item, paid: !item.paid } : item)); setFeedback('Estado atualizado apenas na demonstração.'); }}>{entry.paid ? 'Reabrir valor' : 'Simular recebimento'}</AppButton>
      {!entry.paid && <AppButton variant="ghost" onPress={() => setFeedback(`Rascunho de lembrete: encontra-se por regularizar o valor de ${euros(entry.amount)}, referente a ${entry.description}. Nenhuma mensagem foi enviada.`)}>Pré-visualizar lembrete</AppButton>}</Row>
    </Panel>)}
    {!entries.some(entry => filter === 'Todos' || (filter === 'Recebidos' ? entry.paid : !entry.paid)) && <Panel title="Sem registos"><Copy>Não existem valores neste estado.</Copy></Panel>}
  </PreviewPage>;
}
