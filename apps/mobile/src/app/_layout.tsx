import { ActivityIndicator, Text, View } from 'react-native';
import { SyncStatusBanner } from '@/components/sync-status-banner';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { CasesProvider, useCases } from '@/providers/cases-provider';
import { ClientsProvider, useClients } from '@/providers/clients-provider';
import { LegalUpdatesProvider } from '@/providers/legal-updates-provider';
import { ThemeProvider, useAppTheme } from '@/providers/theme-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { AssistantProvider } from '@/providers/assistant-provider';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

const PUBLIC_ROUTES = new Set(['login', 'register', 'plans', 'portal']);

export default function RootLayout() {
  return <ThemeProvider><SettingsProvider><AuthProvider><ClientsProvider><CasesProvider><LegalUpdatesProvider><AssistantProvider><Navigation /></AssistantProvider></LegalUpdatesProvider></CasesProvider></ClientsProvider></AuthProvider></SettingsProvider></ThemeProvider>;
}

function Navigation() {
  const { isDark, colors } = useAppTheme();
  const { hydrated: casesHydrated } = useCases();
  const { hydrated: clientsHydrated } = useClients();
  const { user, hydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const root = segments[0];
    const isPublicRoute = root === undefined || PUBLIC_ROUTES.has(root);
    if (!user && !isPublicRoute) { router.replace('/login'); return; }
    if (user && (root === 'login' || root === 'register')) router.replace('/home');
  }, [user, hydrated, segments, router]);

  const inPortal = (segments as readonly string[])[0] === 'portal';
  const loading = !inPortal && (!hydrated || !!user && (!casesHydrated || !clientsHydrated));
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!inPortal && user && casesHydrated && clientsHydrated && <SyncStatusBanner />}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      {loading && <View accessibilityViewIsModal style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 }}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.text, fontSize: 14 }}>A carregar os teus dados…</Text></View>}
    </View>
  );
}

