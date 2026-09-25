import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { askAssistantRemote, type AssistantAction, type AssistantReply, type AssistantSource } from '@/services/assistant-service';
import type { LegalCase } from '@/types/case';

export type AssistantMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string; actions?: AssistantAction[]; sources?: AssistantSource[] };
export type AssistantThread = { id: string; caseId: string; title: string; createdAt: string; updatedAt: string; messages: AssistantMessage[] };
type AssistantContextValue = { threads: AssistantThread[]; createThread: (caseId: string) => string; deleteThread: (id: string) => void; sendMessage: (threadId: string, prompt: string, legalCase: LegalCase) => Promise<void>; setActionState: (threadId: string, messageId: string, index: number, state: AssistantAction['state']) => void };
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
    const history = (threads.find((thread) => thread.id === threadId)?.messages ?? []).slice(-10).map(({ role, content }) => ({ role, content }));
    const userMessage: AssistantMessage = { id: uid(), role: 'user', content: trimmed, createdAt: new Date().toISOString() };
    setThreads((all) => all.map((thread) => {
      if (thread.id !== threadId || thread.caseId !== legalCase.id) return thread;
      const firstQuestion = thread.messages.every((message) => message.role !== 'user');
      return { ...thread, title: firstQuestion ? trimmed.slice(0, 54) : thread.title, updatedAt: userMessage.createdAt, messages: [...thread.messages, userMessage] };
    }));
    let answer: AssistantReply;
    try {
      answer = await askAssistantRemote(legalCase.id, trimmed, history);
    } catch {
      answer = { reply: 'Não foi possível obter resposta do assistente. Tenta novamente.' };
    }
    const assistantMessage: AssistantMessage = { id: uid(), role: 'assistant', content: answer.reply, actions: answer.actions, sources: answer.sources, createdAt: new Date().toISOString() };
    setThreads((all) => all.map((thread) => thread.id === threadId && thread.caseId === legalCase.id ? { ...thread, updatedAt: assistantMessage.createdAt, messages: [...thread.messages, assistantMessage] } : thread));
  };
  const setActionState = (threadId: string, messageId: string, index: number, state: AssistantAction['state']) => setThreads((all) => all.map((thread) => thread.id !== threadId ? thread : { ...thread, messages: thread.messages.map((message) => message.id !== messageId ? message : { ...message, actions: message.actions?.map((action, i) => i === index ? { ...action, state } : action) }) }));
  const value = useMemo(() => ({ threads, createThread, deleteThread, sendMessage, setActionState }), [threads]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() { const value = useContext(AssistantContext); if (!value) throw new Error('useAssistant deve ser usado dentro de AssistantProvider'); return value; }
