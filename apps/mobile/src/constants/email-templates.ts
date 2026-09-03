export type EmailTemplate = { id: string; label: string; subject: string; body: string };

// ponytail: 4 templates fixos com placeholders — sem CRUD/admin, editar aqui se surgirem mais casos.
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'documents',
    label: 'Pedido de documentos',
    subject: 'Pedido de documentos — Caso {caseReference}',
    body: 'Exmo(a). {clientName},\n\nPara darmos seguimento ao caso "{caseTitle}" (ref. {caseReference}), agradecemos o envio dos documentos em falta com a maior brevidade possível.\n\nCom os melhores cumprimentos,\n{lawyerName}',
  },
  {
    id: 'status-update',
    label: 'Atualização de estado',
    subject: 'Atualização do caso {caseReference}',
    body: 'Exmo(a). {clientName},\n\nInformamos que o caso "{caseTitle}" (ref. {caseReference}) teve uma atualização recente. Ficamos disponíveis para esclarecer quaisquer dúvidas.\n\nCom os melhores cumprimentos,\n{lawyerName}',
  },
  {
    id: 'scheduling',
    label: 'Agendamento de reunião',
    subject: 'Agendamento de reunião — Caso {caseReference}',
    body: 'Exmo(a). {clientName},\n\nGostaríamos de agendar uma reunião para discutir o caso "{caseTitle}" (ref. {caseReference}). Poderá indicar a sua disponibilidade nos próximos dias?\n\nCom os melhores cumprimentos,\n{lawyerName}',
  },
  {
    id: 'generic',
    label: 'Mensagem geral',
    subject: 'Caso {caseReference}',
    body: 'Exmo(a). {clientName},\n\n\n\nCom os melhores cumprimentos,\n{lawyerName}',
  },
];

export function fillEmailTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
