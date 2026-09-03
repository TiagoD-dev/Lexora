import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { CasesProvider } from '@/providers/cases-provider';
import { ClientsProvider } from '@/providers/clients-provider';
import { LegalUpdatesProvider } from '@/providers/legal-updates-provider';
import { ThemeProvider, useAppTheme } from '@/providers/theme-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { AssistantProvider } from '@/providers/assistant-provider';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

const PUBLIC_ROUTES = new Set(['login', 'register', 'plans']);

export default function RootLayout() {
  return <ThemeProvider><SettingsProvider><AuthProvider><ClientsProvider><CasesProvider><LegalUpdatesProvider><AssistantProvider><Navigation /></AssistantProvider></LegalUpdatesProvider></CasesProvider></ClientsProvider></AuthProvider></SettingsProvider></ThemeProvider>;
}

function Navigation() {
  const { isDark } = useAppTheme();
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

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </>
  );
}
