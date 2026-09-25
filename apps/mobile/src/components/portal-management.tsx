import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/services/api-client';
import { portalRequest, type PortalOverview } from '@/services/portal-service';
import { useAppTheme } from '@/providers/theme-provider';
import { radius } from '@/theme';
import { AppButton } from './app-button';
import { AppInput } from './app-input';
import { Copy, Feedback, Hero, Row, Stat } from './business-preview';
import { EmptyState } from './empty-state';
import { Icon, type IconName } from './icon';
import { PortalCaseView } from './portal-case';
import { Avatar, Card, Chip, IconBox, InfoRow, PortalError, PortalShell, SectionTitle, type Tone } from './portal-shell';
import { SelectField } from './select-field';

type ClientChoice = { id: string; name: string; email: string };

function accessState(overview?: PortalOverview | null): { label: string; tone: Tone; icon: IconName } {
  if (overview === null) return { label: 'Indisponível', tone: 'neutral', icon: 'cloud-off-outline' };
  if (!overview) return { label: 'A verificar…', tone: 'neutral', icon: 'progress-clock' };
  const access = overview.access;
  if (!access?.active) return { label: 'Sem acesso', tone: 'neutral', icon: 'shield-off-outline' };
  if (access.email !== overview.client.email.trim().toLowerCase()) return { label: 'Email alterado', tone: 'danger', icon: 'email-alert-outline' };
  if (access.activated) return { label: 'Acesso ativo', tone: 'success', icon: 'shield-check-outline' };
  return new Date(access.expiresAt) < new Date() ? { label: 'Convite expirado', tone: 'danger', icon: 'clock-alert-outline' } : { label: 'Convite pendente', tone: 'warning', icon: 'email-fast-outline' };
}

export function PortalManagement() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [clients, setClients] = useState<ClientChoice[]>([]);
  const [overviews, setOverviews] = useState<Record<string, PortalOverview | null>>({});
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const list = await apiFetch<ClientChoice[]>('/clients');
      setClients(list);
      // ponytail: one request per client for the summary; add a bulk endpoint if client lists grow large.
      const results = await Promise.allSettled(list.map(client => portalRequest<PortalOverview>(`/manage/clients/${encodeURIComponent(client.id)}`)));
      setOverviews(Object.fromEntries(list.map((client, index) => [client.id, results[index].status === 'fulfilled' ? results[index].value : null])));
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os clientes.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const onOverview = useCallback((overview: PortalOverview) => setOverviews(current => ({ ...current, [overview.client.id]: overview })), []);
  const label = (client: ClientChoice) => `${client.name} · ${client.email || 'Sem email'} · ${client.id}`;
  const selected = clients.find(client => client.id === clientId);
  const states = clients.map(client => accessState(overviews[client.id]).label);
  const count = (value: string) => states.filter(state => state === value).length;
  const published = Object.values(overviews).reduce((sum, item) => sum + (item?.cases.filter(entry => entry.published).length ?? 0), 0);
  return <PortalShell title="Portal do cliente" subtitle="Escolhe o cliente, gere o acesso e publica apenas a informação que pretendes partilhar.">
    <PortalError message={error} />
    {loading ? <ActivityIndicator /> : !clients.length ? <>
      <EmptyState symbol="account-group-outline" title="Ainda não há clientes" description="Cria uma ficha em Clientes, preenche o email e associa um caso para disponibilizar o portal." />
      <AppButton onPress={() => router.push('/clients/new')}>Criar cliente</AppButton>
    </> : <>
      <Hero label="ACESSOS AO PORTAL" value={`${count('Acesso ativo')} de ${clients.length}`} caption="clientes com acesso ativo ao portal">
        <Row><Stat label="Convites pendentes" value={String(count('Convite pendente'))} /><Stat label="A rever" value={String(count('Convite expirado') + count('Email alterado'))} /><Stat label="Processos publicados" value={String(published)} /></Row>
      </Hero>
      <SectionTitle title={selected ? 'Cliente selecionado' : 'Clientes'} icon="account-group-outline">
        <Pressable accessibilityRole="button" onPress={() => void load()}><Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>Atualizar clientes</Text></Pressable>
      </SectionTitle>
      <SelectField label="Cliente" value={selected ? label(selected) : 'Selecionar cliente'} options={clients.map(label)} onChange={value => setClientId(clients.find(client => label(client) === value)?.id ?? '')} />
      {selected ? <>
        <AppButton variant="ghost" onPress={() => setClientId('')}>Ver todos os clientes</AppButton>
        <ClientPortalManagement key={selected.id} clientId={selected.id} onOverview={onOverview} />
      </> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {clients.map(client => <ClientTile key={client.id} client={client} overview={overviews[client.id]} onPress={() => setClientId(client.id)} />)}
      </View>}
    </>}
  </PortalShell>;
}

