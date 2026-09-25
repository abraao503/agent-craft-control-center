# Documentação atual para agentes

Esta é a fonte de orientação atual do frontend. Ela privilegia regras que
podem ser verificadas no código e contratos ativos. Consulte os documentos
legados apenas para recuperar contexto; eles não substituem o código, a API ou
estes guias.

## Mapa de decisão

| Tarefa | Fonte principal | Confirme no código |
| --- | --- | --- |
| Nova página, rota, provider ou layout | [Arquitetura](arquitetura.md) | `src/App.tsx`, `src/contexts/` |
| Buscar, criar, editar ou remover dados | [Dados e API](dados-e-api.md) | `src/services/`, `src/types/`, `../api` |
| Empresa, workspace, usuário ou permissão | [Autorização e tenancy](autorizacao-e-tenancy.md) | `src/hooks/usePermissions.ts`, `src/utils/permissions.ts` |
| Preparar contas de teste para validar outros roles | [Contas de teste por role](test-accounts.md) | criação/edição de usuário e escopo de empresa/workspace |
| Formulário, componente, feedback ou Socket.IO | [UI e tempo real](ui-e-tempo-real.md) | `src/components/ui/`, `src/lib/socket.ts` |
| Follow-ups e regras históricas de domínio | [Domínios](dominios.md) | serviço e componentes do domínio |

## Fatos do projeto

- React 18, TypeScript, Vite, Tailwind e componentes shadcn/Radix.
- TanStack React Query **v5** para estado remoto; Context é reservado para
  estado global de autenticação e workspace.
- React Router v6, Axios e Socket.IO Client.
- O alias `@/` aponta para `src/`.
- A URL da API vem de `VITE_API_URL`; não assuma porta nem altere ambiente para
  compensar falhas de integração.
- As rotas são declaradas manualmente em `src/App.tsx`; não existe geração de
  rotas nem camada automática de hooks.

## Ordem de investigação

1. Verifique o estado do repositório com `git status --short`.
2. Localize implementações semelhantes com `rg` e reutilize o padrão mais
   próximo, não apenas o exemplo de uma documentação antiga.
3. Leia o contrato do service e seus tipos antes de alterar uma tela.
4. Se o contrato não existir ou estiver ambíguo, confirme em `../api`; não
   crie endpoint ou semântica paralela no frontend.
5. Faça a alteração mínima, valide e revise o diff.

## Hierarquia de fontes

1. Código e contrato atual da API.
2. Este diretório `docs/agent/` e `front/AGENTS.md`.
3. Documentos de domínio recentes, quando conferidos contra o código.
4. Arquivos legados listados em [Legado](../README.md#legado).

## Verificação documental

Ao alterar `AGENTS.md` ou os guias deste diretório, execute
`rtk npm run docs:check` na raiz do frontend. O comando verifica se os destinos
locais usados pelos links Markdown existem. Confira também o diff com
`rtk git diff --check`; lint, typecheck, build e Playwright ficam para mudanças
que alterem código.
