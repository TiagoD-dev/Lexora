import { Alert, Linking, Platform } from 'react-native';
import type { CaseDocument } from '@/types/case';

export async function openDocument(document: CaseDocument) {
  if (!document.uri) {
    Alert.alert('Ficheiro indisponível', 'Este registo não contém uma cópia local do ficheiro. Carrega novamente o documento para o poderes abrir.');
    return;
  }
  try {
    if (Platform.OS === 'web') {
      window.open(document.uri, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(document.uri);
  } catch {
    Alert.alert('Não foi possível abrir', 'Não existe uma aplicação disponível para visualizar este formato.');
  }
}

export function canPreviewInline(document: CaseDocument) {
  return document.type.toUpperCase() === 'PDF' || document.mimeType === 'application/pdf';
}
