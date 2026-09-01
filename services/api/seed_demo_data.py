"""One-off script to seed realistic demo data for the admin account.

Run manually with the project's venv: .venv/Scripts/python.exe seed_demo_data.py
Not part of the running application; safe to delete after use.
"""
from datetime import datetime, timezone

from app.db import SessionLocal
from app import models

OWNER_EMAIL = "tiago@gmail.com"


def iso(date_str: str) -> str:
    return f"{date_str}T{datetime.now(timezone.utc).strftime('%H:%M:%S')}.000Z"


def main() -> None:
    db = SessionLocal()
    owner = db.query(models.User).filter(models.User.email == OWNER_EMAIL).one_or_none()
    if owner is None:
        raise SystemExit(f"Utilizador {OWNER_EMAIL} não encontrado. Cria a conta primeiro.")

    # Limpa dados anteriores deste utilizador para permitir correr o script de novo sem duplicar.
    db.query(models.Case).filter(models.Case.ownerId == owner.id).delete()
    db.query(models.Client).filter(models.Client.ownerId == owner.id).delete()
    db.commit()

    clients = [
        dict(
            id="client-maria-santos", name="Maria Santos", type="Particular", status="Ativo",
            nif="245 118 302", email="maria.santos@gmail.com", phone="+351 912 345 678",
            address="Rua das Flores, 42, 1200-192 Lisboa",
            notes="Prefere contacto por email. Disponível para reuniões às terças e quintas de tarde.",
            createdAt=iso("2026-08-12"), updatedAt=iso("2026-08-30"),
        ),
        dict(
            id="client-joao-ferreira", name="João Ferreira", type="Particular", status="Ativo",
            nif="238 904 511", email="joao.ferreira77@sapo.pt", phone="+351 913 456 789",
            address="Avenida da Liberdade, 88, 4000-322 Porto",
            notes="Senhorio. Já teve dois processos de despejo anteriores com o mesmo inquilino.",
            createdAt=iso("2026-07-30"), updatedAt=iso("2026-08-29"),
        ),
        dict(
            id="client-nortex", name="Nortex Distribuição, Lda.", type="Empresa", status="Ativo",
            nif="509 887 234", email="geral@nortexdistribuicao.pt", phone="+351 227 654 321",
            address="Zona Industrial de Gaia, Lote 14, 4400-160 Vila Nova de Gaia",
            notes="Contacto principal: Dra. Sofia Ramalho (Diretora Jurídica). Faturação mensal.",
            createdAt=iso("2026-06-18"), updatedAt=iso("2026-08-27"),
        ),
        dict(
            id="client-ana-costa", name="Ana Costa", type="Particular", status="Inativo",
            nif="", email="ana.costa.pessoal@gmail.com", phone="",
            address="Coimbra",
            notes="Processo encerrado em 2026. Manter ficha para histórico.",
            createdAt=iso("2026-05-02"), updatedAt=iso("2026-08-10"),
        ),
        dict(
            id="client-carla-mendes", name="Carla Mendes", type="Particular", status="Ativo",
            nif="256 771 900", email="carla.mendes@outlook.com", phone="+351 916 220 114",
            address="Rua do Comércio, 15, 2.º Dt., 3000-352 Coimbra",
            notes="", createdAt=iso("2026-08-25"), updatedAt=iso("2026-08-31"),
        ),
    ]
    for payload in clients:
        db.add(models.Client(ownerId=owner.id, **payload))

    cases = [
        dict(
            id="case-cessacao-trabalho",
            reference="LEX-2026-014",
            title="Cessação do contrato de trabalho",
            client="Maria Santos", clientId="client-maria-santos",
            area="Direito do Trabalho", court="Tribunal Judicial da Comarca de Lisboa",
            processNumber="1847/26.3T8LSB", responsible="Tiago", priority="Alta",
            description="Análise da cessação do contrato de trabalho da cliente por iniciativa da entidade empregadora, com fundamento invocado de reestruturação. Necessário avaliar regularidade formal do procedimento e eventuais créditos laborais em falta.",
            status="Em análise",
            createdAt=iso("2026-08-20"), updatedAt=iso("2026-08-31"),
            notes=[
                {"id": "note-1", "text": "Cliente confirma que não assinou qualquer acordo de revogação. Recebeu apenas carta registada.", "createdAt": iso("2026-08-28")},
                {"id": "note-2", "text": "Verificar se há queixa prévia na ACT sobre a mesma empresa.", "createdAt": iso("2026-08-30")},
            ],
            tasks=[
                {"id": "task-1", "title": "Reunir recibos de vencimento", "description": "Solicitar à cliente os últimos 12 recibos de vencimento e o recibo de férias.", "dueDate": "2026-08-27", "priority": "Alta", "deadlineKind": "Interno", "recurrence": "Nenhuma", "reminderDays": [1], "completed": True, "createdAt": iso("2026-08-20")},
                {"id": "task-2", "title": "Responder à carta da entidade empregadora", "description": "Prazo legal para reação à comunicação de cessação.", "dueDate": "2026-08-29", "priority": "Urgente", "deadlineKind": "Legal", "recurrence": "Nenhuma", "reminderDays": [2, 1], "completed": False, "createdAt": iso("2026-08-20")},
                {"id": "task-3", "title": "Agendar reunião de acompanhamento mensal", "description": "Ponto de situação com a cliente.", "dueDate": "2026-09-01", "priority": "Normal", "deadlineKind": "Interno", "recurrence": "Mensal", "reminderDays": [1], "completed": False, "createdAt": iso("2026-08-20")},
                {"id": "task-4", "title": "Submeter articulado no tribunal", "description": "Preparar e entregar petição inicial se não houver acordo.", "dueDate": "2026-09-10", "priority": "Alta", "deadlineKind": "Judicial", "recurrence": "Nenhuma", "reminderDays": [3, 1], "completed": False, "createdAt": iso("2026-08-25")},
            ],
            documents=[
                {"id": "doc-1", "name": "Contrato de trabalho.pdf", "type": "PDF", "mimeType": "application/pdf", "size": 482300, "status": "Disponível", "extractionStatus": "Revisto", "extractedCharacterCount": 6210, "pageCount": 4, "reviewedAt": iso("2026-08-22"), "addedAt": iso("2026-08-20"),
                 "suggestions": [
                     {"id": "sug-1", "type": "Data", "value": "01/03/2022", "detail": "Data de início do contrato", "excerpt": "O presente contrato de trabalho produz efeitos a partir de 01/03/2022...", "accepted": True},
                     {"id": "sug-2", "type": "Facto", "value": "A denúncia deverá ser comunicada com uma antecedência mínima de 30 dias.", "detail": "Cláusula relativa ao aviso prévio", "excerpt": "Cláusula 8.ª — Cessação. A denúncia deverá ser comunicada com uma antecedência mínima de 30 dias, sob pena de indemnização compensatória.", "accepted": True},
                 ]},
                {"id": "doc-2", "name": "Carta de cessação.pdf", "type": "PDF", "mimeType": "application/pdf", "size": 128400, "status": "Disponível", "extractionStatus": "Por rever", "extractedCharacterCount": 1180, "pageCount": 1, "addedAt": iso("2026-08-27"),
                 "suggestions": [
                     {"id": "sug-3", "type": "Data", "value": "25/08/2026", "detail": "Data da carta", "excerpt": "Vimos por este meio comunicar, com efeitos a partir de 25/08/2026..."},
                     {"id": "sug-4", "type": "Entidade", "value": "Nortex Distribuição, Lda.", "detail": "Entidade empregadora", "excerpt": "A Nortex Distribuição, Lda., na qualidade de entidade empregadora..."},
                 ]},
                {"id": "doc-3", "name": "Recibos de vencimento (jan-jul 2026).xlsx", "type": "XLSX", "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "size": 94200, "status": "A processar", "extractionStatus": "A processar", "addedAt": iso("2026-08-30")},
                {"id": "doc-4", "name": "Fotografia do posto de trabalho.jpg", "type": "JPG", "mimeType": "image/jpeg", "size": 2200000, "status": "Erro", "extractionStatus": "Erro", "extractionError": "Formato de imagem ainda não suportado para extração de texto.", "addedAt": iso("2026-08-30")},
            ],
            timeline=[
                {"id": "tl-1", "title": "Caso criado", "date": iso("2026-08-20")},
                {"id": "tl-2", "title": "Documento adicionado: Contrato de trabalho.pdf", "date": iso("2026-08-20")},
                {"id": "tl-3", "title": "Documento adicionado: Carta de cessação.pdf", "date": iso("2026-08-27")},
                {"id": "tl-4", "title": "Tarefa concluída: Reunir recibos de vencimento", "date": iso("2026-08-27")},
                {"id": "tl-5", "title": "Facto confirmado a partir de documento", "date": iso("2026-08-28")},
            ],
            entities=[
                {"id": "ent-1", "name": "Maria Santos", "role": "Trabalhadora", "type": "Pessoa"},
                {"id": "ent-2", "name": "Nortex Distribuição, Lda.", "role": "Entidade empregadora", "type": "Empresa"},
                {"id": "ent-3", "name": "Autoridade para as Condições do Trabalho", "role": "Entidade fiscalizadora", "type": "Entidade pública"},
            ],
            facts=[
                {"id": "fact-1", "statement": "O contrato de trabalho produziu efeitos a partir de 01/03/2022.", "status": "Confirmado", "source": "Documento", "sourceDocumentId": "doc-1", "sourceDocumentName": "Contrato de trabalho.pdf", "sourceExcerpt": "O presente contrato de trabalho produz efeitos a partir de 01/03/2022.", "sourceLocation": "Página 1 · Cláusula 1.ª", "reviewedAt": iso("2026-08-22"), "createdAt": iso("2026-08-22")},
                {"id": "fact-2", "statement": "A entidade empregadora comunicou a cessação com efeitos a partir de 25/08/2026.", "status": "Confirmado", "source": "Documento", "sourceDocumentId": "doc-2", "sourceDocumentName": "Carta de cessação.pdf", "sourceExcerpt": "Vimos por este meio comunicar, com efeitos a partir de 25/08/2026.", "sourceLocation": "Página 1", "reviewedAt": iso("2026-08-28"), "relevantDate": "2026-08-25", "createdAt": iso("2026-08-28")},
                {"id": "fact-3", "statement": "A cliente não assinou qualquer acordo de revogação do contrato.", "status": "Confirmado", "source": "Utilizador", "createdAt": iso("2026-08-28")},
                {"id": "fact-4", "statement": "A cessação poderá configurar um despedimento sem justa causa.", "status": "Por confirmar", "source": "Lexora", "createdAt": iso("2026-08-29")},
                {"id": "fact-5", "statement": "A empresa alega reestruturação interna como motivo da cessação.", "status": "Contestado", "source": "Utilizador", "createdAt": iso("2026-08-29")},
            ],
            legalIssues=[
                {"id": "issue-1", "title": "Regularidade formal da comunicação de cessação", "description": "Verificar se foram cumpridos os prazos e formalidades exigidos por lei.", "status": "Em análise"},
                {"id": "issue-2", "title": "Eventual direito a indemnização por despedimento ilícito", "status": "Identificada"},
                {"id": "issue-3", "title": "Cálculo de créditos laborais em dívida (férias, subsídios)", "status": "Respondida"},
            ],
            missingFacts=[
                {"id": "missing-1", "question": "A cliente recebeu alguma proposta de acordo antes da carta de cessação?", "impact": "Pode indicar negociação prévia relevante para a estratégia.", "resolved": False},
                {"id": "missing-2", "question": "Existem testemunhas da comunicação verbal inicial?", "resolved": True},
            ],
        ),
        dict(
            id="case-despejo-arrendamento",
            reference="LEX-2026-015",
            title="Despejo por falta de pagamento de renda",
            client="João Ferreira", clientId="client-joao-ferreira",
            area="Direito do Arrendamento", court="Julgado de Paz do Porto",
            processNumber="", responsible="Tiago", priority="Urgente",
            description="Cliente (senhorio) pretende iniciar procedimento de despejo por falta de pagamento de renda há 4 meses consecutivos.",
            status="Em análise",
            createdAt=iso("2026-08-05"), updatedAt=iso("2026-08-30"),
            notes=[
                {"id": "note-3", "text": "Cliente já enviou duas interpelações por carta registada sem resposta do inquilino.", "createdAt": iso("2026-08-10")},
            ],
            tasks=[
                {"id": "task-5", "title": "Confirmar valores em dívida junto do cliente", "dueDate": "2026-08-24", "priority": "Alta", "deadlineKind": "Interno", "recurrence": "Nenhuma", "reminderDays": [], "completed": True, "createdAt": iso("2026-08-05")},
                {"id": "task-6", "title": "Preparar requerimento de despejo", "description": "Procedimento especial de despejo, com base no NRAU.", "dueDate": "2026-09-04", "priority": "Urgente", "deadlineKind": "Judicial", "recurrence": "Nenhuma", "reminderDays": [2, 1], "completed": False, "createdAt": iso("2026-08-20")},
            ],
            documents=[
                {"id": "doc-5", "name": "Contrato de arrendamento.pdf", "type": "PDF", "mimeType": "application/pdf", "size": 356000, "status": "Disponível", "extractionStatus": "Revisto", "pageCount": 5, "reviewedAt": iso("2026-08-08"), "addedAt": iso("2026-08-05"),
                 "suggestions": [{"id": "sug-5", "type": "Data", "value": "01/06/2023", "detail": "Início do arrendamento", "accepted": True}]},
                {"id": "doc-6", "name": "Comprovativos de renda em atraso.pdf", "type": "PDF", "status": "Disponível", "extractionStatus": "Por extrair", "addedAt": iso("2026-08-29")},
            ],
            timeline=[
                {"id": "tl-6", "title": "Caso criado", "date": iso("2026-08-05")},
                {"id": "tl-7", "title": "Documento adicionado: Contrato de arrendamento.pdf", "date": iso("2026-08-05")},
                {"id": "tl-8", "title": "Tarefa concluída: Confirmar valores em dívida junto do cliente", "date": iso("2026-08-24")},
            ],
            entities=[
                {"id": "ent-4", "name": "João Ferreira", "role": "Senhorio", "type": "Pessoa"},
                {"id": "ent-5", "name": "Rui Almeida", "role": "Arrendatário", "type": "Pessoa"},
            ],
            facts=[
                {"id": "fact-6", "statement": "O arrendatário não paga renda há 4 meses consecutivos.", "status": "Confirmado", "source": "Utilizador", "createdAt": iso("2026-08-05")},
                {"id": "fact-7", "statement": "Foram enviadas duas interpelações por carta registada sem resposta.", "status": "Confirmado", "source": "Utilizador", "createdAt": iso("2026-08-10")},
            ],
            legalIssues=[
                {"id": "issue-4", "title": "Fundamento para resolução do contrato por incumprimento", "status": "Respondida"},
            ],
            missingFacts=[
                {"id": "missing-3", "question": "O arrendatário reside sozinho no imóvel ou existem outros ocupantes?", "impact": "Relevante para a diligência de desocupação.", "resolved": False},
            ],
        ),
        dict(
            id="case-due-diligence-nortex",
            reference="LEX-2026-016",
            title="Due diligence de aquisição de quotas",
            client="Nortex Distribuição, Lda.", clientId="client-nortex",
            area="Direito Comercial e Societário", court="Sem tribunal atribuído",
            processNumber="", responsible="Tiago", priority="Normal",
            description="Apoio jurídico na due diligence prévia à aquisição de quotas de uma sociedade concorrente, com foco em passivos contingentes e contratos em vigor.",
            status="Em análise",
            createdAt=iso("2026-08-01"), updatedAt=iso("2026-08-29"),
            notes=[
                {"id": "note-4", "text": "Reunião com a Dra. Sofia Ramalho marcada para rever a lista de contratos relevantes.", "createdAt": iso("2026-08-18")},
            ],
            tasks=[
                {"id": "task-7", "title": "Rever contratos com fornecedores-chave", "dueDate": "2026-09-08", "priority": "Normal", "deadlineKind": "Interno", "recurrence": "Nenhuma", "reminderDays": [2], "completed": False, "createdAt": iso("2026-08-15")},
                {"id": "task-8", "title": "Emitir parecer preliminar de riscos", "dueDate": "2026-09-15", "priority": "Alta", "deadlineKind": "Interno", "recurrence": "Nenhuma", "reminderDays": [3], "completed": False, "createdAt": iso("2026-08-20")},
            ],
            documents=[
                {"id": "doc-7", "name": "Pacto social.pdf", "type": "PDF", "status": "Disponível", "extractionStatus": "Revisto", "pageCount": 12, "reviewedAt": iso("2026-08-10"), "addedAt": iso("2026-08-02")},
                {"id": "doc-8", "name": "Mapa de contratos em vigor.xlsx", "type": "XLSX", "status": "Disponível", "extractionStatus": "Por rever", "addedAt": iso("2026-08-20")},
            ],
            timeline=[
                {"id": "tl-9", "title": "Caso criado", "date": iso("2026-08-01")},
                {"id": "tl-10", "title": "Documento adicionado: Pacto social.pdf", "date": iso("2026-08-02")},
            ],
            entities=[
                {"id": "ent-6", "name": "Nortex Distribuição, Lda.", "role": "Cliente", "type": "Empresa"},
                {"id": "ent-7", "name": "Sofia Ramalho", "role": "Diretora Jurídica (contacto)", "type": "Pessoa"},
                {"id": "ent-8", "name": "Distrilog Comércio, Lda.", "role": "Sociedade-alvo", "type": "Empresa"},
            ],
            facts=[
                {"id": "fact-8", "statement": "A sociedade-alvo tem 3 contratos de fornecimento com cláusula de exclusividade.", "status": "Confirmado", "source": "Documento", "sourceDocumentName": "Mapa de contratos em vigor.xlsx", "createdAt": iso("2026-08-21")},
            ],
            legalIssues=[
                {"id": "issue-5", "title": "Existência de passivos contingentes não divulgados", "status": "Identificada"},
            ],
            missingFacts=[
                {"id": "missing-4", "question": "Há processos judiciais pendentes contra a sociedade-alvo?", "impact": "Fundamental para o parecer de riscos.", "resolved": False},
            ],
        ),
        dict(
            id="case-divorcio-mutuo",
            reference="LEX-2026-009",
            title="Divórcio por mútuo consentimento",
            client="Carla Mendes", clientId="client-carla-mendes",
            area="Direito da Família e Menores", court="Conservatória do Registo Civil de Coimbra",
            processNumber="482/26", responsible="Tiago", priority="Baixa",
            description="Acompanhamento do processo de divórcio por mútuo consentimento, incluindo acordo sobre responsabilidades parentais de um filho menor.",
            status="Concluído",
            createdAt=iso("2026-06-02"), updatedAt=iso("2026-08-15"),
            notes=[],
            tasks=[
                {"id": "task-9", "title": "Entregar acordo de regulação das responsabilidades parentais", "dueDate": "2026-07-20", "priority": "Normal", "deadlineKind": "Administrativo", "recurrence": "Nenhuma", "reminderDays": [], "completed": True, "createdAt": iso("2026-06-10")},
            ],
            documents=[
                {"id": "doc-9", "name": "Acordo de regulação das responsabilidades parentais.pdf", "type": "PDF", "status": "Disponível", "extractionStatus": "Revisto", "pageCount": 3, "reviewedAt": iso("2026-07-18"), "addedAt": iso("2026-07-15")},
            ],
            timeline=[
                {"id": "tl-11", "title": "Caso criado", "date": iso("2026-06-02")},
                {"id": "tl-12", "title": "Caso concluído", "date": iso("2026-08-15")},
            ],
            entities=[
                {"id": "ent-9", "name": "Carla Mendes", "role": "Requerente", "type": "Pessoa"},
            ],
            facts=[
                {"id": "fact-9", "statement": "Ambos os cônjuges estão de acordo quanto à partilha de bens.", "status": "Confirmado", "source": "Utilizador", "createdAt": iso("2026-06-05")},
            ],
            legalIssues=[],
            missingFacts=[],
        ),
        dict(
            id="case-atraso-voo",
            reference="LEX-2026-017",
            title="Reclamação por atraso de voo",
            client="Ana Costa", clientId="client-ana-costa",
            area="Direito do Consumo", court="Sem tribunal atribuído",
            processNumber="", responsible="Tiago", priority="Baixa",
            description="Pedido de esclarecimento sobre direito a compensação por atraso de voo superior a 3 horas.",
            status="Rascunho",
            createdAt=iso("2026-08-31"), updatedAt=iso("2026-08-31"),
            notes=[], tasks=[], documents=[],
            timeline=[{"id": "tl-13", "title": "Rascunho criado", "date": iso("2026-08-31")}],
            entities=[{"id": "ent-10", "name": "Ana Costa", "role": "Passageira", "type": "Pessoa"}],
            facts=[], legalIssues=[], missingFacts=[],
        ),
        dict(
            id="case-insolvencia-fornecedor",
            reference="LEX-2026-003",
            title="Reclamação de créditos em processo de insolvência",
            client="Nortex Distribuição, Lda.", clientId="client-nortex",
            area="Direito da Insolvência e Recuperação", court="Tribunal Judicial da Comarca de Aveiro",
            processNumber="655/25.8T8AVR", responsible="Tiago", priority="Normal",
            description="Reclamação dos créditos da Nortex num processo de insolvência de um antigo fornecedor.",
            status="Arquivado",
            createdAt=iso("2026-03-10"), updatedAt=iso("2026-07-01"),
            notes=[],
            tasks=[],
            documents=[
                {"id": "doc-10", "name": "Reclamação de créditos.pdf", "type": "PDF", "status": "Disponível", "extractionStatus": "Revisto", "pageCount": 6, "reviewedAt": iso("2026-03-20"), "addedAt": iso("2026-03-15")},
            ],
            timeline=[
                {"id": "tl-14", "title": "Caso criado", "date": iso("2026-03-10")},
                {"id": "tl-15", "title": "Dados do caso atualizados", "date": iso("2026-07-01")},
            ],
            entities=[{"id": "ent-11", "name": "Nortex Distribuição, Lda.", "role": "Credora", "type": "Empresa"}],
            facts=[{"id": "fact-10", "statement": "O crédito reclamado foi integralmente reconhecido pelo administrador de insolvência.", "status": "Confirmado", "source": "Documento", "sourceDocumentName": "Reclamação de créditos.pdf", "createdAt": iso("2026-04-02")}],
            legalIssues=[],
            missingFacts=[],
        ),
    ]
    for payload in cases:
        db.add(models.Case(ownerId=owner.id, **payload))

    db.commit()
    db.close()
    print(f"Seeded {len(clients)} clients and {len(cases)} cases for {OWNER_EMAIL}.")


if __name__ == "__main__":
    main()
