import { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { AppButton } from '@/components/app-button';
import { Icon } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseDocument } from '@/types/case';
import { extractDocument } from '@/utils/document-extraction';

type NewDocument = Omit<CaseDocument, 'id' | 'addedAt' | 'status'>;
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'csv', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const ACCEPTED_MIME = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/markdown', 'text/csv', 'image/*'];

export function DocumentUpload({ onAdd }: { onAdd: (document: NewDocument) => void }) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors); const inputRef = useRef<HTMLInputElement | null>(null); const [processing, setProcessing] = useState(false);
  const processFile = async (file: File | { uri: string; name: string; mimeType?: string; size?: number }) => {
    const name = file.name; const extension = name.split('.').pop()?.toLowerCase() ?? ''; const size = file.size;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return Alert.alert('Formato não suportado', 'Seleciona PDF, DOCX, XLSX, imagem ou um ficheiro de texto.');
    if (size && size > 25 * 1024 * 1024) return Alert.alert('Ficheiro demasiado grande', 'O limite atual é de 25 MB por documento.');
    setProcessing(true);
    const isBrowserFile = typeof File !== 'undefined' && file instanceof File;
    const mimeType = isBrowserFile ? file.type || undefined : (file as { mimeType?: string }).mimeType;
    try {
      const result = await extractDocument(file);
      onAdd({ name, type: extension.toUpperCase(), mimeType, size, fileId: result.fileId, extractionStatus: 'Por rever', extractedText: result.text, extractedCharacterCount: result.characterCount, pageCount: result.pageCount, suggestions: result.suggestions });
      Alert.alert('Extração concluída', `Foram encontrados ${result.suggestions.length} elementos para rever.`);
    } catch (error) {
      onAdd({ name, type: extension.toUpperCase(), mimeType, size, extractionStatus: 'Erro', extractionError: error instanceof Error ? error.message : 'Erro desconhecido', suggestions: [] });
      Alert.alert('Documento carregado', 'O ficheiro ficou associado ao Caso, mas a extração falhou. Confirma se a API está ativa.');
    } finally { setProcessing(false); }
  };
  const chooseDocument = async () => {
    if (Platform.OS === 'web') {
      if (!inputRef.current) { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp,.heic,.heif'; input.onchange = () => { const file = input.files?.[0]; if (file) processFile(file); input.value = ''; }; inputRef.current = input; }
      inputRef.current.click(); return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_MIME, copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) { const asset = result.assets[0]; await processFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size }); }
  };
  return <View style={styles.box}><View style={styles.icon}>{processing ? <Text style={styles.iconText}>…</Text> : <Icon name="file-upload-outline" size={22} color={colors.primary} />}</View><View style={styles.copy}><Text style={styles.title}>{processing ? 'A extrair conteúdo…' : 'Carregar e extrair'}</Text><Text style={styles.caption}>PDF, DOCX, XLSX, imagem ou texto · até 25 MB</Text></View><AppButton disabled={processing} onPress={() => chooseDocument().catch(() => Alert.alert('Erro', 'Não foi possível abrir o seletor de ficheiros.'))}>{processing ? 'A processar' : 'Escolher ficheiro'}</AppButton></View>;
}
export function formatFileSize(size?: number) { if (!size) return undefined; if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`; return `${(size / (1024 * 1024)).toFixed(1)} MB`; }
const makeStyles = (colors: ThemeColors) => StyleSheet.create({ box: { gap: 12, alignItems: 'center', padding: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: radius.xl, backgroundColor: colors.background }, icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.primaryLight }, iconText: { color: colors.primary, fontSize: 20, fontWeight: '900' }, copy: { alignItems: 'center', gap: 4 }, title: { color: colors.textStrong, fontSize: 14, fontWeight: '800' }, caption: { color: colors.textMuted, fontSize: 11, textAlign: 'center' } });
