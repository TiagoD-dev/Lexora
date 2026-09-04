import { Alert, Linking, Platform } from 'react-native';
import { getStoredToken } from '@/services/api-client';
import type { CaseDocument } from '@/types/case';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function openDocument(document: CaseDocument) {
  if (!document.fileId) {
    Alert.alert('Ficheiro indisponível', 'Este registo não contém uma cópia guardada do ficheiro. Carrega novamente o documento para o poderes abrir.');
    return;
  }
  const token = await getStoredToken();
  const url = `${API_URL}/documents/file/${document.fileId}?token=${encodeURIComponent(token ?? '')}`;
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir', 'Não existe uma aplicação disponível para visualizar este formato.');
  }
}

export function canPreviewInline(document: CaseDocument) {
  return document.type.toUpperCase() === 'PDF' || document.mimeType === 'application/pdf';
}
