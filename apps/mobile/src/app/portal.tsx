import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Choices, Copy, Panel, Row } from '@/components/business-preview';
import { PortalCaseView } from '@/components/portal-case';
import { PortalError, PortalShell } from '@/components/portal-shell';
import { SelectField } from '@/components/select-field';
import { portalRequest, type PortalOverview } from '@/services/portal-service';
import { ApiError } from '@/services/api-client';

export default function PortalPage() {
  const params = useLocalSearchParams<{ access?: string }>();
  const [accessId, setAccessId] = useState(typeof params.access === 'string' ? params.access : '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('Iniciar sessão');
  const [token, setToken] = useState('');
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [caseId, setCaseId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const expired = useCallback(() => { generation.current += 1; setToken(''); setOverview(null); setCaseId(''); setError('A sessão terminou ou o acesso foi revogado. Inicia sessão novamente.'); }, []);
  useEffect(() => { if (typeof params.access === 'string') setAccessId(params.access); }, [params.access]);
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      const revision = generation.current;
      portalRequest<PortalOverview>('/me', token).then(data => {
        if (revision !== generation.current) return;
        setOverview(data); setCaseId(current => data.cases.some(item => item.id === current) ? current : data.cases[0]?.id ?? '');
      }).catch(reason => { if (revision === generation.current && reason instanceof ApiError && reason.status === 401) expired(); });
    }, 60000);
    return () => clearInterval(timer);
  }, [token, expired]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (reason) { if (reason instanceof ApiError && reason.status === 401 && token) expired(); else setError(reason instanceof Error ? reason.message : 'Não foi possível concluir o pedido.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const label = (item: PortalOverview['cases'][number]) => `${item.reference} · ${item.title} · ${item.id}`;
  return <PortalShell title={overview ? `Olá, ${overview.client.name}` : 'O teu escritório, mais perto'} subtitle={overview ? `${overview.office} · Acompanha os teus processos, documentos e mensagens.` : 'Entra com o acesso disponibilizado pelo teu advogado. Na primeira utilização, ativa o convite e define a tua palavra-passe.'}>
    <PortalError message={error} />
    {!token || !overview ? <Panel title="Acesso do cliente">
      <Choices values={['Iniciar sessão', 'Ativar acesso']} value={mode} onChange={setMode} />
      <AppInput label="Identificador de acesso" value={accessId} onChangeText={setAccessId} autoCapitalize="none" autoCorrect={false} />
      <AppInput label="Email indicado ao escritório" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      {mode === 'Ativar acesso' && <AppInput label="Código do convite" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} />}
      <AppInput label={mode === 'Ativar acesso' ? 'Definir palavra-passe (mínimo 10 caracteres)' : 'Palavra-passe'} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={72} />
      <AppButton disabled={busy || !accessId.trim() || !email.trim() || password.trim().length < 10 || (mode === 'Ativar acesso' && !code.trim())} onPress={() => void run(async () => {
        const result = await portalRequest<{ accessToken: string }>(mode === 'Ativar acesso' ? '/activate' : '/login', '', { method: 'POST', body: JSON.stringify({ accessId: accessId.trim(), email: email.trim(), password, ...(mode === 'Ativar acesso' ? { code: code.trim() } : {}) }) });
        const data = await portalRequest<PortalOverview>('/me', result.accessToken);
        generation.current += 1; setToken(result.accessToken); setOverview(data); setCaseId(data.cases[0]?.id ?? ''); setPassword(''); setCode(''); setMode('Iniciar sessão');
      })}>{busy ? 'A verificar…' : mode === 'Ativar acesso' ? 'Ativar e entrar' : 'Entrar no portal'}</AppButton>
      <Copy>Convite expirado ou palavra-passe esquecida? Pede um novo convite ao escritório. Por privacidade, volta a iniciar sessão se recarregares ou fechares esta página.</Copy>
    </Panel> : <>
      <Row><AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { const data = await portalRequest<PortalOverview>('/me', token); setOverview(data); setCaseId(current => data.cases.some(item => item.id === current) ? current : data.cases[0]?.id ?? ''); })}>Atualizar portal</AppButton>
        <AppButton disabled={busy} variant="ghost" onPress={() => void run(async () => { try { await portalRequest('/logout', token, { method: 'POST' }); } finally { generation.current += 1; setToken(''); setOverview(null); setCaseId(''); } })}>Terminar sessão</AppButton></Row>
      {overview.cases.length ? <>
        <SelectField label="O teu processo" value={overview.cases.find(item => item.id === caseId) ? label(overview.cases.find(item => item.id === caseId)!) : 'Selecionar processo'} options={overview.cases.map(label)} onChange={value => setCaseId(overview.cases.find(item => label(item) === value)?.id ?? '')} />
        {caseId && <PortalCaseView key={`${token}:${caseId}`} caseId={caseId} token={token} onExpired={expired} />}
      </> : <Panel title="Ainda não há processos publicados"><Copy>O escritório ainda não disponibilizou um processo neste portal. Volta a atualizar mais tarde ou contacta o teu advogado.</Copy></Panel>}
    </>}
  </PortalShell>;
}
