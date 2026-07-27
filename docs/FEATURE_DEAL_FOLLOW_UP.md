# Feature: Follow-ups de Deals

> **Legado.** O conhecimento consolidado e as regras atuais para agentes estão
> em [`docs/agent/dominios.md`](agent/dominios.md). Confirme serviços e
> contratos antes de alterar o fluxo.

## Visão Geral

Esta feature permite criar, listar e gerenciar follow-ups agendados para deals. Os follow-ups são mensagens programadas que serão enviadas via WhatsApp para os clientes em horários específicos.

## Componentes Criados

### 1. DealFollowUpListDialog
**Localização:** `src/components/deals/follow-up/DealFollowUpListDialog.tsx`

Modal que lista todos os follow-ups de um deal específico.

**Funcionalidades:**
- Lista todos os follow-ups agendados para o deal
- Exibe status de cada follow-up (Pendente, Enviado, Falhou, Cancelado)
- Mostra data/hora agendada e última tentativa
- Permite excluir follow-ups com confirmação
- Botão para criar novos follow-ups
- Paginação automática (100 itens por página)

**Props:**
```typescript
interface DealFollowUpListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
}
```

**Status dos Follow-ups:**
- `PENDING` - Aguardando envio (Badge secundário com ícone de relógio)
- `SENT` - Enviado com sucesso (Badge padrão com ícone de check)
- `FAILED` - Falhou após todas tentativas (Badge destrutivo com ícone de X)
- `CANCELLED` - Cancelado/excluído (Badge outline com ícone de X)

### 2. CreateDealFollowUpDialog
**Localização:** `src/components/deals/follow-up/CreateDealFollowUpDialog.tsx`

Modal para criar um novo follow-up agendado.

**Funcionalidades:**
- Formulário com validação (React Hook Form + Zod)
- Campo de título (obrigatório, máx 255 caracteres)
- Campo de mensagem (obrigatório, textarea)
- Seletor de data/hora (datetime-local, apenas datas futuras)
- Validação de data no futuro
- Conversão automática de timezone local para UTC
- Feedback de sucesso/erro

**Props:**
```typescript
interface CreateDealFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
}
```

**Validações:**
- Título: mínimo 1 caractere, máximo 255
- Mensagem: mínimo 1 caractere
- Data/hora: deve ser no futuro (mínimo 1 minuto a partir de agora)

## Serviços de API

### Localização
`src/services/deal/dealFollowUp.ts`

### Funções

#### createDealFollowUp
Cria um novo follow-up para um deal.

```typescript
createDealFollowUp(
  dealId: string,
  data: {
    title: string;
    message: string;
    scheduledAt: string; // ISO 8601 UTC
  }
): Promise<{ id: string }>
```

#### listDealFollowUps
Lista follow-ups de um deal com paginação.

```typescript
listDealFollowUps(
  dealId: string,
  params?: {
    page?: number;
    limit?: number;
  }
): Promise<DealFollowUpListResponse>
```

#### deleteDealFollowUp
Exclui (soft delete) um follow-up.

```typescript
deleteDealFollowUp(followUpId: string): Promise<void>
```

## Types

### Localização
`src/types/deal-follow-up.ts`

### Definições

```typescript
export type DealFollowUpStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export type DealFollowUp = {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  dealId: string;
  status: DealFollowUpStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  error: string | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateDealFollowUpParams = {
  title: string;
  message: string;
  scheduledAt: string;
};

export type DealFollowUpListResponse = {
  items: DealFollowUp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
```

## Integração com DealViewModal

### Botão de Acesso
Um botão "Follow-ups" foi adicionado no header do modal de visualização do deal (ao lado do título).

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowFollowUpListDialog(true)}
  className="gap-2"
>
  <Clock className="h-4 w-4" />
  Follow-ups
</Button>
```

### Renderização
O componente `DealFollowUpListDialog` é renderizado no final do `DealViewModal`, junto com os outros modais auxiliares.

## Fluxo de Uso

1. **Visualizar Follow-ups:**
   - Usuário abre um deal no kanban
   - Clica no botão "Follow-ups" no header
   - Modal lista todos os follow-ups do deal

2. **Criar Follow-up:**
   - No modal de listagem, clica em "Criar Follow-up"
   - Preenche título, mensagem e data/hora
   - Sistema valida que data é futura
   - Ao salvar, follow-up é agendado no backend

3. **Excluir Follow-up:**
   - Na lista, clica no ícone de lixeira
   - Confirma exclusão no dialog
   - Follow-up é cancelado (soft delete)

## Características Técnicas

### React Query
- Utiliza cache com `queryKey: ["dealFollowUps", dealId]`
- Invalidação automática após create/delete
- Loading states bem definidos
- Error handling com toast notifications

### Timezone Handling
- Input de data/hora usa timezone local do usuário
- Conversão automática para UTC no envio
- Backend armazena em UTC
- Display usa timezone local com date-fns

### UX/UI
- Loading spinners durante operações
- Feedback imediato com toasts
- Confirmação antes de excluir
- Empty states informativos
- Layout responsivo
- Badges coloridos por status

### Validação
- Zod schemas para type-safety
- React Hook Form para gerenciamento
- Validação client-side e server-side
- Mensagens de erro claras

## Tratamento de Erros

### Erros do Backend
Os seguintes erros podem ser retornados pela API:

- `400` - Data agendada no passado
- `400` - Follow-up duplicado para o mesmo horário
- `404` - Deal não encontrado
- `500` - Integração WhatsApp não configurada
- `500` - Cliente sem número de telefone

Todos são tratados com toasts informativos.

### Validações Frontend
- Data deve ser no futuro (mínimo +1 minuto)
- Campos obrigatórios
- Limites de caracteres

## Permissões

**Nota:** A feature está acessível a todos os usuários que podem visualizar o deal. Não há verificação específica de permissões para follow-ups no momento.

Para adicionar permissões no futuro, use o hook `usePermissions`:

```typescript
const { has } = usePermissions();

if (!has("create:follow-up")) {
  // Ocultar botão de criar
}
```

## Melhorias Futuras

1. **Edição de Follow-ups:** Permitir editar título, mensagem e data de follow-ups pendentes
2. **Filtros:** Filtrar por status na listagem
3. **Templates:** Salvar templates de mensagens frequentes
4. **Bulk Actions:** Criar múltiplos follow-ups de uma vez
5. **Notificações:** Notificar usuário quando follow-up é enviado
6. **Histórico:** Ver histórico de tentativas de envio
7. **Paginação:** Implementar paginação real (atualmente fixa em 100 itens)
8. **Permissões:** Adicionar controle de permissões específico
9. **Recorrência:** Permitir follow-ups recorrentes
10. **Variáveis:** Suporte a variáveis na mensagem (nome do cliente, valor do deal, etc)

## Documentação da API

Consulte o arquivo `API_FOLLOW_UP.md` na raiz do projeto para detalhes completos da API REST.

---

**Última Atualização:** Janeiro 2026  
**Versão:** 1.0
