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

- Não inicie o Flow para documentação, formatação, investigação somente leitura
  ou uma alteração local, reversível e diretamente verificável em um único
  arquivo. Faça essas tarefas diretamente e execute a validação proporcional.
- Use o Flow quando a mudança atravessar componentes e services, alterar
  contrato com a API, autenticação, tenancy, estado assíncrono, múltiplos
  repositórios ou exigir validação pelo Flow. O Flow deve planejar fatias pequenas
  e verificáveis; não transforme uma tarefa visual trivial em burocracia.
- Preserve mudanças preexistentes e mantenha o escopo pequeno. Antes de
  começar, rode `rtk git status --short` neste diretório.
- Use **npm**. Não use Bun nem regenere `package-lock.json` ou `bun.lockb` sem
  solicitação explícita. Ambos existem no repositório; o lockfile não é um
  efeito colateral aceitável de uma mudança de código.
- Não leia `.env` pelo terminal nem imprima, copie, modifique ou versione
  credenciais. A conta administrativa de teste pode ser consumida pelo fluxo de
  autenticação/runtime em testes autorizados; seus valores nunca devem aparecer
  em código, Flow, argumentos de shell, logs, screenshots, traces, vídeos ou
  documentação. `VITE_*` é configuração pública de build, mas os valores locais
  também não devem aparecer nesses registros.
- Não invente endpoint, payload ou tipo que a API já define. Confirme o
  contrato em `../api` (e em Swagger quando o ambiente estiver disponível)
  antes de implementar uma integração.
- Não altere `src/services/api.ts` para resolver uma necessidade isolada de
  tela: ele é o cliente HTTP global, com autenticação e tratamento de `401`.
- Não esconda uma ação somente no frontend para considerá-la autorizada. A API
  é a autoridade; a UI usa permissões para não oferecer ações indisponíveis.
- Não introduza bibliotecas, mudanças globais de estilo ou refactors amplos sem
  necessidade explícita.

### Execução com Flow

