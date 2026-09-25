import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';

const sections: Record<string, string> = { home: 'HOJE', cases: 'CASOS', tasks: 'PRAZOS', documents: 'DOCS', assistant: 'IA LEGAL' };

export function BrandTitle({ route }: { route: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.brand, { color: colors.primary }]}>LEXORA</Text>
      <Text style={[styles.section, { color: colors.accent }]}>{sections[route.split('/')[0]] ?? 'DIREITO DIGITAL'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  brand: { fontSize: 19, fontWeight: '800', letterSpacing: 2.4 },
  section: { marginTop: -2, fontSize: 9, fontWeight: '800', letterSpacing: 2.2 },
});
