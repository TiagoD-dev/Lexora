import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppButton } from './app-button';
import { AppInput } from './app-input';
import { DateField } from './date-field';
import { Choices, Copy, euros, Feedback, Row } from './business-preview';
import { Card, Chip, IconBox, InfoRow, PortalError } from './portal-shell';
import { downloadPortalDocument, portalRequest, uploadPortalDocument, type PortalDetail } from '@/services/portal-service';
import { ApiError } from '@/services/api-client';
import { useAppTheme } from '@/providers/theme-provider';
import { radius } from '@/theme';

export function PortalCaseView({ caseId, token, onExpired, onChanged }: { caseId: string; token?: string; onExpired?: () => void; onChanged?: () => void }) {
  const { colors } = useAppTheme();
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
  async function publish(published: boolean) {
    await portalRequest(`/cases/${encodeURIComponent(caseId)}/publication`, token, { method: 'PUT', body: JSON.stringify({ published, summary }) });
    await refresh(); onChanged?.();
  }
  const totalCents = Math.round(Number(amount.replace(',', '.')) * 100);
  const validDate = !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(dueDate)) && new Date(dueDate).toISOString().slice(0, 10) === dueDate;
  const when = (value: string) => new Date(value).toLocaleString('pt-PT');
  const items = (kind: string) => detail?.items.filter(item => item.kind === kind) ?? [];
  const due = items('charge').filter(item => !item.data.paid).reduce((sum, item) => sum + (item.data.amountCents ?? 0), 0) / 100;
  const heading = (text: string) => <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{text}</Text>;
  const empty = (text: string) => <Text style={{ paddingVertical: 12, color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>{text}</Text>;
  const divider = { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border } as const;
  const itemTitle = { color: colors.textStrong, fontSize: 14, fontWeight: '700' } as const;
  return <>
    <PortalError message={error} /><Feedback>{feedback}</Feedback>
    <Row><AppButton disabled={busy || loading} variant="ghost" onPress={() => void run(refresh)}>Atualizar processo</AppButton>{busy || loading ? <ActivityIndicator /> : null}</Row>
    {detail && <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBox icon="briefcase-outline" />
          <View style={{ flex: 1 }}><Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 }}>{detail.case.reference}</Text><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>{detail.case.title}</Text></View>
        </View>
        <Row><Chip label={detail.case.status} tone="primary" icon="scale-balance" />{office && <Chip label={detail.case.published ? 'Publicado no portal' : 'Privado'} tone={detail.case.published ? 'success' : 'neutral'} icon={detail.case.published ? 'eye-outline' : 'eye-off-outline'} />}{due > 0 && <Chip label={`${euros(due)} por regularizar`} tone="warning" icon="cash-clock" />}</Row>
        <InfoRow icon="account-tie-outline">Responsável: {detail.case.responsible}</InfoRow>
        {detail.case.updatedAt && <InfoRow icon="update">Atualizado em {when(detail.case.updatedAt)}</InfoRow>}
      </Card>
      <Choices values={['Processo', 'Documentos', 'Mensagens', 'Pagamentos']} value={tab} onChange={setTab} />
      {tab === 'Processo' && <Card>
        {heading(office ? 'Atualização para o cliente' : 'Última atualização do escritório')}
        {office ? <>
          <Copy>{detail.case.published ? 'Este processo está publicado no portal.' : 'Este processo ainda está privado.'} Ao publicar, o cliente vê título, referência, estado, responsável e o conteúdo deste portal. As notas internas não são partilhadas.</Copy>
          <AppInput label="Atualização para o cliente" multiline value={summary} onChangeText={setSummary} maxLength={10000} />
          <Row><AppButton disabled={busy} onPress={() => void run(() => publish(true), 'Informação publicada no portal.')}>{detail.case.published ? 'Guardar atualização' : 'Publicar no portal'}</AppButton>
            {detail.case.published && <AppButton disabled={busy} variant="ghost" onPress={() => void run(() => publish(false), 'Processo retirado do portal.')}>Retirar do portal</AppButton>}</Row>
        </> : <View style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: radius.sm, backgroundColor: colors.background }}><Copy>{detail.case.summary || 'O escritório ainda não publicou uma atualização.'}</Copy></View>}
      </Card>}
      {tab === 'Documentos' && <>
        {office && <Card>{heading('Pedir um documento')}<AppInput label="Documento necessário" value={request} onChangeText={setRequest} maxLength={10000} /><AppButton disabled={busy || !request.trim()} onPress={() => void run(async () => { await add('request', request.trim()); setRequest(''); await refresh(); }, 'Pedido guardado no portal.')}>Criar pedido</AppButton></Card>}
        <Card>
          {heading('Documentos pedidos')}
          {!items('request').length && empty('Não há documentos pedidos.')}
          {items('request').map(item => {
            const delivered = items('document').some(document => document.data.requestId === item.id);
            return <View key={item.id} style={[divider, { gap: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconBox icon={delivered ? 'file-check-outline' : 'file-clock-outline'} tone={delivered ? 'success' : 'warning'} />
                <View style={{ flex: 1, gap: 5 }}><Text style={itemTitle}>{item.data.text ?? 'Documento'}</Text><Chip label={delivered ? 'Entregue · Disponível para revisão pelo escritório' : 'A aguardar entrega'} tone={delivered ? 'success' : 'warning'} /></View></View>
              <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { if (await uploadPortalDocument(caseId, token, item.id)) { await refresh(); setFeedback('Documento entregue e guardado.'); } })}>{delivered ? 'Adicionar outro ficheiro' : 'Entregar documento'}</AppButton>
            </View>;
          })}
        </Card>
        <Card>
          {heading('Ficheiros partilhados')}
          <Copy>PDF, DOCX, XLSX, TXT, CSV, PNG ou JPEG · Até 25 MB. Os ficheiros aqui carregados ficam disponíveis para o cliente e para o escritório.</Copy>
          <AppButton disabled={busy} onPress={() => void run(async () => { if (await uploadPortalDocument(caseId, token)) { await refresh(); setFeedback('Documento guardado no portal.'); } })}>Adicionar documento</AppButton>
          {!items('document').length && empty('Ainda não há ficheiros partilhados.')}
          {items('document').map(item => <View key={item.id} style={[divider, { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }]}>
            <IconBox icon="file-document-outline" />
            <View style={{ flex: 1, minWidth: 160 }}><Text numberOfLines={1} style={itemTitle}>{item.data.name ?? 'Documento'}</Text><Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{item.author === 'office' ? 'Escritório' : 'Cliente'} · {when(item.createdAt)} · {Math.max(1, Math.round((item.data.size ?? 0) / 1024))} KB</Text></View>
            <AppButton disabled={busy} variant="ghost" onPress={() => void run(() => downloadPortalDocument(item, token))}>Descarregar documento</AppButton>
          </View>)}
        </Card>
      </>}
      {tab === 'Mensagens' && <Card>
        {heading('Conversa com o escritório')}
        {!items('message').length && empty('Ainda não há mensagens. Inicia a conversa abaixo.')}
        {items('message').map(item => {
          const mine = (item.author === 'office') === office;
          return <View key={item.id} style={{ maxWidth: '85%', alignSelf: mine ? 'flex-end' : 'flex-start', gap: 4, padding: 12, borderRadius: radius.lg, borderBottomRightRadius: mine ? 4 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 4, backgroundColor: mine ? colors.primary : colors.surfaceMuted }}>
            <Text style={{ color: mine ? colors.primarySoft : colors.accent, fontSize: 11, fontWeight: '800' }}>{item.author === 'office' ? 'Escritório' : 'Cliente'}</Text>
            <Text style={{ color: mine ? colors.white : colors.text, fontSize: 14, lineHeight: 20 }}>{item.data.text}</Text>
            <Text style={{ color: mine ? colors.primarySoft : colors.textMuted, fontSize: 11 }}>{when(item.createdAt)}</Text>
          </View>;
        })}
        <AppInput label="Mensagem" multiline value={message} onChangeText={setMessage} maxLength={10000} />
        <AppButton disabled={busy || !message.trim()} onPress={() => void run(async () => { await add('message', message.trim()); setMessage(''); await refresh(); }, 'Mensagem guardada na conversa.')}>Enviar mensagem no portal</AppButton>
      </Card>}
      {tab === 'Pagamentos' && <>
        {office && <Card>
          {heading('Adicionar valor a pagamento')}
          <AppInput label="Descrição" value={chargeText} onChangeText={setChargeText} maxLength={10000} />
          <AppInput label="Valor total a pagar (€), incluindo impostos aplicáveis" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <DateField label="Data limite, opcional" value={dueDate} onChange={setDueDate} />
          <AppInput label="Instruções de pagamento / referência" multiline value={instructions} onChangeText={setInstructions} maxLength={2000} />
          <InfoRow icon="information-outline">Este registo não emite uma fatura. Partilha o documento de faturação na secção Documentos.</InfoRow>
          <AppButton disabled={busy || !chargeText.trim() || !Number.isFinite(totalCents) || totalCents <= 0 || totalCents > 100000000 || !validDate} onPress={() => void run(async () => { await add('charge', chargeText.trim(), { amountCents: totalCents, dueDate: dueDate || null, instructions }); setChargeText(''); setAmount(''); setDueDate(''); setInstructions(''); await refresh(); }, 'Valor publicado no portal.')}>Publicar valor</AppButton>
        </Card>}
        <Card>
          {heading('Valores a pagamento')}
          <View style={{ gap: 2, padding: 14, borderRadius: radius.md, backgroundColor: due > 0 ? colors.warningBackground : colors.successBackground }}>
            <Text style={{ color: due > 0 ? colors.warningText : colors.successText, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 }}>POR REGULARIZAR</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>{euros(due)}</Text>
          </View>
          <Copy>Os recebimentos são confirmados pelo escritório. Podes entregar um comprovativo na secção Documentos.</Copy>
          {!items('charge').length && empty('Não há valores publicados neste processo.')}
          {items('charge').map(item => <View key={item.id} style={[divider, { gap: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconBox icon={item.data.paid ? 'cash-check' : 'cash-clock'} tone={item.data.paid ? 'success' : 'warning'} />
              <View style={{ flex: 1 }}><Text style={itemTitle}>{item.data.text ?? 'Honorários'}</Text><Copy strong>{euros((item.data.amountCents ?? 0) / 100)} · {item.data.paid ? 'Recebido' : 'Por regularizar'}</Copy></View></View>
            {item.data.dueDate && <InfoRow icon="calendar-clock">Data limite: {item.data.dueDate}</InfoRow>}
            <InfoRow icon="bank-outline">{item.data.instructions || 'Contacta o escritório para obter as instruções de pagamento.'}</InfoRow>
            {office && <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { await portalRequest(`/charges/${item.id}`, token, { method: 'PATCH', body: JSON.stringify({ paid: !item.data.paid }) }); await refresh(); }, 'Estado do recebimento atualizado.')}>{item.data.paid ? 'Reabrir valor' : 'Confirmar recebimento'}</AppButton>}
          </View>)}
        </Card>
      </>}
    </>}
  </>;
}
