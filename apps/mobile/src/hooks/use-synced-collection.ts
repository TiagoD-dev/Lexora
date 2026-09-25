import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type Entity = { id: string };
export type SyncOperation<T> = { kind: 'create'; item: T } | { kind: 'update'; id: string; patch: Partial<T> } | { kind: 'delete'; id: string };
type Scope<T> = { userId: string; key: string; active: boolean; items: T[]; revision: number; queue: SyncOperation<T>[]; running: boolean; failure: string | null; loadFailure: string | null; hydrated: boolean; cacheWrites: Promise<unknown> };
type Snapshot<T> = { owner: string | null; items: T[]; hydrated: boolean; syncStatus: 'saving' | 'saved' | 'error'; syncError: string | null };
type Options<T extends Entity> = { userId: string | null; storageKey: string; loadRemote: () => Promise<T[]>; normalize: (item: T) => T; createRemote: (item: T) => Promise<unknown>; updateRemote: (id: string, patch: Partial<T>) => Promise<unknown>; deleteRemote: (id: string) => Promise<unknown> };
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  return Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => sameValue(left[key], right[key]));
}
export function useSyncedCollection<T extends Entity>({ userId, storageKey, ...options }: Options<T>) {
  const currentUser = useRef(userId);
  const config = useRef(options);
  useLayoutEffect(() => { currentUser.current = userId; config.current = options; }, [userId, options]);
  const scopeRef = useRef<Scope<T> | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ owner: null, items: [], hydrated: false, syncStatus: 'saved', syncError: null });
  const valid = useCallback((scope: Scope<T>) => scope.active && currentUser.current === scope.userId && scopeRef.current === scope, []);
  const publish = useCallback((scope: Scope<T>) => {
    if (!valid(scope)) return;
    const error = scope.failure || scope.loadFailure;
    setSnapshot({ owner: scope.userId, items: scope.items, hydrated: scope.hydrated, syncStatus: error ? 'error' : scope.queue.length ? 'saving' : 'saved', syncError: error });
  }, [valid]);
  const saveCache = useCallback((scope: Scope<T>) => {
    const encoded = JSON.stringify({ items: scope.items, pending: scope.queue });
    scope.cacheWrites = scope.cacheWrites.catch(() => undefined).then(() => {
      if (valid(scope)) return AsyncStorage.setItem(scope.key, encoded);
    });
    void scope.cacheWrites.catch(() => undefined);
  }, [valid]);
  const drain = useCallback(async (scope: Scope<T>) => {
    if (!valid(scope) || scope.running || scope.failure) return;
    scope.running = true; publish(scope);
    try {
      while (valid(scope) && scope.queue.length) {
        const operation = scope.queue[0];
        try {
          // Save pending payloads before sending, so a restart can retry them.
          await scope.cacheWrites;
          if (!valid(scope)) return;
          if (operation.kind === 'create') {
            try { await config.current.createRemote(operation.item); }
            catch (error) {
              if (!valid(scope)) return;
              if (!(error && typeof error === 'object' && 'status' in error && error.status === 409)) throw error;
              const remote = (await config.current.loadRemote()).find(item => item.id === operation.item.id);
              // A previous request may have succeeded before its response was lost.
              if (!remote || !Object.entries(operation.item).every(([key, value]) => value === undefined || sameValue(value, (remote as Record<string, unknown>)[key]))) throw error;
            }
          } else if (operation.kind === 'update') await config.current.updateRemote(operation.id, operation.patch);
          else {
            try { await config.current.deleteRemote(operation.id); }
            catch (error) { if (!(error && typeof error === 'object' && 'status' in error && error.status === 404)) throw error; }
          }
          if (!valid(scope)) return;
          scope.queue.shift(); saveCache(scope); await scope.cacheWrites;
        } catch {
          if (valid(scope)) scope.failure = 'Não foi possível guardar as alterações. Tenta novamente.';
          break;
        }
      }
    } finally { scope.running = false; publish(scope); }
  }, [publish, saveCache, valid]);
  const refresh = useCallback(async (scope: Scope<T>) => {
    const revision = scope.revision;
    try {
      const remote = await config.current.loadRemote();
      if (!valid(scope)) return;
      scope.loadFailure = null;
      if (scope.revision === revision && !scope.queue.length) { scope.items = remote.map(config.current.normalize); saveCache(scope); }
    } catch { if (valid(scope)) scope.loadFailure = 'Não foi possível atualizar os dados do servidor. Tenta novamente.'; }
    finally { if (valid(scope)) { scope.hydrated = true; publish(scope); } }
  }, [publish, saveCache, valid]);
  useEffect(() => {
    if (!userId) { scopeRef.current = null; setSnapshot({ owner: null, items: [], hydrated: true, syncStatus: 'saved', syncError: null }); return; }
    const scope: Scope<T> = { userId, key: `${storageKey}/${encodeURIComponent(userId)}`, active: true, items: [], revision: 0, queue: [], running: false, failure: null, loadFailure: null, hydrated: false, cacheWrites: Promise.resolve() };
    scopeRef.current = scope; publish(scope);
    void (async () => {
      try {
        const cached = await AsyncStorage.getItem(scope.key);
        if (!valid(scope)) return;
        if (cached) {
          const parsed = JSON.parse(cached) as { items?: T[]; pending?: SyncOperation<T>[] };
          if (Array.isArray(parsed.items)) scope.items = parsed.items.map(config.current.normalize);
          if (Array.isArray(parsed.pending)) scope.queue = parsed.pending;
          if (scope.queue.length) scope.failure = 'Existem alterações por enviar. Tenta novamente para as guardar.';
          publish(scope);
        }
      } catch { /* An unreadable cache is replaced by the server response. */ }
      if (valid(scope)) await refresh(scope);
    })();
    return () => { scope.active = false; };
  }, [userId, storageKey, publish, refresh, valid]);
  const setItems = useCallback((next: T[] | ((items: T[]) => T[])) => {
    const scope = scopeRef.current;
    if (!scope || !valid(scope) || !scope.hydrated) return;
    // Invoke recipes exactly once, outside React state updater replay.
    scope.items = typeof next === 'function' ? next(scope.items) : next;
    scope.revision += 1; saveCache(scope); publish(scope);
  }, [publish, saveCache, valid]);
  const enqueue = useCallback((operation: SyncOperation<T>) => {
    const scope = scopeRef.current;
    if (!scope || !valid(scope) || !scope.hydrated) return;
    scope.queue.push(operation); saveCache(scope); publish(scope); void drain(scope);
  }, [drain, publish, saveCache, valid]);
  const retrySync = useCallback(() => {
    const scope = scopeRef.current;
    if (!scope || !valid(scope) || scope.running) return;
    scope.failure = null;
    // Retry local storage as well if the earlier write failed.
    saveCache(scope); publish(scope);
    void drain(scope).then(() => { if (valid(scope) && !scope.failure && scope.loadFailure) void refresh(scope); });
  }, [drain, publish, refresh, saveCache, valid]);
  const visible = snapshot.owner === userId ? snapshot : { owner: userId, items: [] as T[], hydrated: false, syncStatus: 'saved' as const, syncError: null };
  return { ...visible, setItems, enqueue, retrySync };
}
