import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ApiError, getStoredToken } from './api-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export type PortalCase = { id: string; title: string; reference: string; status: string; responsible: string; summary: string; published: boolean; updatedAt: string | null };
export type PortalItem = { id: string; kind: 'message' | 'request' | 'document' | 'charge'; author: 'office' | 'client'; createdAt: string; data: { text?: string; name?: string; size?: number; requestId?: string; amountCents?: number; instructions?: string; dueDate?: string; paid?: boolean; paidAt?: string } };
export type PortalDetail = { case: PortalCase; items: PortalItem[] };
export type PortalOverview = { client: { id: string; name: string; email: string }; office?: string; cases: PortalCase[]; access?: { id: string; active: boolean; activated: boolean; email: string; expiresAt: string } | null };
export type PortalCredentials = { accessId: string; email: string; password: string; code?: string };
// A string is a client session; undefined explicitly selects the office session.
// Portal tokens never enter the office token store or the offline data cache.
export async function portalRequest<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const auth = token === undefined ? await getStoredToken() : token;
  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${auth}`;
  let response: Response;
  try { response = await fetch(`${API_URL}/portal${path}`, { ...options, headers, cache: 'no-store' }); }
  catch { throw new Error('Não foi possível contactar o servidor. Verifica a ligação e tenta novamente.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(typeof body?.detail === 'string' ? body.detail : 'Não foi possível concluir o pedido. Confirma os campos.', response.status);
  }
  return response.status === 204 ? undefined as T : response.json();
}

export async function uploadPortalDocument(caseId: string, token?: string, requestId?: string) {
  const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv', 'image/png', 'image/jpeg'] });
  if (result.canceled) return false;
  const asset = result.assets[0];
  if (asset.size !== undefined && (asset.size === 0 || asset.size > 25 * 1024 * 1024)) throw new Error('O ficheiro deve ter entre 1 byte e 25 MB.');
  const body = new FormData();
  if (Platform.OS === 'web') {
    if (!asset.file) throw new Error('Não foi possível ler o ficheiro selecionado.');
    body.append('file', asset.file, asset.name);
  } else body.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as never);
  if (requestId) body.append('requestId', requestId);
  await portalRequest(`/cases/${encodeURIComponent(caseId)}/documents`, token, { method: 'POST', body });
  return true;
}

export async function downloadPortalDocument(item: PortalItem, token?: string) {
  const auth = token === undefined ? await getStoredToken() : token;
  const url = `${API_URL}/portal/documents/${encodeURIComponent(item.id)}`;
  const headers = { Authorization: `Bearer ${auth}` };
  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) throw new ApiError('Não foi possível descarregar o documento. Atualiza o portal e tenta novamente.', response.status);
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl; anchor.download = item.data.name ?? 'documento'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } else {
    const fileSystem = await import('expo-file-system/legacy');
    const sharing = await import('expo-sharing');
    if (!await sharing.isAvailableAsync()) throw new Error('A partilha de documentos não está disponível neste dispositivo.');
    const safeName = (item.data.name ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${fileSystem.cacheDirectory}portal-${item.id}-${safeName}`;
    try {
      const result = await fileSystem.downloadAsync(url, path, { headers });
      if (result.status !== 200) throw new ApiError('Documento indisponível. Atualiza o portal e tenta novamente.', result.status);
      await sharing.shareAsync(result.uri);
    } finally { await fileSystem.deleteAsync(path, { idempotent: true }); }
  }
}
