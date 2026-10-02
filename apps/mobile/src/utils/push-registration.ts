import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { registerPushToken, unregisterPushToken } from '@/services/notifications-service';

let registeredToken: string | null = null;

/** Obtém o token Expo deste dispositivo e regista-o no servidor. Ignora em silêncio web/simulador/sem projectId. */
export async function registerForPush() {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (Platform.OS === 'web' || !Device.isDevice || !projectId) return;
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(data);
    registeredToken = data;
  } catch { /* push é acessório: falhar não pode afetar o login */ }
}

/** Chamar antes de apagar o token de sessão (o pedido precisa de autenticação). */
export async function unregisterForPush() {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await unregisterPushToken(token).catch(() => undefined);
}
