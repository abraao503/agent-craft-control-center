---
applyTo: "**"
---

# 📘 Guia de Desenvolvimento - Agent Craft Control Center

> **Documentação consolidada de padrões, boas práticas e arquitetura do projeto**

---

## 📑 Índice

1. [Visão Geral](#-visão-geral)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Arquitetura do Projeto](#-arquitetura-do-projeto)
4. [Padrões de Desenvolvimento](#-padrões-de-desenvolvimento)
5. [Componentes Reutilizáveis](#-componentes-reutilizáveis)
6. [Sistema de Permissões](#-sistema-de-permissões)
7. [Gestão de Estado](#-gestão-de-estado)
8. [Boas Práticas](#-boas-práticas)
9. [Estrutura de Pastas](#-estrutura-de-pastas)
10. [Guias Específicos](#-guias-específicos)

---

## 🎯 Visão Geral

**Agent Craft Control Center** é uma plataforma SaaS B2B2C multi-tenant com modelo reseller/white-label para gestão de vendas, assistentes de IA e integrações WhatsApp.

### Hierarquia de Negócio

```
PLATAFORMA (Platform Admin)
    ↓
EMPRESA (Company Owner/Admin) - Cliente Direto
    ↓
WORKSPACE (Workspace Owner/Admin/Manager) - Cliente Indireto
    ↓
VENDEDORES (Sales Rep)
```

### Características Principais

- 🔐 Sistema robusto de roles e permissões (7 níveis)
- 🏢 Multi-tenant com isolamento por empresa e workspace
- 🤖 Gestão de assistentes de IA
- 💬 Integração WhatsApp (Evolux)
- 📊 Pipelines de vendas customizáveis
- 📋 Sistema de follow-up e tags
- 🎨 Interface moderna com Shadcn/UI

---

## 🛠️ Stack Tecnológica

### Core

- **React 18** - Biblioteca UI
- **TypeScript** - Linguagem
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Shadcn/UI** - Componentes UI

### Gestão de Estado & Dados

- **React Query (TanStack Query)** - Server state management
- **React Context** - Estado global (Auth, Workspace)
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Roteamento & Navegação

- **React Router v6** - Roteamento SPA

### UI & Componentes

- **Radix UI** - Primitivos acessíveis
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas
- **Recharts** - Gráficos
- **TipTap** - Editor de texto rico

### Comunicação

- **Axios** - Cliente HTTP
- **Socket.io Client** - WebSocket

### Qualidade & Monitoramento

- **Highlight.run** - Session recording e error tracking
- **ESLint** - Linting

---

## 🏗️ Arquitetura do Projeto

### Princípios Arquiteturais

1. **Separação de Responsabilidades** - Componentes, serviços, hooks e contexts bem definidos
2. **Composição sobre Herança** - Componentização e reutilização
3. **Single Source of Truth** - React Query como cache centralizado
4. **Imutabilidade** - Estado nunca mutado diretamente
5. **Type Safety** - TypeScript em 100% do código

### Fluxo de Dados

```
Componente
    ↓
Hook (useQuery/useMutation)
    ↓
Service (API call)
    ↓
Backend API
    ↓
Database
```

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Pages, Components, UI)            │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│  (Hooks, Contexts, Utils)           │
├─────────────────────────────────────┤
│         Data Access Layer           │
│  (Services, API, React Query)       │
├─────────────────────────────────────┤
│         External Services           │
│  (Backend API, WebSocket)           │
└─────────────────────────────────────┘
```

---

## 🎨 Padrões de Desenvolvimento

### 1. Componentização

#### Componentes de Apresentação (Presentational)

```tsx
// Apenas recebem props e renderizam UI
interface UserCardProps {
  name: string;
  email: string;
  role: UserRole;
}

export function UserCard({ name, email, role }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{email}</p>
        <Badge>{role}</Badge>
      </CardContent>
    </Card>
  );
}
```

#### Componentes Container (Smart)

```tsx
// Gerenciam estado e lógica
export function UserListContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      {data.users.map((user) => (
        <UserCard key={user.id} {...user} />
      ))}
    </div>
  );
}
```

### 2. Custom Hooks

Extraia lógica reutilizável em hooks customizados:

```tsx
// ✅ BOM: Hook reutilizável
export function useWorkspaceData(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspaceById(workspaceId),
    enabled: !!workspaceId,
  });
}

// Uso
function WorkspacePage() {
  const { workspaceId } = useParams();
  const { data, isLoading, error } = useWorkspaceData(workspaceId);

  // ... resto do componente
}
```

### 3. Serviços (Services)

Organize chamadas de API em serviços dedicados:

```tsx
// src/services/user/listUsers.ts
import { api } from "../api";
import { User } from "@/types/user";

export interface ListUsersParams {
  workspaceId?: string;
  page?: number;
  limit?: number;
}

export async function listUsers(params: ListUsersParams): Promise<User[]> {
  const { data } = await api.get("/user", { params });
  return data.users;
}
```

### 4. React Query Patterns

#### Query Básica

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["resource", id],
  queryFn: () => fetchResource(id),
  enabled: !!id, // Executa apenas se id existir
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

#### Mutation com Invalidação

```tsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    // Invalida e recarrega a lista
    queryClient.invalidateQueries({ queryKey: ["resources"] });

    toast({
      title: "Sucesso",
      description: "Recurso criado com sucesso!",
    });
  },
  onError: (error) => {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

#### Query com Paginação

```tsx
const [currentPage, setCurrentPage] = useState(0);
const limit = 10;

const { data, isLoading } = useQuery({
  queryKey: ["resources", currentPage],
  queryFn: () =>
    listResources({
      limit,
      offset: currentPage * limit,
    }),
  keepPreviousData: true, // Mantém dados anteriores enquanto carrega
});
```

### 5. Gerenciamento de Formulários

Use React Hook Form + Zod para formulários robustos:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "USER"]),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "USER",
    },
  });

  const onSubmit = (data: FormData) => {
    // Dados já validados
    createUser(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... outros campos */}
      </form>
    </Form>
  );
}
```

### 6. Tratamento de Erros

```tsx
// ✅ BOM: Tratamento consistente
export function ResourceList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar recursos. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div>
      {data.map((item) => (
        <ResourceCard key={item.id} {...item} />
      ))}
    </div>
  );
}
```

---

## 🧩 Componentes Reutilizáveis

### SmartPagination

Componente de paginação inteligente que lida com grandes quantidades de páginas.

**Localização:** `src/components/common/SmartPagination.tsx`

**Uso:**

```tsx
import { SmartPagination } from "@/components/common/SmartPagination";

function MyListPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 10;

  const { data } = useQuery({
    queryKey: ["items", currentPage],
    queryFn: () => listItems({ limit, offset: currentPage * limit }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      {/* ... sua lista ... */}

      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showItemCount
        itemsPerPage={limit}
        totalItems={data?.total || 0}
        itemLabel="itens"
      />
    </>
  );
}
```

**Props:**

| Prop            | Tipo                     | Padrão    | Descrição                 |
| --------------- | ------------------------ | --------- | ------------------------- |
| `currentPage`   | `number`                 | -         | Página atual (0-indexed)  |
| `totalPages`    | `number`                 | -         | Total de páginas          |
| `onPageChange`  | `(page: number) => void` | -         | Callback ao mudar página  |
| `siblingCount`  | `number`                 | `2`       | Páginas ao redor da atual |
| `showItemCount` | `boolean`                | `false`   | Mostrar contador de itens |
| `itemsPerPage`  | `number`                 | `10`      | Itens por página          |
| `totalItems`    | `number`                 | `0`       | Total de itens            |
| `itemLabel`     | `string`                 | `"itens"` | Label customizado         |

**Padrões de Exibição:**

```
Poucas páginas:   ← 1 2 3 4 5 →
Início:          ← 1 2 3 4 5 ... 20 →
Meio:            ← 1 ... 8 9 10 11 12 ... 20 →
Final:           ← 1 ... 16 17 18 19 20 →
```

### Outros Componentes Comuns

- **Dialogs Admin** - `src/components/admin/`

  - `CreateCompanyDialog`
  - `EditCompanyDialog`
  - `CompanyDetailsDialog`
  - `CreateCompanyUserDialog`

- **Tag Management** - `src/components/tags/`

  - `TagManager`
  - `ChatTagManager`

- **WhatsApp** - `src/components/whatsapp/`
  - `WhatsAppIntegrationCard`

---

## 🔐 Sistema de Permissões

### Hook usePermissions

**Localização:** `src/hooks/usePermissions.ts`

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const { has, hasAny, hasAll, role, isCompanyLevel } = usePermissions();

  // Verificar permissão única
  if (!has("view:all-companies")) {
    return <AccessDenied />;
  }

  // Verificar múltiplas permissões (OR)
  const canManage = hasAny(["manage:company", "manage:workspace"]);

  // Verificar múltiplas permissões (AND)
  const canFullAccess = hasAll(["create:deal", "update:deal", "delete:deal"]);

  // Verificar role
  if (role === "PLATFORM_ADMIN") {
    // ...
  }

  // Verificar nível
  if (isCompanyLevel()) {
    // Mostrar opções de empresa
  }

  return <div>Content</div>;
}
```

### Roles e Hierarquia

```
1. PLATFORM_ADMIN      (Topo - Admin da plataforma)
2. COMPANY_OWNER       (Dono da empresa)
3. COMPANY_ADMIN       (Admin técnico da empresa)
4. WORKSPACE_OWNER     (Dono do workspace)
5. WORKSPACE_ADMIN     (Admin do workspace)
6. WORKSPACE_MANAGER   (Gerente de vendas)
7. SALES_REP           (Vendedor)
```

### Principais Permissões

#### Nível Plataforma

- `manage:platform`
- `view:all-companies`
- `create:company`
- `delete:company`

#### Nível Empresa

- `manage:company`
- `create:workspace`
- `update:workspace`
- `delete:workspace`
- `create:company-user`

#### Nível Workspace

- `create:workspace-user`
- `create:pipeline`
- `update:pipeline`
- `create:assistant`
- `view:all-deals`

#### Nível Vendedor

- `view:own-deals`
- `update:deal`
- `view:chat`

> **Documentação Completa:** Ver `docs/api/SISTEMA_ROLES_PERMISSOES.md`

---

## 📦 Gestão de Estado

### Estado Local (useState)

Use para estado simples e específico do componente:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### Estado de Servidor (React Query)

Use para dados vindos da API:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ["key"],
  queryFn: fetchData,
});
```

### Estado Global (Context)

Use para estado compartilhado entre muitos componentes:

#### Auth Context

```tsx
import { useAuth } from "@/contexts/auth/hooks";

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();

  // ...
}
```

#### Workspace Context

```tsx
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";

