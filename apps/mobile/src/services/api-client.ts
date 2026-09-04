import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = '@lexora/auth-token/v1';
const CACHE_PREFIX = '@lexora/cache/';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let cachedToken: string | null | undefined;

export async function getStoredToken(): Promise<string | null> {
  if (cachedToken === undefined) cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setStoredToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

// ponytail: sinal de offline é apenas "a última chamada de rede falhou" (sem listener de conectividade
// em tempo real) — suficiente para mostrar um aviso; adicionar NetInfo/expo-network se for preciso
// deteção proativa (ex. reagir antes do próximo pedido).
let offline = false;
const offlineListeners = new Set<() => void>();
function setOffline(value: boolean) {
  if (offline === value) return;
  offline = value;
  offlineListeners.forEach((listener) => listener());
}
export function useIsOffline(): boolean {
  return useSyncExternalStore(
    (listener) => { offlineListeners.add(listener); return () => offlineListeners.delete(listener); },
    () => offline,
  );
}

// ponytail: cache "last known good response" sem TTL/expiração e sem fila de sync — só leitura em
// modo offline. Adicionar expiração/invalidação se os dados ficarem visivelmente desatualizados.
async function getCachedResponse<T>(path: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${path}`);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}
async function setCachedResponse(path: string, payload: unknown): Promise<void> {
  try { await AsyncStorage.setItem(`${CACHE_PREFIX}${path}`, JSON.stringify(payload)); } catch { /* cache indisponível */ }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isGet = (options.method ?? 'GET').toUpperCase() === 'GET';
  const token = await getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (isGet) {
      const cached = await getCachedResponse<T>(path);
      if (cached !== undefined) { setOffline(true); return cached; }
    }
    setOffline(true);
    throw error;
  }
  setOffline(false);
  if (response.status === 204) return undefined as T;
  let payload: unknown = null;
  try { payload = await response.json(); } catch { /* resposta sem corpo JSON */ }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : 'Ocorreu um erro ao comunicar com o servidor.';
    throw new ApiError(message, response.status);
  }
  if (isGet) setCachedResponse(path, payload).catch(() => undefined);
  return payload as T;
}
