import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { addCollaboratorRemote, createCaseRemote, deleteCaseRemote, listCasesRemote, removeCollaboratorRemote, updateCaseRemote } from '@/services/cases-service';
import type { CaseDocument, CaseEntity, CaseFact, CaseNote, CaseStatus, CaseTask, DeadlineKind, FactStatus, LegalCase, LegalIssue, MissingFact, RecurrenceRule, TaskPriority } from '@/types/case';
import { nextOccurrence } from '@/utils/deadlines';
import { cancelTaskReminders, scheduleTaskReminders } from '@/utils/task-notifications';

type CaseDraft = Pick<LegalCase, 'title' | 'client' | 'clientId' | 'area' | 'court' | 'processNumber' | 'responsible' | 'priority' | 'description' | 'status'>;
type CasesContextValue = {
  cases: LegalCase[]; hydrated: boolean; syncStatus: 'saving' | 'saved' | 'error'; syncError: string | null; retrySync: () => void; getCase: (id: string) => LegalCase | undefined;
  createCase: (draft: CaseDraft, opposingParty?: string) => string; updateCase: (id: string, patch: Partial<CaseDraft>) => void;
  archiveCase: (id: string) => void; deleteCase: (id: string) => void;
  syncClientName: (clientId: string, name: string) => void;
  addNote: (id: string, text: string) => void; addTask: (id: string, task: { title: string; description?: string; dueDate?: string; priority?: TaskPriority; deadlineKind?: DeadlineKind; recurrence?: RecurrenceRule; reminderDays?: number[] }) => void;
  updateTask: (caseId: string, taskId: string, patch: Partial<Pick<CaseTask, 'title' | 'description' | 'dueDate' | 'priority' | 'reminderDays'>>) => void; deleteTask: (caseId: string, taskId: string) => void;
  toggleTask: (caseId: string, taskId: string) => void; addDocument: (id: string, document: Omit<CaseDocument, 'id' | 'addedAt' | 'status'>) => void;
  updateDocument: (caseId: string, documentId: string, patch: Partial<Omit<CaseDocument, 'id' | 'addedAt'>>) => void;
  deleteDocument: (caseId: string, documentId: string) => void;
  addFact: (id: string, statement: string, source?: Partial<Pick<CaseFact, 'source' | 'sourceDocumentId' | 'sourceDocumentName' | 'sourceSuggestionId' | 'sourceExcerpt' | 'sourceLocation' | 'reviewedAt' | 'relevantDate'>>) => void; updateFactStatus: (caseId: string, factId: string, status: FactStatus) => void;
  addEntity: (id: string, name: string, role: string) => void; addLegalIssue: (id: string, title: string) => void;
  addMissingFact: (id: string, question: string) => void; toggleMissingFact: (caseId: string, missingFactId: string) => void;
  addCollaborator: (caseId: string, email: string) => Promise<void>; removeCollaborator: (caseId: string, email: string) => Promise<void>;
};
const CasesContext = createContext<CasesContextValue | null>(null);
const STORAGE_KEY = '@lexora/cases-cache/v2';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const trunc = (text: string, max = 60) => (text.length > max ? `${text.slice(0, max)}…` : text);
const safeDate = (value: unknown, fallback: string) =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime()) ? value : fallback;

function normalizeCase(item: Partial<LegalCase>): LegalCase {
  const now = new Date().toISOString();
  const migratedArea = ({ Arrendamento: 'Direito do Arrendamento', 'Direito da Família': 'Direito da Família e Menores' } as Record<string, string>)[item.area ?? ''] ?? item.area ?? 'Outra';
  return {
    id: item.id ?? uid(),
    reference: item.reference ?? `LEX-${new Date().getFullYear()}-${String(item.id ?? Date.now()).slice(-6).toUpperCase()}`,
    title: item.title ?? 'Caso sem título',
    client: item.client ?? 'Cliente não indicado',
    clientId: item.clientId,
    area: migratedArea,
    court: item.court ?? 'Sem tribunal atribuído',
    processNumber: item.processNumber ?? '',
    responsible: item.responsible ?? 'Por atribuir',
    priority: item.priority ?? 'Normal',
    description: item.description ?? 'Sem descrição disponível.',
    status: item.status ?? 'Rascunho',
    createdAt: safeDate(item.createdAt, now),
    updatedAt: safeDate(item.updatedAt, now),
    notes: Array.isArray(item.notes) ? item.notes : [],
    tasks: Array.isArray(item.tasks) ? item.tasks.map((task) => ({ ...task, priority: task.priority ?? 'Normal', deadlineKind: task.deadlineKind ?? 'Interno', recurrence: task.recurrence ?? 'Nenhuma', reminderDays: task.reminderDays ?? [], createdAt: task.createdAt ?? now })) : [],
    documents: Array.isArray(item.documents) ? item.documents.map((document) => ({ ...document, status: document.status ?? 'Disponível', extractionStatus: document.extractionStatus ?? 'Por extrair', suggestions: document.suggestions ?? [] })) : [],
    timeline: Array.isArray(item.timeline) ? item.timeline : [],
    entities: Array.isArray(item.entities) ? item.entities : [],
    facts: Array.isArray(item.facts) ? item.facts.map((fact) => ({ ...fact, source: fact.source ?? 'Utilizador', status: fact.status ?? 'Por confirmar' })) : [],
    legalIssues: Array.isArray(item.legalIssues) ? item.legalIssues : [],
    missingFacts: Array.isArray(item.missingFacts) ? item.missingFacts : [],
    collaboratorEmails: Array.isArray(item.collaboratorEmails) ? item.collaboratorEmails : [],
  };
}