function MyComponent() {
  const { currentWorkspace, setCurrentWorkspace, workspaceChanged } =
    useWorkspaceContext();

  // ...
}
```

### Invalidação de Cache

Invalide queries após mutations para atualizar dados:

```tsx
const queryClient = useQueryClient();

// Invalidar query específica
queryClient.invalidateQueries({ queryKey: ["users", workspaceId] });

// Invalidar múltiplas queries
queryClient.invalidateQueries({ queryKey: ["users"] }); // Todas as queries de users

// Invalidar e refetch imediatamente
await queryClient.invalidateQueries({
  queryKey: ["users"],
  refetchType: "active",
});
```

---

## ✅ Boas Práticas

### 1. TypeScript

```tsx
// ✅ BOM: Tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}

// ❌ RUIM: any
function UserCard({ user }: { user: any }) {
  return <div>{user.name}</div>;
}
```

### 2. Nomenclatura

```tsx
// ✅ BOM: Nomes descritivos
const isUserAuthenticated = !!user;
const hasAdminPermission = has("manage:company");
const handleCreateUser = () => {
  /* ... */
};

// ❌ RUIM: Nomes vagos
const flag = !!user;
const check = has("manage:company");
const doIt = () => {
  /* ... */
};
```

### 3. Componentes Pequenos

```tsx
// ✅ BOM: Componentes focados
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>{user.name}</CardHeader>
      <CardContent>{user.email}</CardContent>
    </Card>
  );
}

// ❌ RUIM: Componente gigante fazendo tudo
function UserManagement() {
  // 500 linhas de código...
}
```

### 4. Extrair Lógica Complexa

```tsx
// ✅ BOM: Lógica em função separada
function calculateUserPermissions(user: User): Permission[] {
  // Lógica complexa
  return permissions;
}

function UserComponent({ user }: { user: User }) {
  const permissions = calculateUserPermissions(user);
  // ...
}

// ✅ MELHOR: Hook customizado
function useUserPermissions(user: User) {
  return useMemo(() => calculateUserPermissions(user), [user]);
}
```

### 5. Tratamento de Loading e Erros

```tsx
// ✅ BOM: Estados claros
function ResourceList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <List items={data} />;
}

// ❌ RUIM: Sem tratamento
function ResourceList() {
  const { data } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  return <List items={data} />; // Pode crashar
}
```

### 6. Keys em Listas

```tsx
// ✅ BOM: Key estável e única
{
  users.map((user) => <UserCard key={user.id} user={user} />);
}

