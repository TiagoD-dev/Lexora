import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

export function LegalNotice() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <View style={styles.notice}>
      <Text style={styles.title}>Informação importante</Text>
      <Text style={styles.text}>
        A Lexora presta informação e triagem jurídica. As respostas podem depender de
        factos adicionais e não substituem a consulta de um profissional habilitado.
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  notice: { padding: 18, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  title: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
  text: { marginTop: 7, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
