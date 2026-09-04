import { StyleSheet, Text, View } from 'react-native';

import { useIsOffline } from '@/services/api-client';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

export function OfflineBanner() {
  const offline = useIsOffline();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  if (!offline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Sem ligação — a mostrar dados guardados</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  banner: { marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.warningBackground },
  text: { color: colors.warningText, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