// ❌ RUIM: Index como key
{
  users.map((user, index) => <UserCard key={index} user={user} />);
}
```

### 7. Destructuring de Props

```tsx
// ✅ BOM: Destructuring
function UserCard({ name, email, role }: UserCardProps) {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
      <Badge>{role}</Badge>
    </div>
  );
}

// ❌ RUIM: Props genérico
function UserCard(props: UserCardProps) {
  return (
    <div>
      <h3>{props.name}</h3>
      <p>{props.email}</p>
      <Badge>{props.role}</Badge>
    </div>
  );
}
```

### 8. Evitar Re-renders Desnecessários

```tsx
// ✅ BOM: useMemo para cálculos pesados
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// ✅ BOM: useCallback para funções passadas como props
const handleUserClick = useCallback(
  (userId: string) => {
    navigate(`/users/${userId}`);
  },
  [navigate]
);
```

### 9. Comentários Úteis

```tsx
// ✅ BOM: Comentário explicando "porquê"
// Invalida cache de workspaces após 5s para dar tempo do backend processar
setTimeout(() => {
  queryClient.invalidateQueries({ queryKey: ["workspaces"] });
}, 5000);

// ❌ RUIM: Comentário explicando "o quê" (óbvio)
// Incrementa contador
setCount(count + 1);
```

### 10. Validação de Entrada

```tsx
// ✅ BOM: Validação defensiva
function UserProfile({ userId }: { userId?: string }) {
  if (!userId) {
    return <ErrorMessage message="ID do usuário não fornecido" />;
  }

  const { data } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  // ...
}
```

---

## 📂 Estrutura de Pastas

```
src/
├── components/          # Componentes React
│   ├── admin/          # Componentes de administração
│   ├── agents/         # Componentes de agentes/assistentes
│   ├── auth/           # Componentes de autenticação
│   ├── chats/          # Componentes de chat
│   ├── common/         # Componentes reutilizáveis ⭐
│   ├── content/        # Gestão de conteúdo
│   ├── dashboard/      # Dashboard
│   ├── deals/          # Deals/Negócios
│   ├── follow-up/      # Follow-ups
│   ├── kanban/         # Board kanban
│   ├── layout/         # Layout (Header, Sidebar)
│   ├── pipelines/      # Pipelines de vendas
│   ├── tags/           # Sistema de tags
│   ├── theme/          # Temas
│   ├── ui/             # Componentes UI base (shadcn)
│   └── whatsapp/       # Integrações WhatsApp
│
├── contexts/           # React Contexts
│   ├── auth/          # Context de autenticação
│   └── workspace/     # Context de workspace
│
├── hooks/              # Custom Hooks
│   ├── usePermissions.ts
│   ├── useWebSocket.ts
│   ├── useWorkspaceManager.ts
│   └── ...
│
├── lib/                # Utilitários e configurações
│   ├── utils.ts       # Funções auxiliares
│   ├── socket.ts      # Configuração WebSocket
│   └── highlight.ts   # Configuração Highlight
│
├── pages/              # Páginas/Rotas
│   ├── Dashboard.tsx
│   ├── AdminCompaniesPage.tsx
│   ├── AgentsPage.tsx
│   └── ...
│
├── services/           # Serviços de API
│   ├── api.ts         # Cliente Axios configurado
│   ├── agent/
│   ├── auth/
│   ├── company/
│   ├── conversation/
│   ├── customer/
│   ├── deal/
│   ├── follow-up/
│   ├── pipeline/
│   ├── tag/
│   ├── user/
│   └── whatsapp/
│
├── types/              # Definições TypeScript
│   ├── agent.ts
│   ├── auth.ts
│   ├── company.ts
│   ├── conversation.ts
│   └── ...
│
├── utils/              # Funções utilitárias
│
├── App.tsx            # Componente raiz
├── main.tsx           # Entry point
└── index.css          # Estilos globais
```

### Organização de Serviços

Cada recurso tem sua pasta com operações CRUD:

```
services/company/
├── createCompany.ts
├── updateCompany.ts
├── deleteCompany.ts
├── listCompanies.ts
└── getCompanyById.ts
```

### Organização de Types

Um arquivo por domínio:

```
types/
├── user.ts            # User, UserRole, CreateUserParams, etc.
├── company.ts         # Company, CreateCompanyParams, etc.
└── workspace.ts       # Workspace, WorkspaceSettings, etc.
```

---

## 📖 Guias Específicos

### Administração de Empresas

Para funcionalidades de administração da plataforma (PLATFORM_ADMIN):

- **Arquitetura:** `docs/ADMIN_COMPANIES_ARCHITECTURE.md`
- **Guia Rápido:** `docs/ADMIN_COMPANIES_QUICKSTART.md`
- **Feature Completa:** `docs/ADMIN_PLATFORM_FEATURE.md`
- **Resumo de Melhorias:** `docs/ADMIN_COMPANIES_SUMMARY.md`

### Sistema de Roles e Permissões

Detalhes completos sobre o sistema de autenticação e autorização:

- **Documentação:** `docs/api/SISTEMA_ROLES_PERMISSOES.md`

### WebSocket

Comunicação em tempo real:

- **Documentação:** `WEBSOCKET.md`

---

## 🚀 Fluxo de Desenvolvimento

### 1. Criando uma Nova Feature

```bash
# 1. Criar types
src/types/minha-feature.ts

