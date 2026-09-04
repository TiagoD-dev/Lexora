import type { Client } from '@/types/client';
import type { LegalCase } from '@/types/case';

export type DocumentTemplate = { id: string; label: string; body: string };

// ponytail: 4 templates fixos com placeholders {{campo}} — sem editor/CRUD nem templates por área jurídica, adicionar aqui se surgirem mais casos.
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'peticao-inicial',
    label: 'Petição inicial',
    body: 'EXMO. SENHOR JUIZ DE DIREITO DO {{caso.tribunal}}\n\nProcesso n.º {{caso.processNumber}}\nReferência interna: {{caso.reference}}\n\n{{cliente.nome}}, na qualidade de Autor(a) no processo acima identificado, respeitosamente vem expor e requerer a V. Exa. o seguinte:\n\n{{caso.description}}\n\nNestes termos e nos demais de Direito, requer-se a V. Exa. se digne admitir a presente petição e ordenar os demais termos até final.\n\nJunta: documentos.\n\nPede deferimento.\n\n{{data}}\n\n{{advogado.nome}}',
  },
  {
    id: 'procuracao',
    label: 'Procuração',
    body: 'PROCURAÇÃO\n\n{{cliente.nome}}, constitui seu bastante procurador {{advogado.nome}}, a quem confere os mais amplos poderes forenses em direito permitidos, incluindo os de substabelecer, para o representar no processo n.º {{caso.processNumber}} (ref. {{caso.reference}}), a correr termos no(a) {{caso.tribunal}}.\n\n{{data}}\n\n_______________________________\n{{cliente.nome}}',
  },
  {
    id: 'carta-cliente',
    label: 'Carta ao cliente',
    body: 'Exmo(a). Sr(a). {{cliente.nome}},\n\nNo âmbito do processo "{{caso.title}}" (ref. {{caso.reference}}), a correr termos no(a) {{caso.tribunal}} sob o n.º {{caso.processNumber}}, vimos informar V. Exa. sobre o ponto de situação do caso.\n\nFicamos ao dispor para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\n{{advogado.nome}}\n{{data}}',
  },
  {
    id: 'contrato-honorarios',
    label: 'Contrato de honorários',
    body: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS\n\nEntre {{advogado.nome}}, e {{cliente.nome}}, é celebrado o presente contrato de prestação de serviços jurídicos, relativo ao processo "{{caso.title}}" (ref. {{caso.reference}}), nos seguintes termos:\n\n1. O(A) Advogado(a) obriga-se a prestar os serviços jurídicos necessários ao acompanhamento do processo acima identificado.\n2. Os honorários serão acordados entre as partes e faturados de acordo com os serviços prestados.\n3. O presente contrato pode ser rescindido por qualquer das partes mediante comunicação escrita.\n\n{{data}}\n\n_______________________________          _______________________________\n{{advogado.nome}}                                        {{cliente.nome}}',
  },
];

export function buildTemplateValues(legalCase: LegalCase, client: Client | undefined, lawyerName: string): Record<string, string> {
  return {
    'cliente.nome': client?.name || legalCase.client || 'Não indicado',
    'caso.reference': legalCase.reference || 'Não indicado',
    'caso.title': legalCase.title || 'Não indicado',
    'caso.processNumber': legalCase.processNumber || 'Não indicado',
    'caso.tribunal': legalCase.court || 'Não indicado',
    'caso.description': legalCase.description || '',
    'advogado.nome': lawyerName || 'Não indicado',
    data: new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
  };
}

export function fillDocumentTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([\w.]+)\}\}/g, (match, key: string) => values[key] ?? match);
}
