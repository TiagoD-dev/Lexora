import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlansContent } from '@/components/plans-content';
import { ScreenHeader } from '@/components/screen-header';
import { useAppTheme } from '@/providers/theme-provider';
import type { ThemeColors } from '@/theme';

export default function PlansScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.wrap}>
        <ScreenHeader title="Planos Lexora" subtitle="Escolhe a capacidade certa para a tua prática" />
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
  content: { paddingBottom: 48 },
});