export function CasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const activeUser = useRef(user?.id);
  useLayoutEffect(() => { activeUser.current = user?.id; }, [user?.id]);
  const { items: cases, setItems: setCases, hydrated, syncStatus, syncError, retrySync, enqueue } = useSyncedCollection<LegalCase>({
    userId: user?.id ?? null, storageKey: STORAGE_KEY, loadRemote: listCasesRemote, normalize: normalizeCase,
    createRemote: createCaseRemote, updateRemote: updateCaseRemote, deleteRemote: deleteCaseRemote,
  });

  // Envia ao servidor apenas os campos que a mutação alterou de facto (por identidade de referência),
  // nunca o caso inteiro — assim uma cópia local desatualizada nunca apaga campos que não tocou.
  const syncCase = (before: LegalCase, after: LegalCase) => {
    const patch: Record<string, unknown> = {};
    (Object.keys(after) as (keyof LegalCase)[]).forEach((key) => {
      if (key === 'id' || after[key] === before[key]) return;
      patch[key] = after[key];
    });
    if (Object.keys(patch).length === 0) return;
    enqueue({ kind: 'update', id: after.id, patch });
  };
  const mutate = (id: string, recipe: (item: LegalCase) => LegalCase) => {
    let change: { before: LegalCase; after: LegalCase } | undefined;
    setCases((all) => all.map((item) => {
      if (item.id !== id) return item;
      const next = recipe(item);
      change = { before: item, after: next };
      return next;
    }));
    if (change) syncCase(change.before, change.after);
  };
  const touch = (item: LegalCase) => ({ ...item, updatedAt: new Date().toISOString() });
  const createCase = (draft: CaseDraft, opposingParty?: string) => {
    const id = uid(); const now = new Date().toISOString();
    const sequence = String(cases.length + 1).padStart(3, '0');
    const item: LegalCase = { id, reference: `LEX-${new Date().getFullYear()}-${sequence}`, ...draft, createdAt: now, updatedAt: now, notes: [], tasks: [], documents: [], timeline: [{ id: uid(), title: 'Caso criado', date: now }], entities: [{ id: uid(), name: draft.client, role: 'Cliente', type: 'Pessoa' }, ...(opposingParty ? [{ id: uid(), name: opposingParty, role: 'Parte contrária', type: 'Pessoa' as const }] : [])], facts: [], legalIssues: [], missingFacts: [], collaboratorEmails: [] };
    setCases((all) => [item, ...all]);
    enqueue({ kind: 'create', item });
    return id;
  };
  const updateCase = (id: string, patch: Partial<CaseDraft>) => mutate(id, (item) => touch({ ...item, ...patch, timeline: [{ id: uid(), title: 'Dados do caso atualizados', date: new Date().toISOString() }, ...item.timeline] }));
  const archiveCase = (id: string) => updateCase(id, { status: 'Arquivado' as CaseStatus });
  const deleteCase = (id: string) => { setCases((all) => all.filter((item) => item.id !== id)); enqueue({ kind: 'delete', id }); };
  const syncClientName = (clientId: string, name: string) => {
    const changes: { before: LegalCase; after: LegalCase }[] = [];
    setCases((all) => all.map((item) => {
      if (item.clientId !== clientId) return item;
      const next = touch({ ...item, client: name, entities: item.entities.map((entity) => entity.role === 'Cliente' ? { ...entity, name } : entity) });
      changes.push({ before: item, after: next });
      return next;
    }));
    changes.forEach(({ before, after }) => syncCase(before, after));
  };
  const addNote = (id: string, text: string) => mutate(id, (item) => touch({ ...item, notes: [{ id: uid(), text, createdAt: new Date().toISOString() } as CaseNote, ...item.notes], timeline: [{ id: uid(), title: `Nota adicionada: ${trunc(text)}`, date: new Date().toISOString() }, ...item.timeline] }));
  const addTask = (id: string, task: { title: string; description?: string; dueDate?: string; priority?: TaskPriority; deadlineKind?: DeadlineKind; recurrence?: RecurrenceRule; reminderDays?: number[] }) => {
    let created: CaseTask | undefined;
    mutate(id, (item) => {
      created = { id: uid(), ...task, priority: task.priority ?? 'Normal', deadlineKind: task.deadlineKind ?? 'Interno', recurrence: task.recurrence ?? 'Nenhuma', reminderDays: task.reminderDays ?? [], completed: false, createdAt: new Date().toISOString() };
      return touch({ ...item, tasks: [created!, ...item.tasks], timeline: [{ id: uid(), title: `Tarefa criada: ${task.title}`, date: new Date().toISOString() }, ...item.timeline] });
    });
    const caseTitle = cases.find((entry) => entry.id === id)?.title ?? '';
    if (created) scheduleTaskReminders(created, caseTitle).catch(() => undefined);
  };
  const updateTask = (caseId: string, taskId: string, patch: Partial<Pick<CaseTask, 'title' | 'description' | 'dueDate' | 'priority' | 'reminderDays'>>) => {
    let updated: CaseTask | undefined;
    mutate(caseId, (item) => touch({ ...item, tasks: item.tasks.map((task) => {
      if (task.id !== taskId) return task;
      updated = { ...task, ...patch };
      return updated;
    }) }));
    const caseTitle = cases.find((entry) => entry.id === caseId)?.title ?? '';
    if (updated) scheduleTaskReminders(updated, caseTitle).catch(() => undefined);
  };
  const deleteTask = (caseId: string, taskId: string) => { cancelTaskReminders(taskId).catch(() => undefined); mutate(caseId, (item) => { const task = item.tasks.find((entry) => entry.id === taskId); return touch({ ...item, tasks: item.tasks.filter((entry) => entry.id !== taskId), timeline: [{ id: uid(), title: `Tarefa eliminada: ${task?.title ?? 'tarefa'}`, date: new Date().toISOString() }, ...item.timeline] }); }); };
  const toggleTask = (caseId: string, taskId: string) => {
    let toggled: CaseTask | undefined;
    mutate(caseId, (item) => {
      const current = item.tasks.find((task) => task.id === taskId);
      if (!current) return item;
      const completing = !current.completed;
      const nextDate = completing && current.dueDate ? nextOccurrence(current.dueDate, current.recurrence) : undefined;
      const alreadyCreated = item.tasks.some((task) => task.recurrenceSourceId === current.id && task.dueDate === nextDate);
      const recurringTask: CaseTask[] = nextDate && !alreadyCreated ? [{ ...current, id: uid(), dueDate: nextDate, completed: false, createdAt: new Date().toISOString(), recurrenceSourceId: current.id }] : [];
      if (recurringTask.length) scheduleTaskReminders(recurringTask[0], item.title).catch(() => undefined);
      toggled = { ...current, completed: completing };
      const toggleEntry = { id: uid(), title: `${completing ? 'Tarefa concluída' : 'Tarefa reaberta'}: ${current.title}`, date: new Date().toISOString() };
      const recurEntry = recurringTask.length ? [{ id: uid(), title: `Próxima ocorrência criada: ${current.title}`, date: new Date().toISOString() }] : [];
      return touch({ ...item, tasks: [...recurringTask, ...item.tasks.map((task) => task.id === taskId ? toggled! : task)], timeline: [...recurEntry, toggleEntry, ...item.timeline] });
    });
    if (!toggled) return;
    // Tarefa concluída: sem lembretes por vir. Tarefa reaberta: reagenda a partir da data existente.
    if (toggled.completed) cancelTaskReminders(taskId).catch(() => undefined);
    else scheduleTaskReminders(toggled, cases.find((entry) => entry.id === caseId)?.title ?? '').catch(() => undefined);
  };
  const addDocument = (id: string, document: Omit<CaseDocument, 'id' | 'addedAt' | 'status'>) => mutate(id, (item) => touch({ ...item, documents: [{ id: uid(), ...document, status: 'Disponível', extractionStatus: document.extractionStatus ?? 'Por extrair', suggestions: document.suggestions ?? [], addedAt: new Date().toISOString() }, ...item.documents], timeline: [{ id: uid(), title: `Documento adicionado: ${document.name}`, date: new Date().toISOString() }, ...item.timeline] }));
  const updateDocument = (caseId: string, documentId: string, patch: Partial<Omit<CaseDocument, 'id' | 'addedAt'>>) => mutate(caseId, (item) => touch({ ...item, documents: item.documents.map((document) => document.id === documentId ? { ...document, ...patch } : document) }));
  const deleteDocument = (caseId: string, documentId: string) => mutate(caseId, (item) => { const document = item.documents.find((entry) => entry.id === documentId); return touch({ ...item, documents: item.documents.filter((entry) => entry.id !== documentId), timeline: [{ id: uid(), title: `Documento eliminado: ${document?.name ?? 'ficheiro'}`, date: new Date().toISOString() }, ...item.timeline] }); });
  const addFact = (id: string, statement: string, source: Partial<Pick<CaseFact, 'source' | 'sourceDocumentId' | 'sourceDocumentName' | 'sourceSuggestionId' | 'sourceExcerpt' | 'sourceLocation' | 'reviewedAt' | 'relevantDate'>> = {}) => mutate(id, (item) => touch({ ...item, facts: [{ id: uid(), statement, status: 'Por confirmar', source: source.source ?? 'Utilizador', createdAt: new Date().toISOString(), ...source } as CaseFact, ...item.facts], timeline: [{ id: uid(), title: `Facto registado: ${trunc(statement)}`, date: new Date().toISOString() }, ...item.timeline] }));
  const updateFactStatus = (caseId: string, factId: string, status: FactStatus) => mutate(caseId, (item) => {
    const fact = item.facts.find((entry) => entry.id === factId);
    if (!fact || fact.status === status) return item;
    return touch({ ...item, facts: item.facts.map((entry) => entry.id === factId ? { ...entry, status } : entry), timeline: [{ id: uid(), title: `Facto ${status}: ${trunc(fact.statement)}`, date: new Date().toISOString() }, ...item.timeline] });
  });
  const addEntity = (id: string, name: string, role: string) => mutate(id, (item) => touch({ ...item, entities: [...item.entities, { id: uid(), name, role, type: 'Pessoa' } as CaseEntity], timeline: [{ id: uid(), title: `Entidade adicionada: ${name} (${role})`, date: new Date().toISOString() }, ...item.timeline] }));
  const addLegalIssue = (id: string, title: string) => mutate(id, (item) => touch({ ...item, legalIssues: [...item.legalIssues, { id: uid(), title, status: 'Identificada' } as LegalIssue], timeline: [{ id: uid(), title: `Questão jurídica: ${title}`, date: new Date().toISOString() }, ...item.timeline] }));
  const addMissingFact = (id: string, question: string) => mutate(id, (item) => touch({ ...item, missingFacts: [...item.missingFacts, { id: uid(), question, resolved: false } as MissingFact], timeline: [{ id: uid(), title: `Pergunta registada: ${question}`, date: new Date().toISOString() }, ...item.timeline] }));
  const toggleMissingFact = (caseId: string, missingFactId: string) => mutate(caseId, (item) => {
    const fact = item.missingFacts.find((entry) => entry.id === missingFactId);
    if (!fact) return item;
    const resolved = !fact.resolved;
    return touch({ ...item, missingFacts: item.missingFacts.map((entry) => entry.id === missingFactId ? { ...entry, resolved } : entry), timeline: resolved ? [{ id: uid(), title: `Pergunta resolvida: ${fact.question}`, date: new Date().toISOString() }, ...item.timeline] : item.timeline });
  });
  const addCollaborator = async (caseId: string, email: string) => {
    const owner = user?.id; const updated = await addCollaboratorRemote(caseId, email); if (owner !== activeUser.current) return;
    setCases((all) => all.map((item) => item.id === caseId ? { ...item, collaboratorEmails: updated.collaboratorEmails } : item));
  };
  const removeCollaborator = async (caseId: string, email: string) => {
    const owner = user?.id; const updated = await removeCollaboratorRemote(caseId, email); if (owner !== activeUser.current) return;
    setCases((all) => all.map((item) => item.id === caseId ? { ...item, collaboratorEmails: updated.collaboratorEmails } : item));
  };
  const value = { cases, hydrated, syncStatus, syncError, retrySync, getCase: (id: string) => cases.find((item) => item.id === id), createCase, updateCase, archiveCase, deleteCase, syncClientName, addNote, addTask, updateTask, deleteTask, toggleTask, addDocument, updateDocument, deleteDocument, addFact, updateFactStatus, addEntity, addLegalIssue, addMissingFact, toggleMissingFact, addCollaborator, removeCollaborator };
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const value = useContext(CasesContext);
  if (!value) throw new Error('useCases deve ser usado dentro de CasesProvider');
  return value;
}
