import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaseForm } from '@/components/case-form';
import { ScreenHeader } from '@/components/screen-header';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';

export default function EditCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const { getCase, updateCase } = useCases(); const { colors } = useAppTheme(); const item = getCase(id);
  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}><ScreenHeader title="Editar caso" subtitle={item?.title} /><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{item ? <CaseForm initial={item} submitLabel="Guardar alterações" onSubmit={(value) => { updateCase(id, value); router.back(); }} /> : <Text style={{ color: colors.textMuted }}>Caso não encontrado.</Text>}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 20 }, content: { paddingBottom: 40 } });
