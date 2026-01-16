# Painel de Administração de Plataforma

Este diretório contém os componentes para o painel de controle do **PLATFORM_ADMIN**.

## Estrutura

```
src/components/admin/
├── index.ts                      # Exports centralizados
├── CreateCompanyDialog.tsx       # Criar nova empresa
├── EditCompanyDialog.tsx         # Editar empresa existente
├── CompanyDetailsDialog.tsx      # Ver detalhes, workspaces e usuários
└── CreateCompanyUserDialog.tsx   # Criar usuários de empresa/workspace
```

## Componentes

### CreateCompanyDialog
Permite criar uma nova empresa com dono (COMPANY_OWNER).

**Props:**
- `open: boolean` - Controle de visibilidade
- `onOpenChange: (open: boolean) => void` - Callback de mudança

**Funcionalidades:**
- Cria empresa
- Cria usuário COMPANY_OWNER
- Cria workspace padrão automaticamente

---

### EditCompanyDialog
Permite editar dados da empresa existente.

**Props:**
- `open: boolean` - Controle de visibilidade
- `onOpenChange: (open: boolean) => void` - Callback de mudança
- `company: Company | null` - Empresa a ser editada

**Funcionalidades:**
- Atualiza nome da empresa
- Atualiza dados do dono
- Validação de permissões

---

### CompanyDetailsDialog
Visualiza detalhes completos da empresa com abas para workspaces e usuários.

**Props:**
- `open: boolean` - Controle de visibilidade
- `onOpenChange: (open: boolean) => void` - Callback de mudança
- `companyId: string | null` - ID da empresa

**Funcionalidades:**
- **Aba Workspaces:**
  - Lista todos os workspaces da empresa
  - Mostra workspace padrão
  - Exibe IDs para referência

- **Aba Usuários:**
  - Lista usuários de nível empresa (sem workspace específico)
  - Mostra função (role) de cada usuário
  - Paginação para grandes listas
  - Botão para criar novos usuários

**APIs Utilizadas:**
- `GET /company/:companyId` - Busca dados da empresa e workspaces
- `GET /company/:companyId/admins` - Lista usuários de empresa

---

### CreateCompanyUserDialog
Cria usuários para a empresa ou workspaces específicos.

**Props:**
- `open: boolean` - Controle de visibilidade
- `onOpenChange: (open: boolean) => void` - Callback de mudança
- `companyId: string` - ID da empresa
- `workspaces?: Array<{ id: string; name: string }>` - Workspaces disponíveis

**Funcionalidades:**
- Criar usuários de nível empresa (COMPANY_OWNER, COMPANY_ADMIN)
- Criar usuários de workspace (WORKSPACE_OWNER, WORKSPACE_ADMIN, WORKSPACE_MANAGER, SALES_REP)
- Validação automática de contexto (workspace obrigatório para roles de workspace)
- Seletor inteligente que agrupa roles por nível

**Regras de Validação:**
- Roles de empresa **NÃO** podem ter workspace
- Roles de workspace **DEVEM** ter workspace
- Senha mínima de 8 caracteres
- Email único no sistema

**API Utilizada:**
- `POST /user/add-to-company` - Cria novo usuário

---

## Fluxo de Uso

### 1. Criar Nova Empresa
```
AdminCompaniesPage 
  → Botão "Nova Empresa" 
  → CreateCompanyDialog
  → Empresa criada com COMPANY_OWNER e workspace padrão
```

### 2. Visualizar Detalhes da Empresa
```
AdminCompaniesPage 
  → Botão "Ver Detalhes" (ícone olho)
  → CompanyDetailsDialog
  → Abas: Workspaces | Usuários
```

### 3. Criar Usuário para Empresa
```
CompanyDetailsDialog 
  → Aba "Usuários"
  → Botão "Novo Usuário"
  → CreateCompanyUserDialog
  → Seleciona role (empresa ou workspace)
  → Se workspace role, seleciona workspace
  → Usuário criado
```

### 4. Editar Empresa
```
AdminCompaniesPage 
  → Botão "Editar" (ícone lápis)
  → EditCompanyDialog
  → Atualiza dados
```

---

## Hierarquia de Roles

Conforme documentado em `/docs/api/SISTEMA_ROLES_PERMISSOES.md`:

### Nível Empresa (sem workspace)
- **COMPANY_OWNER** - Dono da empresa, controle total
- **COMPANY_ADMIN** - Admin técnico da empresa

### Nível Workspace (com workspace específico)
- **WORKSPACE_OWNER** - Dono do workspace
- **WORKSPACE_ADMIN** - Admin do workspace
- **WORKSPACE_MANAGER** - Gerente de vendas
- **SALES_REP** - Vendedor

---

## Permissões Necessárias

Os componentes verificam as seguintes permissões:

- `view:all-companies` - Ver lista de empresas
- `create:company` - Criar empresas
- `manage:company` - Editar empresas
- `create:company-user` - Criar usuários de empresa
- `create:workspace-user` - Criar usuários de workspace (via COMPANY_ADMIN)

---

## Escalabilidade

A estrutura foi projetada para crescer:

### Possíveis Expansões Futuras

1. **Gestão de Billing**
   - `CompanyBillingTab.tsx` - Gerenciar planos e pagamentos
   - Integração com Stripe/outros

2. **Gestão de Workspaces**
   - `WorkspaceManagementDialog.tsx` - Criar/editar workspaces
   - Atribuir recursos e limites

3. **Auditoria e Logs**
   - `CompanyAuditLogTab.tsx` - Ver histórico de ações
   - Rastreamento de mudanças

4. **Estatísticas e Analytics**
   - `CompanyStatsTab.tsx` - Métricas da empresa
   - Dashboard de uso

5. **Gestão de Integrações**
   - `CompanyIntegrationsTab.tsx` - Configurar APIs e webhooks
   - Gerenciar credenciais

6. **Workspace Details**
   - `WorkspaceDetailsDialog.tsx` - Ver usuários de workspace específico
   - Pipelines e assistentes configurados

---

## Boas Práticas

1. **Sempre valide permissões** antes de mostrar ações
2. **Use React Query** para cache e invalidação automática
3. **Feedback ao usuário** com toasts de sucesso/erro
4. **Loading states** para melhor UX
5. **Paginação** para listas grandes
6. **Validação de formulários** antes de enviar

---

## Tecnologias

- **React** + **TypeScript**
- **TanStack Query** (React Query) - Gerenciamento de estado server
- **Radix UI** - Componentes acessíveis (Dialog, Tabs, Select)
- **Tailwind CSS** - Estilização
- **date-fns** - Formatação de datas
- **Lucide React** - Ícones

---

## Exemplo de Uso

```tsx
import { CompanyDetailsDialog } from "@/components/admin";

function MyAdminPage() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => {
        setSelectedCompanyId(companyId);
        setDetailsOpen(true);
      }}>
        Ver Detalhes
      </Button>

      <CompanyDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        companyId={selectedCompanyId}
      />
    </>
  );
}
```

---

## Veja Também

- [Sistema de Roles e Permissões](/docs/api/SISTEMA_ROLES_PERMISSOES.md)
- [Arquitetura Admin Companies](/docs/ADMIN_COMPANIES_ARCHITECTURE.md)
