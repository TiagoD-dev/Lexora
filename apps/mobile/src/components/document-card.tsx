import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatFileSize } from '@/components/document-upload';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import type { CaseDocument } from '@/types/case';
import { hashTheme } from '@/utils/palette';

type DocumentCardDocument = CaseDocument & { caseId: string; caseTitle: string; reference: string };

type DocumentCardProps = {
  document: DocumentCardDocument;
  onReview?: () => void;
  onOpen?: () => void;
  onDelete: () => void;
  index?: number;
};

function statusTheme(colors: ThemeColors, status?: CaseDocument['extractionStatus']) {
  if (status === 'Revisto') return { bg: colors.successBackground, fg: colors.successText };
  if (status === 'Erro') return { bg: colors.warningBackground, fg: colors.danger };
  if (status === 'Por rever') return { bg: colors.primaryLight, fg: colors.primary };
  if (status === 'A processar') return { bg: colors.warningBackground, fg: colors.warningText };
  return { bg: colors.surfaceMuted, fg: colors.textMuted };
}

export function DocumentCard({ document, onReview, onOpen, onDelete, index = 0 }: DocumentCardProps) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const icon = hashTheme(colors, document.type || document.name);
  const status = statusTheme(colors, document.extractionStatus);
  const canReview = document.extractionStatus === 'Por rever' || document.extractionStatus === 'Revisto';

  return (
    <Animated.View entering={FadeInDown.duration(260).delay(Math.min(index, 10) * 30)} style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: icon.bg }]}><Text style={[styles.iconText, { color: icon.fg }]}>{document.type}</Text></View>
          <View style={styles.headline}>
            <Text numberOfLines={1} style={styles.name}>{document.name}</Text>
            <Text numberOfLines={1} style={styles.meta}>{document.reference} · {document.caseTitle}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}><Text style={[styles.statusText, { color: status.fg }]}>{document.extractionStatus ?? 'Por extrair'}</Text></View>
        </View>
        <View style={styles.metaRow}>
          {formatFileSize(document.size) ? <Text style={styles.metaChip}>{formatFileSize(document.size)}</Text> : null}
          {document.pageCount ? <Text style={styles.metaChip}>{document.pageCount} pág.</Text> : null}
          {document.suggestions?.length ? <Text style={styles.metaChipAccent}>{document.suggestions.length} elementos encontrados</Text> : null}
        </View>
        {document.extractionError ? <Text numberOfLines={2} style={styles.error}>{document.extractionError}</Text> : null}
        <View style={styles.divider} />
        <View style={styles.actions}>
          {canReview && onReview ? <Pressable accessibilityRole="button" onPress={onReview} style={styles.actionButton}><Text style={styles.review}>Rever</Text></Pressable> : null}
          {document.fileId && onOpen ? <Pressable accessibilityRole="button" onPress={onOpen} style={styles.actionButton}><Text style={styles.open}>Abrir</Text></Pressable> : <Text style={styles.openMuted}>Ficheiro indisponível</Text>}
          <Pressable accessibilityLabel={`Eliminar ${document.name}`} accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}><Text style={styles.delete}>Eliminar</Text></Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { minWidth: 300, flexBasis: 380, flexGrow: 1 },
  card: { height: '100%', padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  iconText: { fontSize: 9, fontWeight: '900' },
  headline: { flex: 1 },
  name: { color: colors.textStrong, fontSize: 13, fontWeight: '800' },
  meta: { marginTop: 2, color: colors.textMuted, fontSize: 10 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  statusText: { fontSize: 9, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, color: colors.textMuted, backgroundColor: colors.surfaceMuted, fontSize: 9, fontWeight: '600' },
  metaChipAccent: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, color: colors.primary, backgroundColor: colors.primaryLight, fontSize: 9, fontWeight: '700' },
  error: { marginTop: 8, color: colors.danger, fontSize: 9, lineHeight: 13 },
  divider: { height: 1, marginTop: 14, marginBottom: 10, backgroundColor: colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 },
  actionButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background },
  review: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  open: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  openMuted: { color: colors.textSoft, fontSize: 10 },
  pressed: { opacity: 0.6 },
  deleteButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, backgroundColor: colors.surface },
  delete: { color: colors.danger, fontSize: 10, fontWeight: '900' },
});
