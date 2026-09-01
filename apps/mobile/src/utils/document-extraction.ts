import type { DocumentSuggestion } from '@/types/case';
import { getStoredToken } from '@/services/api-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export type ExtractionResult = { text: string; characterCount: number; pageCount?: number; suggestions: DocumentSuggestion[] };

export async function extractDocument(file: File | { uri: string; name: string; mimeType?: string }): Promise<ExtractionResult> {
  const body = new FormData();
  if (typeof File !== 'undefined' && file instanceof File) body.append('file', file, file.name);
  else { const asset = file as { uri: string; name: string; mimeType?: string }; body.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as never); }
  const token = await getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await fetch(`${API_URL}/documents/extract`, { method: 'POST', body, headers });
  if (!response.ok) {
    let message = 'Não foi possível extrair o conteúdo.';
    try { const payload = await response.json(); if (payload.detail) message = String(payload.detail); } catch { /* resposta sem JSON */ }
    throw new Error(message);
  }
  return response.json();
}
