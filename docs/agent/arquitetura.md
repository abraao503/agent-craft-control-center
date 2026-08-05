# Arquitetura, rotas e organização

## Camadas

O fluxo esperado é:

```text
Página/componente → hook ou React Query → service → cliente api → API
```

- `src/pages/`: telas e composição de rota.
- `src/components/<domínio>/`: UI e lógica de interação do domínio.
- `src/components/ui/`: primitivas reutilizáveis; reutilize-as antes de criar
  botão, dialog, input, toast ou componente visual equivalente.
- `src/services/<domínio>/`: uma operação HTTP por arquivo quando isso melhora
  coesão; `src/services/api.ts` é o cliente compartilhado.
- `src/types/`: contratos do cliente por domínio.
- `src/hooks/`: lógica reutilizável, inclusive integração de WebSocket.
- `src/contexts/auth` e `src/contexts/workspace`: estado global de sessão e
  workspace, não substitutos para cache remoto.
- `src/lib/`: infraestrutura cliente, como `socket.ts`, `utils.ts` e Highlight.

## Providers e rotas

`src/App.tsx` cria o `QueryClient` e compõe os providers de autenticação,
workspace, tema, sidebar, tooltips e router. Novas páginas precisam ser
importadas e registradas ali, respeitando o layout e a proteção de rota já
usados. Não acrescente outro `QueryClientProvider`, `BrowserRouter` ou provider
global dentro de uma página.

`src/components/auth/ProtectedRoute.tsx` é o ponto de proteção de rotas. Ao
adicionar uma rota protegida, siga uma rota semelhante no próprio `App.tsx`.
Rotas públicas (login, recuperação, termos e privacidade) não devem depender
da sessão.

## Limites de responsabilidade

- Uma página pode compor componentes e coordenar a rota, mas não deve absorver
  detalhes de HTTP repetidos ou regras reutilizáveis.
- Um componente de apresentação recebe dados e callbacks; um componente que
  executa mutation deve manter loading/erro/sucesso explícitos.
- Não transforme um arquivo grande em depósito de novos comportamentos. Ao
  tocar um hotspot, extraia uma unidade coesa somente quando a alteração o
  exigir; não faça refactor amplo incidental.
- Mantenha nomes por intenção: `CreateXDialog`, `useX`, `createX` e
  `XCard` são preferíveis a arquivos genéricos como `helpers.ts`.

## Estilo e imports

- TypeScript estrito está ativo, embora alguns checks de `any`/não usados sejam
  permissivos. Tipar entradas e respostas continua obrigatório.
- Prefira `@/` a cadeias longas de imports relativos.
- Não mude configuração de Vite, ESLint, Tailwind ou providers globais para
  atender uma única feature.
- A porta do Vite configurada é 8080; isso não define a porta da API.
