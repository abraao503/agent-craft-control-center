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
- Não leia `.env` pelo terminal nem imprima, copie, modifique ou versione
  credenciais. A conta administrativa de teste pode ser consumida pelo fluxo de
  autenticação/runtime em testes autorizados; seus valores nunca devem aparecer
  em código, ledger, argumentos de shell, logs, screenshots, traces, vídeos ou
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

### Contrato de apresentação

- Para qualquer mudança visível, leia o contexto autorizado do ledger antes de
  codificar. A tela deve seguir as referências, o objetivo, a ação primária,
  os estados e os viewports declarados no item; não complete lacunas por
  preferência visual própria.
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

### Perfil Playwright e credenciais de teste

- O perfil de validação do ledger é `front-playwright-ui`. Ele executa
  `npm run test:e2e` em Chromium desktop e mobile e comprova
  `UI_INTERACTION`; não substitui a revisão visual do agente.
- O runner carrega, somente em runtime, `test_admin_email` e
  `test_admin_password` do `.env` da raiz compartilhada. Nunca copie esses
  valores para o ledger, código, screenshots, traces, vídeos, logs ou
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
  obter GREEN.

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
