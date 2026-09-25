import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { AppButton } from './app-button';
import { AppInput } from './app-input';
import { Choices, Copy, euros, Feedback, Panel, Row } from './business-preview';
import { PortalError } from './portal-shell';
import { downloadPortalDocument, portalRequest, uploadPortalDocument, type PortalDetail } from '@/services/portal-service';
import { ApiError } from '@/services/api-client';

export function PortalCaseView({ caseId, token, onExpired }: { caseId: string; token?: string; onExpired?: () => void }) {
  const [detail, setDetail] = useState<PortalDetail | null>(null);
  const [tab, setTab] = useState('Processo');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState('');
  const [summary, setSummary] = useState('');
  const [chargeText, setChargeText] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const mounted = useRef(true);
  const office = token === undefined;
  const locked = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const fail = useCallback((reason: unknown) => {
    if (!mounted.current) return;
    if (reason instanceof ApiError && (reason.status === 401 || reason.status === 404)) {
      setDetail(null);
      if (reason.status === 401) onExpired?.();
    }
    setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a operação.');
  }, [onExpired]);
  const refresh = useCallback(async () => {
    const result = await portalRequest<PortalDetail>(`/cases/${encodeURIComponent(caseId)}`, token);
    if (mounted.current) { setDetail(result); setSummary(result.case.summary); }
  }, [caseId, token]);
  useEffect(() => { refresh().catch(fail).finally(() => { if (mounted.current) setLoading(false); }); }, [refresh, fail]);
  async function run(action: () => Promise<void>, success = '') {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setFeedback('');
    try { await action(); if (mounted.current && success) setFeedback(success); }
    catch (reason) { fail(reason); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  async function add(kind: 'message' | 'request' | 'charge', text: string, extra = {}) {
    await portalRequest(`/cases/${encodeURIComponent(caseId)}/items`, token, { method: 'POST', body: JSON.stringify({ kind, text, ...extra }) });
  }
  const totalCents = Math.round(Number(amount.replace(',', '.')) * 100);
  const validDate = !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(dueDate)) && new Date(dueDate).toISOString().slice(0, 10) === dueDate;
  return <>
    <PortalError message={error} /><Feedback>{feedback}</Feedback>
    <Row><AppButton disabled={busy || loading} variant="ghost" onPress={() => void run(refresh)}>Atualizar processo</AppButton>{busy || loading ? <ActivityIndicator /> : null}</Row>
    {detail && <>
      <Choices values={['Processo', 'Documentos', 'Mensagens', 'Pagamentos']} value={tab} onChange={setTab} />
      {tab === 'Processo' && <Panel title={detail.case.title}>
        <Copy strong>{detail.case.reference} · {detail.case.status}</Copy><Copy>Responsável: {detail.case.responsible}</Copy>
        {office ? <>
          <Copy>{detail.case.published ? 'Este processo está publicado no portal.' : 'Este processo ainda está privado.'} Ao publicar, o cliente vê título, referência, estado, responsável e o conteúdo deste portal. As notas internas não são partilhadas.</Copy>
          <AppInput label="Atualização para o cliente" multiline value={summary} onChangeText={setSummary} maxLength={10000} />
          <Row><AppButton disabled={busy} onPress={() => void run(async () => { await portalRequest(`/cases/${encodeURIComponent(caseId)}/publication`, token, { method: 'PUT', body: JSON.stringify({ published: true, summary }) }); await refresh(); }, 'Informação publicada no portal.')}>{detail.case.published ? 'Guardar atualização' : 'Publicar no portal'}</AppButton>
          {detail.case.published && <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { await portalRequest(`/cases/${encodeURIComponent(caseId)}/publication`, token, { method: 'PUT', body: JSON.stringify({ published: false, summary }) }); await refresh(); }, 'Processo retirado do portal.')}>Retirar do portal</AppButton>}</Row>
        </> : <Copy>{detail.case.summary || 'O escritório ainda não publicou uma atualização.'}</Copy>}
        {detail.case.updatedAt && <Copy>Atualizado em {new Date(detail.case.updatedAt).toLocaleString('pt-PT')}</Copy>}
      </Panel>}
      {tab === 'Documentos' && <>
        {office && <Panel title="Pedir um documento"><AppInput label="Documento necessário" value={request} onChangeText={setRequest} maxLength={10000} /><AppButton disabled={busy || !request.trim()} onPress={() => void run(async () => { await add('request', request.trim()); setRequest(''); await refresh(); }, 'Pedido guardado no portal.')}>Criar pedido</AppButton></Panel>}
        <Panel title="Documentos pedidos">
          {!detail.items.some(item => item.kind === 'request') && <Copy>Não há documentos pedidos.</Copy>}
          {detail.items.filter(item => item.kind === 'request').map(item => {
            const delivered = detail.items.some(document => document.kind === 'document' && document.data.requestId === item.id);
            return <Panel key={item.id} title={item.data.text ?? 'Documento'}><Copy>{delivered ? 'Entregue · Disponível para revisão pelo escritório' : 'A aguardar entrega'}</Copy>
              <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { if (await uploadPortalDocument(caseId, token, item.id)) { await refresh(); setFeedback('Documento entregue e guardado.'); } })}>{delivered ? 'Adicionar outro ficheiro' : 'Entregar documento'}</AppButton>
            </Panel>;
          })}
        </Panel>
        <Panel title="Ficheiros partilhados"><Copy>PDF, DOCX, XLSX, TXT, CSV, PNG ou JPEG · Até 25 MB. Os ficheiros aqui carregados ficam disponíveis para o cliente e para o escritório.</Copy>
          <AppButton disabled={busy} onPress={() => void run(async () => { if (await uploadPortalDocument(caseId, token)) { await refresh(); setFeedback('Documento guardado no portal.'); } })}>Adicionar documento</AppButton>
          {!detail.items.some(item => item.kind === 'document') && <Copy>Ainda não há ficheiros partilhados.</Copy>}
          {detail.items.filter(item => item.kind === 'document').map(item => <Panel key={item.id} title={item.data.name ?? 'Documento'}>
            <Copy>{item.author === 'office' ? 'Escritório' : 'Cliente'} · {new Date(item.createdAt).toLocaleString('pt-PT')} · {Math.max(1, Math.round((item.data.size ?? 0) / 1024))} KB</Copy>
            <AppButton disabled={busy} variant="ghost" onPress={() => void run(() => downloadPortalDocument(item, token))}>Descarregar documento</AppButton>
          </Panel>)}
        </Panel>
      </>}
      {tab === 'Mensagens' && <Panel title="Conversa com o escritório">
        {!detail.items.some(item => item.kind === 'message') && <Copy>Ainda não há mensagens. Inicia a conversa abaixo.</Copy>}
        {detail.items.filter(item => item.kind === 'message').map(item => <Panel key={item.id} title={item.author === 'office' ? 'Escritório' : 'Cliente'}><Copy>{item.data.text}</Copy><Copy>{new Date(item.createdAt).toLocaleString('pt-PT')}</Copy></Panel>)}
        <AppInput label="Mensagem" multiline value={message} onChangeText={setMessage} maxLength={10000} />
        <AppButton disabled={busy || !message.trim()} onPress={() => void run(async () => { await add('message', message.trim()); setMessage(''); await refresh(); }, 'Mensagem guardada na conversa.')}>Enviar mensagem no portal</AppButton>
      </Panel>}
      {tab === 'Pagamentos' && <>
        {office && <Panel title="Adicionar valor a pagamento">
          <AppInput label="Descrição" value={chargeText} onChangeText={setChargeText} maxLength={10000} />
          <AppInput label="Valor total a pagar (€), incluindo impostos aplicáveis" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <AppInput label="Data limite (AAAA-MM-DD), opcional" value={dueDate} onChangeText={setDueDate} maxLength={10} />
          <AppInput label="Instruções de pagamento / referência" multiline value={instructions} onChangeText={setInstructions} maxLength={2000} />
          <Copy>Este registo não emite uma fatura. Partilha o documento de faturação na secção Documentos.</Copy>
          <AppButton disabled={busy || !chargeText.trim() || !Number.isFinite(totalCents) || totalCents <= 0 || totalCents > 100000000 || !validDate} onPress={() => void run(async () => { await add('charge', chargeText.trim(), { amountCents: totalCents, dueDate: dueDate || null, instructions }); setChargeText(''); setAmount(''); setDueDate(''); setInstructions(''); await refresh(); }, 'Valor publicado no portal.')}>Publicar valor</AppButton>
        </Panel>}
        <Panel title="Valores a pagamento">
          <Copy strong>Por regularizar: {euros(detail.items.filter(item => item.kind === 'charge' && !item.data.paid).reduce((sum, item) => sum + (item.data.amountCents ?? 0), 0) / 100)}</Copy>
          <Copy>Os recebimentos são confirmados pelo escritório. Podes entregar um comprovativo na secção Documentos.</Copy>
          {!detail.items.some(item => item.kind === 'charge') && <Copy>Não há valores publicados neste processo.</Copy>}
          {detail.items.filter(item => item.kind === 'charge').map(item => <Panel key={item.id} title={item.data.text ?? 'Honorários'}>
            <Copy strong>{euros((item.data.amountCents ?? 0) / 100)} · {item.data.paid ? 'Recebido' : 'Por regularizar'}</Copy>
            {item.data.dueDate && <Copy>Data limite: {item.data.dueDate}</Copy>}
            <Copy>{item.data.instructions || 'Contacta o escritório para obter as instruções de pagamento.'}</Copy>
            {office && <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { await portalRequest(`/charges/${item.id}`, token, { method: 'PATCH', body: JSON.stringify({ paid: !item.data.paid }) }); await refresh(); }, 'Estado do recebimento atualizado.')}>{item.data.paid ? 'Reabrir valor' : 'Confirmar recebimento'}</AppButton>}
          </Panel>)}
        </Panel>
      </>}
    </>}
  </>;
}
