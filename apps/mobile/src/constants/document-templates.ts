import type { Client } from '@/types/client';
import type { LegalCase } from '@/types/case';
import type { AuthUser } from '@/services/auth-service';

export type DocumentTemplate = { id: string; label: string; body: string };

const ADVOGADO = '{{advogado.nome}}\nAdvogado(a), cédula profissional n.º {{advogado.cedula}}\n{{advogado.escritorio}} · {{advogado.email}} · {{advogado.telefone}}';

// ponytail: modelos fixos com placeholders {{campo}} — sem editor/CRUD nem templates por área jurídica, adicionar aqui se surgirem mais casos.
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'peticao-inicial',
    label: 'Petição inicial',
    body: `EXMO. SENHOR JUIZ DE DIREITO DO {{caso.tribunal}}\n\nProcesso n.º {{caso.processNumber}}\nReferência interna: {{caso.reference}}\n\n{{cliente.nome}}, contribuinte n.º {{cliente.nif}}, residente em {{cliente.morada}}, vem, contra {{parteContraria.nome}}, propor a presente ação, nos termos e com os fundamentos seguintes:\n\n{{caso.description}}\n\nNestes termos e nos demais de Direito, requer-se a V. Exa. se digne admitir a presente petição e ordenar os demais termos até final.\n\nJunta: documentos e procuração forense.\n\nPede deferimento.\n\n{{data}}\n\n${ADVOGADO}`,
  },
  {
    id: 'procuracao',
    label: 'Procuração',
    body: 'PROCURAÇÃO\n\n{{cliente.nome}}, contribuinte n.º {{cliente.nif}}, com morada em {{cliente.morada}}, constitui seu bastante procurador {{advogado.nome}}, advogado(a), portador(a) da cédula profissional n.º {{advogado.cedula}}, com escritório em {{advogado.escritorio}}, a quem confere os mais amplos poderes forenses em direito permitidos, incluindo os de substabelecer, para o representar no processo n.º {{caso.processNumber}} (ref. {{caso.reference}}), a correr termos no(a) {{caso.tribunal}}.\n\n{{data}}\n\n_______________________________\n{{cliente.nome}}',
  },
  {
    id: 'substabelecimento',
    label: 'Substabelecimento',
    body: `SUBSTABELECIMENTO\n\n{{advogado.nome}}, advogado(a), cédula profissional n.º {{advogado.cedula}}, mandatário(a) de {{cliente.nome}} no processo n.º {{caso.processNumber}}, a correr termos no(a) {{caso.tribunal}}, substabelece, com reserva, em [nome do(a) advogado(a) substabelecido(a)], cédula profissional n.º [cédula], os poderes que lhe foram conferidos pela procuração junta aos autos.\n\n{{data}}\n\n${ADVOGADO}`,
  },
  {
    id: 'requerimento-juntada',
    label: 'Requerimento — junção de documentos',
    body: `EXMO. SENHOR JUIZ DE DIREITO DO {{caso.tribunal}}\n\nProcesso n.º {{caso.processNumber}}\n\n{{cliente.nome}}, parte nos autos acima identificados em que é contraparte {{parteContraria.nome}}, vem requerer a V. Exa. a junção aos autos dos documentos que se anexam, por se mostrarem relevantes para a boa decisão da causa, nos termos do artigo 423.º do Código de Processo Civil.\n\nJunta: [n.º] documentos.\n\nPede deferimento.\n\n{{data}}\n\n${ADVOGADO}`,
  },
  {
    id: 'requerimento-prorrogacao',
    label: 'Requerimento — prorrogação de prazo',
    body: `EXMO. SENHOR JUIZ DE DIREITO DO {{caso.tribunal}}\n\nProcesso n.º {{caso.processNumber}}\n\n{{cliente.nome}}, Réu nos autos acima identificados em que é Autor {{parteContraria.nome}}, vem requerer a V. Exa. a prorrogação do prazo para apresentar a contestação por [n.º, até 30] dias, com fundamento em [motivo ponderoso], nos termos do artigo 569.º do Código de Processo Civil.\n\nPede deferimento.\n\n{{data}}\n\n${ADVOGADO}`,
  },
  {
    id: 'carta-interpelacao',
    label: 'Carta de interpelação',
    body: `Exmo(a). Sr(a). {{parteContraria.nome}}\n\nRegisto com aviso de receção\n\nAssunto: Interpelação — {{caso.title}}\n\nNa qualidade de mandatário(a) de {{cliente.nome}}, contribuinte n.º {{cliente.nif}}, venho, por este meio, interpelar V. Exa. para, no prazo de [n.º] dias a contar da receção desta carta, [cumprir a obrigação / pagar o montante de € …], relativamente a:\n\n{{caso.description}}\n\nDecorrido o prazo indicado sem que se mostre regularizada a situação, o(a) meu/minha constituinte recorrerá aos meios judiciais adequados, sem mais aviso, com os inerentes custos acrescidos.\n\nCom os melhores cumprimentos,\n\n{{data}}\n\n${ADVOGADO}`,
  },
  {
    id: 'carta-cliente',
    label: 'Carta ao cliente',
    body: 'Exmo(a). Sr(a). {{cliente.nome}}\n{{cliente.morada}}\n\nNo âmbito do processo "{{caso.title}}" (ref. {{caso.reference}}), a correr termos no(a) {{caso.tribunal}} sob o n.º {{caso.processNumber}}, vimos informar V. Exa. sobre o ponto de situação do caso.\n\nFicamos ao dispor para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\n{{advogado.nome}}\n{{data}}',
  },
  {
    id: 'contrato-honorarios',
    label: 'Contrato de honorários',
    body: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS\n\nEntre {{advogado.nome}}, advogado(a), cédula profissional n.º {{advogado.cedula}}, com escritório em {{advogado.escritorio}}, e {{cliente.nome}}, contribuinte n.º {{cliente.nif}}, com morada em {{cliente.morada}}, é celebrado o presente contrato de prestação de serviços jurídicos, relativo ao processo "{{caso.title}}" (ref. {{caso.reference}}), nos seguintes termos:\n\n1. O(A) Advogado(a) obriga-se a prestar os serviços jurídicos necessários ao acompanhamento do processo acima identificado.\n2. Os honorários serão acordados entre as partes e faturados de acordo com os serviços prestados.\n3. O presente contrato pode ser rescindido por qualquer das partes mediante comunicação escrita.\n\n{{data}}\n\n_______________________________          _______________________________\n{{advogado.nome}}                                        {{cliente.nome}}',
  },
];

