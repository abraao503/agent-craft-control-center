# UI, formulários e tempo real

## Componentes e acessibilidade

Reutilize `src/components/ui/` e os padrões do domínio antes de criar uma nova
primitiva. Preserve semântica de botões, labels associadas a inputs, foco em
dialogs, navegação por teclado, contraste e estados desabilitados. Uma tela
nova precisa funcionar em loading, erro, vazio e dados completos; o layout
deve continuar utilizável em viewport estreita.

Para feedback, siga o padrão já usado na área alterada (`toast` ou Sonner). Não
duplique feedback de sucesso, nem esconda falha de mutation atrás de um
fechamento silencioso do dialog.

## Formulários

Use React Hook Form e Zod para regras locais. O schema valida formato e UX; a
API continua responsável por regras de negócio, permissão e integridade.

- Mostre erro próximo ao campo e bloqueie submissão duplicada.
- Normalize datas, telefone e payloads no ponto adequado antes do service.
- Datas agendadas são enviadas em ISO/UTC quando o contrato exigir; mostre ao
  usuário no fuso local.
- Não implemente validação de role/ownership somente no navegador.

## Socket.IO

`src/lib/socket.ts` centraliza uma única conexão. `connectSocket(token)`
normaliza o Bearer token, configura reconexão e retorna o socket atual;
`disconnectSocket()` deve ser chamado no ciclo de vida apropriado. Não crie
conexões por render, nem inclua token em logs.

Para eventos que alteram dados remotos, prefira hooks em `src/hooks/` e
invalide/atualize a query key correspondente. Garanta remoção de listeners no
cleanup de `useEffect`, para evitar eventos duplicados ao navegar.

## Observabilidade

Highlight é inicializado condicionalmente por `VITE_HIGHLIGHT_ENABLED` e o
cliente HTTP já registra eventos quando habilitado. Não envie dados pessoais,
token, corpo sensível ou segredo adicional para tracking. Não altere a
configuração de observabilidade global para uma correção local.