function ClientTile({ client, overview, onPress }: { client: ClientChoice; overview?: PortalOverview | null; onPress: () => void }) {
  const { colors } = useAppTheme();
  const state = accessState(overview);
  const cases = overview?.cases ?? [];
  return <Pressable accessibilityRole="button" accessibilityLabel={`Gerir portal de ${client.name}`} onPress={onPress} style={({ pressed }) => ({ flexGrow: 1, flexBasis: 280, gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={client.name} />
      <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: colors.textStrong, fontSize: 15, fontWeight: '800' }}>{client.name}</Text><Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{client.email || 'Sem email na ficha'}</Text></View>
      <Icon name="chevron-right" size={20} color={colors.textMuted} />
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Chip {...state} />
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{cases.filter(item => item.published).length} de {cases.length} processos publicados</Text>
    </View>
  </Pressable>;
}

function ClientPortalManagement({ clientId, onOverview }: { clientId: string; onOverview: (overview: PortalOverview) => void }) {
  const { colors } = useAppTheme();
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
    if (alive.current) { setOverview(result); onOverview(result); setCaseId(current => result.cases.some(item => item.id === current) ? current : result.cases[0]?.id ?? ''); }
  }, [clientId, onOverview]);
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
  const caseLabel = (item: PortalOverview['cases'][number]) => `${item.reference} · ${item.title} · ${item.id}`;
  const selectedCase = overview?.cases.find(item => item.id === caseId);
  return <>
    <PortalError message={error} /><Feedback>{feedback}</Feedback>
    {!overview ? <AppButton disabled={busy} onPress={() => void run(refresh)}>Carregar portal</AppButton> : <>
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <Avatar name={overview.client.name} size={52} />
          <View style={{ flex: 1, minWidth: 160 }}><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{`Acesso · ${overview.client.name}`}</Text><Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>{overview.access?.active ? overview.access.activated ? 'Acesso ativado pelo cliente' : 'Convite criado · Aguarda ativação' : 'Sem acesso ativo'}</Text></View>
          <Chip {...accessState(overview)} />
        </View>
        <InfoRow icon="email-outline">Email da ficha: {overview.client.email || 'Preenche o email na ficha do cliente.'}</InfoRow>
        <InfoRow icon="folder-eye-outline">{overview.cases.filter(item => item.published).length} de {overview.cases.length} processos publicados no portal</InfoRow>
        {overview.access && overview.access.email !== overview.client.email.trim().toLowerCase() && <InfoRow icon="alert-outline">O email foi alterado. Gera um novo convite para reativar o acesso.</InfoRow>}
        {accessUrl && <AppInput label="Endereço do portal do cliente" value={accessUrl} editable={false} />}
        <Row><AppButton disabled={busy || !overview.client.email} onPress={() => setConfirm('invite')}>{overview.access ? 'Gerar novo convite' : 'Criar convite'}</AppButton>
          {overview.access?.active && <AppButton disabled={busy} variant="ghost" onPress={() => setConfirm('revoke')}>Revogar acesso</AppButton>}
          <AppButton disabled={busy} variant="ghost" onPress={() => void run(refresh)}>Atualizar estado</AppButton>
        </Row>
        {confirm && <View style={{ gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: confirm === 'invite' ? colors.warningBackground : colors.primaryLight }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name={confirm === 'invite' ? 'email-plus-outline' : 'shield-remove-outline'} size={18} color={confirm === 'invite' ? colors.warningText : colors.danger} /><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{confirm === 'invite' ? 'Criar convite de acesso' : 'Revogar acesso do cliente'}</Text></View>
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
        </View>}
        {invite && <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.primaryLight }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="key-variant" size={18} color={colors.primary} /><Text accessibilityRole="header" style={{ color: colors.primary, fontSize: 16, fontWeight: '800' }}>Convite pronto a partilhar</Text></View>
          <AppInput label="Código de ativação — mostrado apenas agora" value={invite.code} editable={false} />
          <Copy>Válido até {new Date(invite.expiresAt).toLocaleString('pt-PT')}. O cliente abre o endereço acima, escolhe “Ativar acesso” e introduz este código, o email e uma palavra-passe. Não foi enviado nenhum email automaticamente.</Copy>
        </View>}
      </Card>
      <SectionTitle title="Processos no portal" icon="briefcase-outline">{selectedCase ? <Chip label={selectedCase.published ? 'Publicado' : 'Privado'} tone={selectedCase.published ? 'success' : 'neutral'} icon={selectedCase.published ? 'eye-outline' : 'eye-off-outline'} /> : null}</SectionTitle>
      {overview.cases.length ? <>
        <SelectField label="Processo associado" value={selectedCase ? caseLabel(selectedCase) : 'Selecionar processo'} options={overview.cases.map(caseLabel)} onChange={value => setCaseId(overview.cases.find(item => caseLabel(item) === value)?.id ?? '')} />
        {caseId && <PortalCaseView key={caseId} caseId={caseId} onChanged={() => void refresh().catch(() => undefined)} />}
      </> : <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconBox icon="folder-alert-outline" tone="warning" /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Sem processos associados</Text><Copy>Associa este cliente a um caso para poderes publicar atualizações, trocar mensagens e pedir documentos.</Copy></View></View></Card>}
    </>}
  </>;
}
