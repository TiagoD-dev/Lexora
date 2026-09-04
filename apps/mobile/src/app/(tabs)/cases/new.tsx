import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaseForm } from '@/components/case-form';
import { ScreenHeader } from '@/components/screen-header';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';

export default function NewCaseScreen() {
  const router = useRouter(); const { description, clientId, client } = useLocalSearchParams<{ description?: string; clientId?: string; client?: string }>(); const { createCase } = useCases(); const { colors } = useAppTheme();
  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}><ScreenHeader title="Novo caso" subtitle="Registo seguro e editável" /><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><CaseForm initial={{ description: description ?? '', clientId, client: client ?? '' }} submitLabel="Criar caso" onSubmit={(value) => { const id = createCase(value); router.replace({ pathname: '/cases/[id]', params: { id } }); }} /></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 20 }, content: { paddingBottom: 40 } });
