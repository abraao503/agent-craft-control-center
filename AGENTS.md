# Frontend — instruções para agentes

Este diretório é o painel React do produto. Ele é um repositório independente
de `../api`; não compartilhe dependências, lockfiles ou comandos entre os dois.

## Leitura dirigida

Antes de alterar código, leia `docs/agent/README.md` e somente os guias
indicados para o escopo. Os demais arquivos Markdown em `docs/` são legado:
podem conter contexto histórico útil, mas não são norma de implementação sem
confirmação no código ou no contrato atual da API.

| Se a mudança envolve | Leia também |
| --- | --- |
| Estrutura, rota ou provider | `docs/agent/arquitetura.md` |
| Endpoint, type, cache ou mutation | `docs/agent/dados-e-api.md` |
| Role, workspace, empresa ou usuário | `docs/agent/autorizacao-e-tenancy.md` |
| Formulário, UI, toast, socket ou acessibilidade | `docs/agent/ui-e-tempo-real.md` |
| Follow-up ou comportamento de domínio documentado | `docs/agent/dominios.md` |

## Regras obrigatórias

- Preserve mudanças preexistentes e mantenha o escopo pequeno. Antes de
  começar, rode `git status --short` neste diretório.
- Use **npm**. Não use Bun nem regenere `package-lock.json` ou `bun.lockb` sem
  solicitação explícita. Ambos existem no repositório; o lockfile não é um
  efeito colateral aceitável de uma mudança de código.
- Não leia, imprima, modifique ou versione `.env` e credenciais. `VITE_*` é
  configuração pública de build, mas os valores locais não devem aparecer em
  código, logs ou documentação.
- Não invente endpoint, payload ou tipo que a API já define. Confirme o
  contrato em `../api` (e em Swagger quando o ambiente estiver disponível)
  antes de implementar uma integração.
- Não altere `src/services/api.ts` para resolver uma necessidade isolada de
  tela: ele é o cliente HTTP global, com autenticação e tratamento de `401`.
- Não esconda uma ação somente no frontend para considerá-la autorizada. A API
  é a autoridade; a UI usa permissões para não oferecer ações indisponíveis.
- Não introduza bibliotecas, mudanças globais de estilo ou refactors amplos sem
  necessidade explícita.

## Arquitetura e convenções

- Páginas e rotas vivem em `src/pages/` e são registradas em `src/App.tsx`.
- Componentes de domínio vivem em `src/components/<domínio>/`; prefira os
  componentes existentes em `src/components/ui/` antes de criar equivalentes.
- Chamadas HTTP vivem em `src/services/<domínio>/`; componentes não chamam
  Axios diretamente.
- Tipos de contrato do cliente vivem em `src/types/`. Derive tipos quando
  possível e não duplique contratos sem necessidade.
- Use `@/` para imports a partir de `src/`.
- Dados remotos usam TanStack React Query v5. Escolha query keys estáveis,
  inclua IDs e filtros que mudam o resultado e invalide as chaves afetadas
  após mutations.
- Para paginação que deve manter a lista anterior, use
  `placeholderData: (previousData) => previousData`; não use a opção removida
  `keepPreviousData`.
- Para formulários, siga o padrão local de React Hook Form + Zod e mostre
  estados de carregamento, erro e sucesso.
- Use `usePermissions()` para decisões visuais e preserve o isolamento de
  empresa/workspace. Mudanças no workspace atual exigem revisão de cache e
  fallback para o workspace padrão.

## Verificação e entrega

Execute a verificação proporcional, a partir de `front/`:

```bash
npm run lint
npm run typecheck
npm run build
```

Use `npm run typecheck`, e não `tsc --noEmit` diretamente: o `tsconfig.json`
raiz usa *project references*, e a checagem correta é executada com `tsc -b`.

Não há script de testes automatizados configurado. Quando uma mudança for de
interface, valide manualmente o fluxo relevante quando o ambiente estiver
disponível. Ao concluir, informe arquivos alterados, comandos executados e
qualquer contrato/integração que não pôde ser validado localmente.
