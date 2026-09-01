# Registo de alterações

## 2026-09-01

### Aplicação mobile

- Evolução do ecrã inicial e da navegação principal.
- Criação e atualização das áreas de faturação, planos, fontes, assistente e perfil.
- Adição de edição de perfil e preferências persistidas da aplicação.
- Melhoria dos fluxos e formulários de clientes, processos e tarefas.
- Atualização das listas e cartões de clientes, processos, tarefas e documentos.
- Introdução de componentes reutilizáveis para pré-visualização de módulos e conteúdos de planos.
- Adição de utilitários para saudações, cores e prioridades.

### API e dados de desenvolvimento

- Atualização do provider de processos para suportar os fluxos recentes da aplicação.
- Expansão dos dados de demonstração usados no desenvolvimento local.

### Estado do registo

- Foi inicializado um repositório Git local porque a workspace não continha histórico Git.
- O snapshot inicial foi registado no commit `e995d09`.

### Qualidade e segurança

- A extração de documentos passou a exigir uma sessão autenticada.
- A aplicação mobile passou a enviar o token de autenticação nos pedidos de extração.
- A API recusa arrancar em produção quando é usado o segredo JWT de desenvolvimento.
- Foram adicionados testes para autenticação, isolamento de dados, persistência de tarefas e documentos e extração de texto.
- Foram removidas dependências Expo incompatíveis e não utilizadas.
- As restantes dependências foram alinhadas com o Expo SDK 57, eliminando os alertas altos da auditoria npm.