Ao definir critérios ou relatar resultados, siga
[Critérios de planos e evidências](../AGENTS.md#critérios-de-planos-e-evidências).
Para testar o próprio fluxo, leia
[Experimentos do Flow](../flow/AGENTS.md#experimentos-do-flow).

Siga o protocolo de validação do [`AGENTS.md` do workspace](../AGENTS.md).
Em plano operacional novo, siga o
[contrato obrigatório](../AGENTS.md#contrato-dos-planos-novos): declare
`reviewProtocolVersion: 3` e `reviewRetryPolicy` v1, com duas retentativas e
backoffs `[2, 5]`, e confira ambos no resultado da criação e no pedido do ciclo.
Protocolo inferido sem política não é o padrão para novas entregas.
Use `plan approve <plan-id> --prepare-review-cycle`
e apresente o pedido de consentimento gerado pelo Flow no início do plano,
antes de `run`/`next` e da implementação. Não espere a etapa de validação.
Somente após consentimento explícito registre `review cycle-authorize`.
Com ciclo `ACTIVE` confirmado por `review cycle-status`, use `review run`
sem pedir autorização novamente para pedidos cobertos pelo `cycleHash`.
Legados ou `UNAVAILABLE` mantêm o modo por execução indicado pelo Flow.

Em contrato novo com `reviewRetryPolicy`, uma falha transitória allowlisted e
com término confirmado pode manter `RUNNING`/`REVIEWING`; acompanhe
`reviewProgress` e use `flow retry <plan-id> [--authorize <hash>]` quando o Flow
indicar ação manual. Não chame provider diretamente, não crie executor e não
troque destino. Segurança, estado incerto, finalização, `BLOCKED` e falhas
determinísticas/desconhecidas continuam exigindo recuperação explícita.

Para impedimento local de ambiente/acesso, siga
[Continuação por etapa](../flow/docs/continuation.md): o plano aguarda em
`RUNNING`, preservando consentimentos externos independentes. Resolva correções
reversíveis já autorizadas e use `retry <plano>`; checks não têm retry automático.
Negativa explícita exige direção humana antes de registrar o hash local. O agente
obtém os identificadores do CLI e confirma etapas legadas com evidências; apresenta
ao usuário somente a operação e a decisão necessárias. Ciclos suspensos continuam
suspensos. As exigências de recuperação acima referem-se à revisão externa.

Implemente a fatia retornada na sessão atual e conclua com `finish`, que roda
checks e prepara a validação. O agente apenas solicita a validação ao Flow:
não escolhe validador/modelo, não chama provider diretamente e não monta
prompt paralelo. O destino e os limites do pedido continuam sendo apresentados
ao usuário no consentimento inicial; o agente nunca concede consentimento a si próprio.

Use o plano e o pedido gerado pelo Flow, sem documentos adicionais obrigatórios
ou um executor Codex filho. Mantenha configuração e estado no workspace do
Flow; a partir de `front/`, informe `--workspace ..` ao CLI. Os checks locais
e a verificação visual abaixo continuam necessários conforme o escopo.

### Contrato de apresentação

- Quando a mudança passar pelo Flow, leia o plano e a fatia autorizada antes de
  codificar. Siga objetivo, ação primária, estados e viewports declarados; não
  complete lacunas por preferência visual própria.
- Quando a mudança for direta, não crie plano artificial: implemente somente o
  escopo solicitado e finalize com verificação proporcional (`DIFF`,
  `COMMAND` ou `MANUAL`).
- Trate a resposta da API como contrato de transporte, não como modelo de
  apresentação. Crie uma transformação/view model quando necessário e mostre
  nomes, rótulos e estados compreensíveis para o usuário.
- Não renderize diretamente UUIDs, IDs internos, enums, códigos de provider,
  payloads brutos, mensagens de exceção ou outros diagnósticos. Se a tela
  precisa de uma referência técnica para uma ação, mantenha-a no estado ou no
  service e mostre uma representação amigável; se o nome não existir, ajuste
  o contrato ou registre a lacuna em vez de expor o identificador.
- Procure primeiro a tela e o componente equivalente mais próximo. Reutilize
  primitives, tokens, espaçamentos, hierarquia, padrões de feedback e copy do
  domínio; não crie uma linguagem visual paralela para uma única feature.
- Implemente e verifique loading, erro, vazio, sucesso/dados parciais,
  acessibilidade básica e viewport estreita quando a tela for afetada. A
  validação visual deve exercitar a jornada do item, não apenas compilar o
  componente.

### Validação visual e credenciais de teste

- Quando Playwright estiver no escopo, declare `rtk npm run test:e2e` como check
  do plano Flow ou execute-o diretamente quando a tarefa não passar pelo Flow.
  O teste cobre Chromium desktop e mobile, mas não substitui a revisão visual
  do agente.
- O runner carrega, somente em runtime, `test_admin_email` e
  `test_admin_password` do `.env` da raiz compartilhada. Nunca copie esses
  valores para o Flow, código, screenshots, traces, vídeos, logs ou
  mensagens de erro.
- Para uma validação manual que exige outro role, o responsável autorizou usar
  essa conta no tenant de teste para criar um usuário dedicado ou definir uma
  senha temporária para um usuário de teste especificamente identificado. Siga
  [Contas de teste por role](docs/agent/test-accounts.md); essa autorização não
  cobre produção, usuários reais/desconhecidos nem a senha da conta admin
  compartilhada.
- O smoke test usa o admin apenas para autenticação. Se uma jornada exigir
  outro role, crie ou edite uma fixture identificável dentro do próprio teste,
  preserve o estado original quando aplicável e remova/reverta a fixture no
  teardown. Não deixe usuários persistentes como efeito colateral do smoke test.
- A API local e o ambiente público da aplicação precisam estar acessíveis para
  o teste. `ECONNREFUSED`, credencial rejeitada ou fixture ausente são falhas
  de validação; não desabilite o teste nem substitua a API por mocks para
  considerar a validação aprovada.

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

Para alterações somente documentais em `AGENTS.md` ou `docs/agent/`, execute
`rtk npm run docs:check` e `rtk git diff --check`, a partir de `front/`. Esse
check valida que os destinos locais dos links existem. Não rode lint,
typecheck, build ou Playwright quando nenhum código foi alterado.

Para mudanças de código, execute a verificação proporcional, a partir de
`front/`:

```bash
rtk npm run lint:modified -- src/caminho/arquivo.tsx
rtk npm run typecheck
rtk npm run build
```

O script `lint:modified` recebe explicitamente os arquivos alterados e evita
que erros preexistentes em outras áreas bloqueiem a tarefa. No workspace que
usa o Flow, prefira `rtk node ../flow/dist/src/main.js check modified --repo
front --workspace ..`, que descobre os arquivos rastreados e não rastreados automaticamente.
Use `rtk npm run lint` somente quando houver mudança em configuração global do
ESLint/parser, dependências ou quando a validação completa for solicitada.

Use `rtk npm run typecheck`, e não `tsc --noEmit` diretamente: o `tsconfig.json`
raiz usa *project references*, e a checagem correta é executada com `tsc -b`.

O projeto tem Playwright em `rtk npm run test:e2e`; use o fluxo visual relevante
quando o ambiente local estiver disponível, conforme o check definido para a
tarefa. Essa suíte requer a aplicação e a API acessíveis e não é
necessária para alterações somente documentais. Ao concluir, informe arquivos
alterados, comandos executados e qualquer contrato/integração que não pôde ser
validado localmente.
