import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlansContent } from '@/components/plans-content';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

export default function BillingScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.wrap}>
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>PLANO E FATURAÇÃO</Text>
          <Text style={styles.pageTitle}>Planos</Text>
          <Text style={styles.pageSubtitle}>Consulta o plano atual e compara funcionalidades.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PlansContent />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20 },
  pageIntro: { paddingTop: 20, paddingBottom: 18 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  pageTitle: { marginTop: 5, color: colors.text, fontSize: 28, fontWeight: '800' },
  pageSubtitle: { marginTop: 5, color: colors.textMuted, fontSize: 13 },
  content: { paddingBottom: 48 },
});
