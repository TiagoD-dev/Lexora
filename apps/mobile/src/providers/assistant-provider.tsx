import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { LegalCase } from '@/types/case';

export type AssistantMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
export type AssistantThread = { id: string; caseId: string; title: string; createdAt: string; updatedAt: string; messages: AssistantMessage[] };
type AssistantContextValue = { threads: AssistantThread[]; createThread: (caseId: string) => string; deleteThread: (id: string) => void; sendMessage: (threadId: string, prompt: string, legalCase: LegalCase) => void };
const AssistantContext = createContext<AssistantContextValue | null>(null);
const STORAGE_KEY = '@lexora/assistant-threads/v1';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function contextualReply(prompt: string, item: LegalCase) {
  const confirmed = item.facts.filter((fact) => fact.status === 'Confirmado');
  const excludedFacts = item.facts.filter((fact) => fact.status !== 'Confirmado');
  const reviewedDocuments = item.documents.filter((doc) => doc.extractionStatus === 'Revisto');
  const missing = item.missingFacts.filter((fact) => !fact.resolved);
  const lower = prompt.toLocaleLowerCase('pt-PT');
  const lines = [`Estou a trabalhar apenas no contexto de ${item.reference} — ${item.title}.`];
  if (lower.includes('fact') || lower.includes('resum') || lower.includes('context')) {
    lines.push(confirmed.length ? `Factos confirmados: ${confirmed.map((fact) => `${fact.statement}${fact.sourceDocumentName ? ` [Fonte: ${fact.sourceDocumentName}${fact.sourceLocation ? `, ${fact.sourceLocation}` : ''}]` : ''}`).join('; ')}.` : 'Não existem factos confirmados neste Caso.');
    if (excludedFacts.length) lines.push(`${excludedFacts.length} facto(s) por confirmar ou contestado(s) foram excluídos desta resposta.`);
  } else if (lower.includes('document')) {
    lines.push(reviewedDocuments.length ? `Documentos revistos disponíveis: ${reviewedDocuments.map((doc) => doc.name).join(', ')}.` : 'Ainda não existem documentos revistos disponíveis no contexto.');
    const withText = reviewedDocuments.filter((doc) => doc.extractedText);
    if (withText.length) lines.push(`Conteúdo revisto disponível no contexto: ${withText.map((doc) => `${doc.name}: ${doc.extractedText!.replace(/\s+/g, ' ').slice(0, 500)}`).join('\n')}`);
  } else if (lower.includes('entidad') || lower.includes('pessoa')) {
    lines.push(item.entities.length ? `Entidades: ${item.entities.map((entity) => `${entity.name} — ${entity.role}`).join('; ')}.` : 'Ainda não existem entidades estruturadas.');
  } else if (lower.includes('quest') || lower.includes('risco') || lower.includes('falta')) {
    lines.push(item.legalIssues.length ? `Questões jurídicas identificadas: ${item.legalIssues.map((issue) => issue.title).join('; ')}.` : 'Ainda não existem questões jurídicas identificadas.');
    lines.push(missing.length ? `Informação por esclarecer: ${missing.map((fact) => fact.question).join('; ')}.` : 'Não há informação marcada como pendente.');
  } else {
    lines.push(`Contexto confirmado disponível: ${confirmed.length} factos, ${item.entities.length} entidades, ${reviewedDocuments.length} documentos revistos e ${item.legalIssues.length} questões jurídicas.`);
    lines.push('Posso organizar os factos, listar entidades, rever os documentos registados ou identificar informação em falta.');
  }
  lines.push('Esta resposta organiza os dados do Caso; não substitui a validação das fontes nem a análise de um profissional habilitado.');
  return lines.join('\n\n');
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) { const stored: unknown = JSON.parse(raw); if (Array.isArray(stored)) setThreads(stored); } }).catch(() => undefined).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(threads)).catch(() => undefined); }, [hydrated, threads]);
  const createThread = (caseId: string) => { const id = uid(); const now = new Date().toISOString(); setThreads((all) => [{ id, caseId, title: 'Nova conversa', createdAt: now, updatedAt: now, messages: [] }, ...all]); return id; };
  const deleteThread = (id: string) => setThreads((all) => all.filter((thread) => thread.id !== id));
  const sendMessage = (threadId: string, prompt: string, legalCase: LegalCase) => setThreads((all) => all.map((thread) => {
    if (thread.id !== threadId || thread.caseId !== legalCase.id) return thread;
    const now = new Date().toISOString(); const firstQuestion = thread.messages.every((message) => message.role !== 'user');
    return { ...thread, title: firstQuestion ? prompt.trim().slice(0, 54) : thread.title, updatedAt: now, messages: [...thread.messages, { id: uid(), role: 'user', content: prompt.trim(), createdAt: now }, { id: uid(), role: 'assistant', content: contextualReply(prompt, legalCase), createdAt: new Date().toISOString() }] };
  }));
  const value = useMemo(() => ({ threads, createThread, deleteThread, sendMessage }), [threads]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() { const value = useContext(AssistantContext); if (!value) throw new Error('useAssistant deve ser usado dentro de AssistantProvider'); return value; }
