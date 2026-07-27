# Autorização, empresa e workspace

## Princípios

O produto é multi-tenant. Empresa e workspace são parte do contexto de acesso,
não meros filtros visuais. O backend é a autoridade de permissões e ownership;
o frontend usa `usePermissions()` para mostrar ações adequadas e prevenir
fluxos inviáveis.

Use `src/hooks/usePermissions.ts`, que expõe `has`, `hasAny`, `hasAll`, `role`,
`isCompanyLevel` e `isWorkspaceLevel`. As permissões vêm do perfil autenticado,
e não devem ser reconstruídas na tela a partir do nome da role.

## Roles e escopo

| Role | Escopo | Regra operacional resumida |
| --- | --- | --- |
| `PLATFORM_ADMIN` | Plataforma | Opera empresas e seus contextos. |
| `COMPANY_OWNER` | Empresa | Administra empresa e sua configuração. |
| `COMPANY_ADMIN` | Empresa | Administra a empresa sem ser owner. |
| `WORKSPACE_OWNER` | Workspace | Opera workspace já configurado. |
| `WORKSPACE_ADMIN` | Workspace | Administração técnica do workspace. |
| `WORKSPACE_MANAGER` | Workspace | Gestão da equipe comercial. |
| `SALES_REP` | Próprios deals/workspace | Operação comercial restrita. |

A hierarquia é estrita: um usuário só cria roles abaixo da sua. Roles de
empresa não recebem `workspaceId`; roles de workspace exigem `workspaceId`.
`SALES_REP` não cria usuários. Confirme permissões específicas em
`src/types/auth.ts`, `src/utils/permissions.ts` e na API antes de mudar UI de
administração.

Pipelines, campos de stage e assistentes são configurados no nível de empresa;
roles de workspace os consomem. Na integração WhatsApp, a empresa configura a
integração e o workspace conecta/desconecta a conta quando autorizado.

## Workspace atual e cache

O workspace selecionado é mantido por `WorkspaceContext`; não duplique essa
seleção em estado local. Ao criar, editar ou excluir workspaces, preserve:

- invalidação de `workspaces` e das listas/detalhes administrativos afetados;
- seleção automática do workspace recém-criado somente se ele pertence à
  empresa atual do usuário;
- atualização do nome do workspace já selecionado;
- fallback para o workspace padrão (ou primeiro disponível) se o atual deixar
  de existir;
- nenhum redirecionamento de um `PLATFORM_ADMIN` que alterou workspace de
  outra empresa;
- proteção contra exclusão do workspace padrão e aviso claro ao excluir o
  workspace atual.

Essas regras preservam o isolamento de contexto e evitam que a sidebar mostre
dados obsoletos. Ao implementar mudança de workspace, revise
`WorkspaceContext`, `Sidebar` e dialogs administrativos relacionados.

## Deals e interface

Em geral, usuários de empresa veem o escopo da empresa, usuários de workspace
veem os deals do workspace e `SALES_REP` vê/trabalha apenas em deals atribuídos.
Não use essa síntese como substituto de uma checagem de API: filtros e ações
devem respeitar o contrato atual do endpoint.
