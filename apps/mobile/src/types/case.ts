export type CaseStatus = 'Rascunho' | 'Em análise' | 'Concluído' | 'Arquivado';
export type CasePriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
export type FactStatus = 'Por confirmar' | 'Confirmado' | 'Contestado';
export type FactSource = 'Utilizador' | 'Documento' | 'Lexora';

export type CaseEntity = {
  id: string;
  name: string;
  role: string;
  type: 'Pessoa' | 'Empresa' | 'Entidade pública' | 'Outra';
};

export type CaseFact = {
  id: string;
  statement: string;
  status: FactStatus;
  source: FactSource;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  sourceSuggestionId?: string;
  sourceExcerpt?: string;
  sourceLocation?: string;
  reviewedAt?: string;
  relevantDate?: string;
  createdAt: string;
};

export type LegalIssue = {
  id: string;
  title: string;
  description?: string;
  status: 'Identificada' | 'Em análise' | 'Respondida';
};

export type MissingFact = {
  id: string;
  question: string;
  impact?: string;
  resolved: boolean;
};

export type CaseNote = { id: string; text: string; createdAt: string };
export type TaskPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
export type DeadlineKind = 'Judicial' | 'Legal' | 'Administrativo' | 'Interno';
export type RecurrenceRule = 'Nenhuma' | 'Diária' | 'Semanal' | 'Mensal' | 'Anual';
export type CaseTask = {
  id: string; title: string; description?: string; dueDate?: string; priority: TaskPriority;
  deadlineKind: DeadlineKind; recurrence: RecurrenceRule; reminderDays: number[];
  completed: boolean; createdAt: string; recurrenceSourceId?: string;
};
export type CaseDocument = {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  size?: number;
  fileId?: string;
  status: 'Disponível' | 'A processar' | 'Erro';
  extractionStatus?: 'Por extrair' | 'A processar' | 'Por rever' | 'Revisto' | 'Erro';
  extractedText?: string;
  extractedCharacterCount?: number;
  pageCount?: number;
  extractionError?: string;
  suggestions?: DocumentSuggestion[];
  reviewedAt?: string;
  addedAt: string;
};
export type DocumentSuggestion = {
  id: string;
  type: 'Facto' | 'Entidade' | 'Data' | 'Questão jurídica';
  value: string;
  detail?: string;
  excerpt?: string;
  characterStart?: number;
  characterEnd?: number;
  accepted?: boolean;
};
export type TimelineEvent = { id: string; title: string; description?: string; date: string };

export type LegalCase = {
  id: string;
  reference: string;
  title: string;
  client: string;
  clientId?: string;
  area: string;
  court: string;
  processNumber: string;
  responsible: string;
  priority: CasePriority;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  notes: CaseNote[];
  tasks: CaseTask[];
  documents: CaseDocument[];
  timeline: TimelineEvent[];
  entities: CaseEntity[];
  facts: CaseFact[];
  legalIssues: LegalIssue[];
  missingFacts: MissingFact[];
  collaboratorEmails: string[];
};
