import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { askAssistantRemote } from '@/services/assistant-service';
import type { LegalCase } from '@/types/case';

export type AssistantMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
export type AssistantThread = { id: string; caseId: string; title: string; createdAt: string; updatedAt: string; messages: AssistantMessage[] };
type AssistantContextValue = { threads: AssistantThread[]; createThread: (caseId: string) => string; deleteThread: (id: string) => void; sendMessage: (threadId: string, prompt: string, legalCase: LegalCase) => Promise<void> };
const AssistantContext = createContext<AssistantContextValue | null>(null);
const STORAGE_KEY = '@lexora/assistant-threads/v1';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) { const stored: unknown = JSON.parse(raw); if (Array.isArray(stored)) setThreads(stored); } }).catch(() => undefined).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(threads)).catch(() => undefined); }, [hydrated, threads]);
  const createThread = (caseId: string) => { const id = uid(); const now = new Date().toISOString(); setThreads((all) => [{ id, caseId, title: 'Nova conversa', createdAt: now, updatedAt: now, messages: [] }, ...all]); return id; };
  const deleteThread = (id: string) => setThreads((all) => all.filter((thread) => thread.id !== id));
  const sendMessage = async (threadId: string, prompt: string, legalCase: LegalCase) => {
    const trimmed = prompt.trim();
    const userMessage: AssistantMessage = { id: uid(), role: 'user', content: trimmed, createdAt: new Date().toISOString() };
    setThreads((all) => all.map((thread) => {
      if (thread.id !== threadId || thread.caseId !== legalCase.id) return thread;
      const firstQuestion = thread.messages.every((message) => message.role !== 'user');
      return { ...thread, title: firstQuestion ? trimmed.slice(0, 54) : thread.title, updatedAt: userMessage.createdAt, messages: [...thread.messages, userMessage] };
    }));
    let reply: string;
    try {
      reply = (await askAssistantRemote(legalCase.id, trimmed)).reply;
    } catch {
      reply = 'Não foi possível obter resposta do assistente. Tenta novamente.';
    }
    const assistantMessage: AssistantMessage = { id: uid(), role: 'assistant', content: reply, createdAt: new Date().toISOString() };
    setThreads((all) => all.map((thread) => thread.id === threadId && thread.caseId === legalCase.id ? { ...thread, updatedAt: assistantMessage.createdAt, messages: [...thread.messages, assistantMessage] } : thread));
  };
  const value = useMemo(() => ({ threads, createThread, deleteThread, sendMessage }), [threads]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() { const value = useContext(AssistantContext); if (!value) throw new Error('useAssistant deve ser usado dentro de AssistantProvider'); return value; }
