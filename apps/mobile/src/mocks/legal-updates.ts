export type LegalUpdate = { id: string; source: string; sourceKind: 'Portugal' | 'União Europeia' | 'Jurisprudência'; title: string; summary: string; publishedAt: string; url: string; official: boolean; areas: string[] };

// Snapshot demonstrativo obtido de portais oficiais. A futura API substituirá esta lista por sincronização automática.
export const legalUpdates: LegalUpdate[] = [
  { id: 'dr-2026-08-31', source: 'Diário da República', sourceKind: 'Portugal', title: 'Atos publicados no Diário da República n.º 168/2026', summary: 'Consulta dos atos da 1.ª e 2.ª séries publicados em 31 de agosto de 2026.', publishedAt: '2026-08-31', url: 'https://diariodarepublica.pt/dr/home', official: true, areas: ['Legislação nacional'] },
  { id: 'eurlex-oj', source: 'EUR-Lex', sourceKind: 'União Europeia', title: 'Jornal Oficial da União Europeia', summary: 'Acesso às edições recentes e aos atos jurídicos oficiais da União Europeia aplicáveis em Portugal.', publishedAt: '2026-08-31', url: 'https://eur-lex.europa.eu/oj/direct-access.html?locale=pt', official: true, areas: ['Direito Europeu'] },
  { id: 'tc-acordaos', source: 'Tribunal Constitucional', sourceKind: 'Jurisprudência', title: 'Acórdãos do Tribunal Constitucional', summary: 'Consulta das decisões publicadas pelo Tribunal Constitucional português.', publishedAt: '2026-08-31', url: 'https://www.tribunalconstitucional.pt/tc/acordaos/', official: true, areas: ['Direito Constitucional'] },
  { id: 'dgsi', source: 'IGFEJ / DGSI', sourceKind: 'Jurisprudência', title: 'Bases jurídico-documentais', summary: 'Pesquisa de jurisprudência dos tribunais superiores e demais bases jurídico-documentais nacionais.', publishedAt: '2026-08-31', url: 'https://www.dgsi.pt/', official: true, areas: ['Jurisprudência'] },
];
