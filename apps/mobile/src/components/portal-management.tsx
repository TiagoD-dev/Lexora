import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { apiFetch } from '@/services/api-client';
import { portalRequest, type PortalOverview } from '@/services/portal-service';
import { AppButton } from './app-button';
import { AppInput } from './app-input';
import { Copy, Feedback, Panel, Row } from './business-preview';
import { PortalCaseView } from './portal-case';
import { PortalError, PortalShell } from './portal-shell';
import { SelectField } from './select-field';

type ClientChoice = { id: string; name: string; email: string };

export function PortalManagement() {
  const [clients, setClients] = useState<ClientChoice[]>([]);
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setClients(await apiFetch<ClientChoice[]>('/clients')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os clientes.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const label = (client: ClientChoice) => `${client.name} · ${client.email || 'Sem email'} · ${client.id}`;
  return <PortalShell title="Portal do cliente" subtitle="Escolhe o cliente, gere o acesso e publica apenas a informação que pretendes partilhar.">
    <PortalError message={error} />
    {loading ? <ActivityIndicator /> : <>
      <AppButton variant="ghost" onPress={() => void load()}>Atualizar clientes</AppButton>
      {clients.length ? <SelectField label="Cliente" value={clients.find(client => client.id === clientId) ? label(clients.find(client => client.id === clientId)!) : 'Selecionar cliente'} options={clients.map(label)} onChange={value => setClientId(clients.find(client => label(client) === value)?.id ?? '')} /> : <Panel title="Ainda não há clientes"><Copy>Cria uma ficha em Clientes, preenche o email e associa um caso para disponibilizar o portal.</Copy></Panel>}
      {clientId && clients.some(client => client.id === clientId) && <ClientPortalManagement key={clientId} clientId={clientId} />}
    </>}
  </PortalShell>;
}

function ClientPortalManagement({ clientId }: { clientId: string }) {
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [caseId, setCaseId] = useState('');
  const [invite, setInvite] = useState<{ accessId: string; code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'invite' | 'revoke' | null>(null);
  const alive = useRef(true);
  const lock = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refresh = useCallback(async () => {
    const result = await portalRequest<PortalOverview>(`/manage/clients/${encodeURIComponent(clientId)}`);
    if (alive.current) { setOverview(result); setCaseId(current => result.cases.some(item => item.id === current) ? current : result.cases[0]?.id ?? ''); }
  }, [clientId]);
  useEffect(() => { refresh().catch(reason => { if (alive.current) setError(reason.message); }); }, [refresh]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setFeedback('');
    try { await action(); }
    catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a operação.'); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  const accessId = invite?.accessId ?? overview?.access?.id;
  const base = process.env.EXPO_PUBLIC_PORTAL_URL ?? (Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/portal` : Linking.createURL('/portal'));
  const accessUrl = accessId ? `${base}${base.includes('?') ? '&' : '?'}access=${encodeURIComponent(accessId)}` : '';
  return <>
    <PortalError message={error} /><Feedback>{feedback}</Feedback>
    {!overview ? <AppButton disabled={busy} onPress={() => void run(refresh)}>Carregar portal</AppButton> : <>
      <Panel title={`Acesso · ${overview.client.name}`}>
        <Copy>{overview.access?.active ? overview.access.activated ? 'Acesso ativado pelo cliente' : 'Convite criado · Aguarda ativação' : 'Sem acesso ativo'}</Copy>
        <Copy>Email da ficha: {overview.client.email || 'Preenche o email na ficha do cliente.'}</Copy>
        {overview.access && overview.access.email !== overview.client.email.trim().toLowerCase() && <Copy>O email foi alterado. Gera um novo convite para reativar o acesso.</Copy>}
        {accessUrl && <AppInput label="Endereço do portal do cliente" value={accessUrl} editable={false} />}
        <Row><AppButton disabled={busy || !overview.client.email} onPress={() => setConfirm('invite')}>{overview.access ? 'Gerar novo convite' : 'Criar convite'}</AppButton>
          {overview.access?.active && <AppButton disabled={busy} variant="ghost" onPress={() => setConfirm('revoke')}>Revogar acesso</AppButton>}
          <AppButton disabled={busy} variant="ghost" onPress={() => void run(refresh)}>Atualizar estado</AppButton>
        </Row>
        {confirm && <Panel title={confirm === 'invite' ? 'Criar convite de acesso' : 'Revogar acesso do cliente'}>
          <Copy>{confirm === 'invite' ? 'O convite é válido durante 48 horas. Se já existir acesso, as sessões e a palavra-passe anteriores serão invalidadas. Partilha o endereço e o código apenas com o cliente.' : 'O cliente deixará de conseguir consultar o portal, incluindo através de sessões já abertas.'}</Copy>
          <Row><AppButton disabled={busy} onPress={() => void run(async () => {
            if (confirm === 'invite') {
              const result = await portalRequest<{ accessId: string; code: string; expiresAt: string }>(`/manage/clients/${encodeURIComponent(clientId)}/invite`, undefined, { method: 'POST' });
              if (alive.current) setInvite(result);
            } else {
              await portalRequest(`/manage/clients/${encodeURIComponent(clientId)}/access`, undefined, { method: 'DELETE' });
              if (alive.current) { setInvite(null); setFeedback('Acesso revogado.'); }
            }
            if (alive.current) setConfirm(null);
            await refresh();
          })}>Confirmar</AppButton><AppButton disabled={busy} variant="ghost" onPress={() => setConfirm(null)}>Cancelar</AppButton></Row>
        </Panel>}
        {invite && <Panel title="Convite pronto a partilhar"><AppInput label="Código de ativação — mostrado apenas agora" value={invite.code} editable={false} /><Copy>Válido até {new Date(invite.expiresAt).toLocaleString('pt-PT')}. O cliente abre o endereço acima, escolhe “Ativar acesso” e introduz este código, o email e uma palavra-passe. Não foi enviado nenhum email automaticamente.</Copy></Panel>}
      </Panel>
      {overview.cases.length ? <>
        <SelectField label="Processo associado" value={overview.cases.find(item => item.id === caseId) ? `${overview.cases.find(item => item.id === caseId)!.reference} · ${overview.cases.find(item => item.id === caseId)!.title} · ${caseId}` : 'Selecionar processo'} options={overview.cases.map(item => `${item.reference} · ${item.title} · ${item.id}`)} onChange={value => setCaseId(overview.cases.find(item => `${item.reference} · ${item.title} · ${item.id}` === value)?.id ?? '')} />
        {caseId && <PortalCaseView key={caseId} caseId={caseId} />}
      </> : <Panel title="Sem processos associados"><Copy>Associa este cliente a um caso para poderes publicar atualizações, trocar mensagens e pedir documentos.</Copy></Panel>}
    </>}
  </>;
}