// ponytail: a parte contrária é a primeira entidade do caso cujo papel soa a contraparte — sem campo dedicado no caso.
const OPPOSING_ROLE = /contr[aá]ri|contraparte|\br[ée]u?s?\b|requerid|demandad|executad/i;

type Lawyer = Pick<AuthUser, 'displayName' | 'barNumber' | 'organization' | 'email' | 'phone'>;

export function buildTemplateValues(legalCase: LegalCase, client: Client | undefined, lawyer: Lawyer | null | undefined): Record<string, string> {
  return {
    'cliente.nome': client?.name || legalCase.client,
    'cliente.nif': client?.nif ?? '',
    'cliente.morada': client?.address ?? '',
    'cliente.email': client?.email ?? '',
    'parteContraria.nome': legalCase.entities.find((entity) => OPPOSING_ROLE.test(entity.role))?.name ?? '',
    'caso.reference': legalCase.reference,
    'caso.title': legalCase.title,
    'caso.area': legalCase.area,
    'caso.processNumber': legalCase.processNumber,
    'caso.tribunal': legalCase.court,
    'caso.description': legalCase.description,
    'advogado.nome': lawyer?.displayName ?? '',
    'advogado.cedula': lawyer?.barNumber ?? '',
    'advogado.escritorio': lawyer?.organization ?? '',
    'advogado.email': lawyer?.email ?? '',
    'advogado.telefone': lawyer?.phone ?? '',
    data: new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
  };
}

/** Campos sem valor ficam visíveis como «[campo em falta]» para não sair um documento com buracos silenciosos. */
export function fillDocumentTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([\w.]+)\}\}/g, (_match, key: string) => values[key]?.trim() || `[${key} em falta]`);
}

export const missingTemplateFields = (filled: string) => [...new Set(filled.match(/\[[\w.]+ em falta\]/g) ?? [])].map((field) => field.slice(1, -10));