# 2. Criar serviços de API
src/services/minha-feature/
  ├── create.ts
  ├── list.ts
  └── update.ts

# 3. Criar componentes
src/components/minha-feature/
  ├── MyFeatureCard.tsx
  ├── MyFeatureDialog.tsx
  └── index.ts

# 4. Criar página
src/pages/MyFeaturePage.tsx

# 5. Adicionar rota
src/App.tsx
```

### 2. Criando um Componente

```tsx
// 1. Definir interface de props
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 2. Componente funcional com TypeScript
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>("");

  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={onAction}>Ação</Button>
    </div>
  );
}

// 3. Export no index.ts
// src/components/minha-feature/index.ts
export { MyComponent } from "./MyComponent";
```

### 3. Criando um Serviço

```tsx
// src/services/resource/createResource.ts
import { api } from "../api";
import { Resource } from "@/types/resource";

export interface CreateResourceParams {
  name: string;
  description: string;
}

export async function createResource(
  params: CreateResourceParams
): Promise<Resource> {
  const { data } = await api.post("/resource", params);
  return data;
}
```

### 4. Criando uma Página

```tsx
// src/pages/MyResourcePage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listResources } from "@/services/resource/listResources";
import { SmartPagination } from "@/components/common/SmartPagination";

export default function MyResourcePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["resources", currentPage],
    queryFn: () => listResources({ limit, offset: currentPage * limit }),
  });

  if (isLoading) return <Loader />;
  if (error) return <Error />;

  return (
    <div className="space-y-6 p-6">
      <h1>Meus Recursos</h1>

      {/* Lista */}
      <div className="grid gap-4">
        {data.resources.map((resource) => (
          <ResourceCard key={resource.id} {...resource} />
        ))}
      </div>

      {/* Paginação */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={Math.ceil(data.total / limit)}
        onPageChange={setCurrentPage}
        showItemCount
        itemsPerPage={limit}
        totalItems={data.total}
        itemLabel="recursos"
      />
    </div>
  );
}
```

---

## 🔍 Debugging

### React Query Devtools

Adicione no desenvolvimento para inspecionar queries:

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>;
```

### Console Logs Úteis

```tsx
// Log de render
useEffect(() => {
  console.log("Component rendered", { prop1, prop2 });
}, [prop1, prop2]);

// Log de query
const { data } = useQuery({
  queryKey: ["key"],
  queryFn: fetchData,
  onSuccess: (data) => console.log("Data loaded:", data),
  onError: (error) => console.error("Error loading:", error),
});
```

---

## 📋 Checklist para Pull Request

- [ ] Código segue os padrões do projeto
- [ ] TypeScript sem erros (`npm run build`)
- [ ] Componentes testados manualmente
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Queries invalidadas após mutations
- [ ] Permissões verificadas quando necessário
- [ ] Sem console.logs desnecessários
- [ ] Código documentado (comentários quando necessário)
- [ ] Types criados/atualizados
- [ ] Imports organizados

---

## 🎓 Recursos para Aprender Mais

### Documentação Oficial

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)

### Padrões e Boas Práticas

- [React Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🤝 Contribuindo

1. Leia esta documentação completamente
2. Siga os padrões estabelecidos
3. Mantenha consistência com o código existente
4. Documente mudanças significativas
5. Peça review antes de mergear

---

**Última Atualização:** Novembro 2024  
**Versão da Documentação:** 1.0  
**Mantido por:** Equipe de Desenvolvimento
