import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/theme-provider';
import { Copy } from './business-preview';

export function PortalShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '800', letterSpacing: 2, fontSize: 12 }}>LEXORA · PORTAL DO CLIENTE</Text>
        <Text accessibilityRole="header" style={{ fontSize: 30, fontWeight: '700', color: colors.text }}>{title}</Text>
        <Copy>{subtitle}</Copy>{children}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function PortalError({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return message ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: colors.danger, backgroundColor: colors.surface, borderColor: colors.danger, borderWidth: 1, borderRadius: 12, padding: 14, lineHeight: 21 }}>{message}</Text> : null;
}
