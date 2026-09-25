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

// Cache apenas para pedidos públicos; dados autenticados usam cache por conta nos providers.
// Nunca ler respostas privadas guardadas pela versão anterior nesta cache global.
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

const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAYS_MS = [500, 1500];

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ponytail: uma única política fixa (2 tentativas, 500ms/1500ms) para todo o cliente, só para
// falhas de rede/timeout e 5xx — 4xx nunca é repetido. Adicionar config por pedido se algum
// endpoint precisar de comportamento diferente.
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.status >= 500 && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      throw error;
    }
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isGet = (options.method ?? 'GET').toUpperCase() === 'GET';
  const token = await getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetchWithRetry(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (isGet && !token) {
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
  if (isGet && !token) setCachedResponse(path, payload).catch(() => undefined);
  return payload as T;
}
