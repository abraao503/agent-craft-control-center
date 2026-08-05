# Regras de Criação de Workspace

> **Legado.** A orientação atual está em
> [`docs/agent/autorizacao-e-tenancy.md`](agent/autorizacao-e-tenancy.md).
> Confirme permissões, cache e comportamento da sidebar no código atual.

## Visão Geral

Este documento descreve as regras e permissões para criação de workspaces no sistema.

## Permissões por Role

### 1. PLATFORM_ADMIN
- ✅ **Pode criar workspace para qualquer empresa**
- Seleciona a empresa ao criar o workspace
- Acessa a funcionalidade via `/admin/companies`

### 2. COMPANY_OWNER
- ✅ **Pode criar workspace apenas para sua própria empresa**
- O workspace é criado automaticamente na empresa do usuário
- Acessa a funcionalidade via `/company/settings` ou `/company/details/:id`

### 3. COMPANY_ADMIN
- ✅ **Pode criar workspace apenas para sua própria empresa**
- O workspace é criado automaticamente na empresa do usuário
- Acessa a funcionalidade via `/company/settings` ou `/company/details/:id`

### 4. Outros Roles (WORKSPACE_OWNER, WORKSPACE_ADMIN, WORKSPACE_MANAGER, SALES_REP)
- ❌ **Não podem criar workspaces**
- Não têm acesso ao botão ou funcionalidade de criação

## Componente: CreateWorkspaceDialog

### Props

```typescript
interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string; // Opcional - para PLATFORM_ADMIN selecionar empresa
  companies?: Array<{ id: string; name: string }>; // Para PLATFORM_ADMIN
}
```

### Comportamento

#### PLATFORM_ADMIN
- Vê um campo de seleção de empresa
- Deve selecionar a empresa antes de criar o workspace
- Lista de empresas é carregada via prop `companies`

#### COMPANY_OWNER/ADMIN
- Não vê seleção de empresa
- O workspace é criado automaticamente na empresa do usuário (`user.companyId`)
- O `companyId` é passado via prop ou obtido do contexto do usuário

### Validações

1. **Nome obrigatório**: Campo nome não pode estar vazio
2. **Empresa obrigatória** (PLATFORM_ADMIN): Deve selecionar uma empresa
3. **Permissão**: Verifica se o usuário tem `create:workspace`

## Integração nas Páginas

### AdminCompaniesPage (PLATFORM_ADMIN)
- Botão "Novo Workspace" no header
- Passa lista de empresas para o dialog
- Permite criar workspace em qualquer empresa

### CompanyDetailsPage (PLATFORM_ADMIN visualizando empresa)
- Botão "Novo Workspace" na aba de workspaces
- Cria workspace na empresa visualizada
- Passa `companyId` da empresa sendo visualizada

### CompanySettingsPage (COMPANY_OWNER/ADMIN)
- Botão "Novo Workspace" na aba de workspaces
- Cria workspace na própria empresa
- Usa `user.companyId` do contexto de autenticação

## Fluxo de Criação

```mermaid
graph TD
    A[Usuário clica "Novo Workspace"] --> B{Qual role?}
    B -->|PLATFORM_ADMIN| C[Mostra seleção de empresa]
    B -->|COMPANY_OWNER/ADMIN| D[Usa companyId do usuário]
    B -->|Outros roles| E[Acesso negado]
    
    C --> F[Preenche nome]
    D --> F
    
    F --> G[Valida campos]
    G --> H{Válido?}
    H -->|Sim| I[Envia POST /workspace]
    H -->|Não| J[Mostra erro]
    
    I --> K{Sucesso?}
    K -->|Sim| L[Invalida cache]
    K -->|Não| M[Mostra erro]
    
    L --> N[Fecha dialog]
    L --> O[Atualiza lista de workspaces]
```

## Serviço: createWorkspace

### Interface

```typescript
export interface CreateWorkspaceParams {
  name: string;
  companyId?: string; // Opcional - PLATFORM_ADMIN especifica, outros usam o próprio
}
```

### Endpoint
```
POST /workspace
```

### Request Body
```json
{
  "name": "Nome do Workspace",
  "companyId": "uuid-da-empresa" // Opcional
}
```

### Response
```json
{
  "id": "workspace-uuid",
  "name": "Nome do Workspace",
  "companyId": "company-uuid",
  "isDefault": false
}
```

## Invalidação de Cache

Após criação bem-sucedida, os seguintes queries são invalidados:

```typescript
queryClient.invalidateQueries({ queryKey: ["companyDetails"] });
queryClient.invalidateQueries({ queryKey: ["companies"] });
```

Isso garante que as listas de workspaces sejam atualizadas automaticamente.

## Mensagens de Feedback

### Sucesso
- Título: "Workspace criado"
- Descrição: "O workspace foi criado com sucesso."

### Erros
- **Sem permissão**: "Você não tem permissão para criar workspaces."
- **Nome vazio**: "Por favor, informe o nome do workspace."
- **Empresa não selecionada** (PLATFORM_ADMIN): "Por favor, selecione a empresa para o workspace."
- **Erro no servidor**: Mensagem retornada pela API

## Exemplos de Uso

### Exemplo 1: PLATFORM_ADMIN em AdminCompaniesPage

```tsx
import { CreateWorkspaceDialog } from "@/components/admin/CreateWorkspaceDialog";

// No componente
const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

// Carregar lista de empresas
const { data } = useQuery({
  queryKey: ["companies"],
  queryFn: () => listCompanies({ limit: 100, offset: 0 }),
});

// Renderizar
{has("create:workspace") && data && (
  <CreateWorkspaceDialog
    open={createWorkspaceOpen}
    onOpenChange={setCreateWorkspaceOpen}
    companies={data.companies.map((c) => ({ id: c.id, name: c.name }))}
  />
)}
```

### Exemplo 2: COMPANY_OWNER em CompanySettingsPage

```tsx
import { CreateWorkspaceDialog } from "@/components/admin/CreateWorkspaceDialog";

// No componente
const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
const { user } = useAuth();

// Renderizar
{has("create:workspace") && (
  <CreateWorkspaceDialog
    open={createWorkspaceOpen}
    onOpenChange={setCreateWorkspaceOpen}
    companyId={user?.companyId}
  />
)}
```

### Exemplo 3: PLATFORM_ADMIN em CompanyDetailsPage

```tsx
import { CreateWorkspaceDialog } from "@/components/admin/CreateWorkspaceDialog";

// No componente
const { companyId } = useParams();
const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

// Renderizar
{has("create:workspace") && (
  <CreateWorkspaceDialog
    open={createWorkspaceOpen}
    onOpenChange={setCreateWorkspaceOpen}
    companyId={companyId}
  />
)}
```

## Permissões Relacionadas

Conforme documentado em `SISTEMA_ROLES_PERMISSOES.md`:

- `create:workspace`: PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN
- `update:workspace`: PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN
- `delete:workspace`: PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN
- `view:all-workspaces`: PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN

## Notas Importantes

1. **Workspace Padrão**: O primeiro workspace de uma empresa é marcado como `isDefault: true` automaticamente pelo backend
2. **Validação no Backend**: O backend valida se o usuário tem permissão para criar workspace na empresa especificada
3. **Contexto Automático**: COMPANY_OWNER/ADMIN sempre criam na própria empresa, não podem especificar outra
4. **PLATFORM_ADMIN Flexível**: PLATFORM_ADMIN pode criar workspace em qualquer empresa da plataforma
