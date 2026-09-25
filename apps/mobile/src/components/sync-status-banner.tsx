import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCases } from '@/providers/cases-provider';
import { useClients } from '@/providers/clients-provider';
import { useAppTheme } from '@/providers/theme-provider';

export function SyncStatusBanner() {
  const cases = useCases();
  const clients = useClients();
  const { colors } = useAppTheme();
  const failed = cases.syncStatus === 'error' || clients.syncStatus === 'error';
  const saving = cases.syncStatus === 'saving' || clients.syncStatus === 'saving';
  const detail = [cases.syncError && `Casos: ${cases.syncError}`, clients.syncError && `Clientes: ${clients.syncError}`].filter(Boolean).join(' ');
  return <View style={[styles.banner, { backgroundColor: failed ? colors.warningBackground : colors.surface, borderBottomColor: colors.border }]}>
    <View style={styles.copy} accessibilityLiveRegion="polite">
      <Text style={[styles.title, { color: failed ? colors.warningText : colors.textMuted }]}>{failed ? 'Falha na sincronização' : saving ? 'A guardar…' : 'Guardado no servidor'}</Text>
      {failed && <Text style={[styles.detail, { color: colors.warningText }]}>{detail}</Text>}
    </View>
    {failed && <Pressable accessibilityRole="button" accessibilityLabel="Tentar sincronizar novamente" onPress={() => { cases.retrySync(); clients.retrySync(); }} style={[styles.retry, { borderColor: colors.warningText }]}><Text style={[styles.title, { color: colors.warningText }]}>Tentar novamente</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  banner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  copy: { flex: 1, minWidth: 150 }, title: { fontSize: 12, fontWeight: '600' }, detail: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  retry: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
});
