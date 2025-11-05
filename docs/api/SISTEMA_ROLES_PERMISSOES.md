# Sistema de Roles e Permissões

## Índice
- [Visão Geral](#visão-geral)
- [Modelo de Negócio](#modelo-de-negócio)
- [Roles Implementados](#roles-implementados)
- [Hierarquia de Roles](#hierarquia-de-roles)
- [Permissões Detalhadas](#permissões-detalhadas)
- [Criação de Usuários](#criação-de-usuários)
- [Validação de Contexto](#validação-de-contexto)
- [Casos de Uso](#casos-de-uso)
- [Implementação Técnica](#implementação-técnica)
- [Segurança](#segurança)

---

## Visão Geral

O sistema implementa um modelo **SaaS B2B2C multi-tenant com reseller/white-label**, com 3 níveis hierárquicos:

```
┌─────────────────────────────────────────────────────────┐
│                    PLATAFORMA                            │
│                  (PLATFORM_ADMIN)                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              EMPRESA (Cliente Direto)              │ │
│  │         (COMPANY_OWNER, COMPANY_ADMIN)             │ │
│  │                                                     │ │
│  │  ┌────────────────────────────────────────────┐   │ │
│  │  │    WORKSPACE (Cliente Indireto)           │   │ │
│  │  │  (WORKSPACE_OWNER, WORKSPACE_ADMIN,       │   │ │
│  │  │   WORKSPACE_MANAGER, SALES_REP)           │   │ │
│  │  └────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Modelo de Negócio

### Fluxo de Negócio

1. **PLATFORM_ADMIN** gerencia a plataforma inteira
2. **Empresa** (Cliente Direto) compra um plano
3. **COMPANY_OWNER/ADMIN** gerencia workspaces e pode revendê-los
4. **Workspace** (Cliente Indireto) usa a plataforma para vendas
5. **WORKSPACE_OWNER/ADMIN** gerencia vendedores e pipelines
6. **WORKSPACE_MANAGER** gerencia equipe de vendas
7. **SALES_REP** trabalha com deals atribuídos

### Dois Níveis de Operação

**Nível Company (Configuração)**
- COMPANY_OWNER/ADMIN configuram workspaces
- Criam pipelines customizados
- Configuram assistentes
- Configuram integrações
- Preparam workspace para revenda

**Nível Workspace (Operação)**
- WORKSPACE_OWNER/ADMIN recebem workspace pré-configurado
- Apenas operam com recursos existentes
- Conectam contas (ex: WhatsApp)
- Gerenciam vendedores
- Trabalham com deals

---

## Roles Implementados

### 7 Roles Totais

#### 1. PLATFORM_ADMIN (Nível 1 - Mais Alto)
**Descrição:** Super administrador da plataforma.

**Escopo:** Todas as empresas e workspaces.

**Permissões:**
- Gerenciar plataforma completa
- Criar e remover empresas
- Visualizar todas as empresas
- Gerenciar billing de empresas
- Todas as permissões de níveis inferiores

**Uso:** Equipe interna da plataforma.

---

#### 2. COMPANY_OWNER (Nível 2)
**Descrição:** Dono da empresa, cliente direto que compra o plano e revende workspaces.

**Escopo:** Própria empresa e todos os workspaces.

**Permissões:**
- Gerenciar empresa (configurações, billing)
- Criar, editar e remover workspaces
- Visualizar todos os workspaces
- Criar e remover usuários da empresa
- Criar usuários de workspace
- Atribuir usuários a workspaces
- **Configurar pipelines** para cada workspace
- **Configurar assistentes** para cada workspace
- **Configurar integrações** (Evolux, etc)
- Gerenciar deals de todos os workspaces
- Visualizar relatórios da empresa

**Uso:** Proprietário que configura workspaces customizados e os revende.

---

#### 3. COMPANY_ADMIN (Nível 3)
**Descrição:** Administrador técnico da empresa.

**Escopo:** Própria empresa e todos os workspaces.

**Permissões:**
- Criar, editar e remover workspaces
- Criar e remover usuários da empresa e workspace
- Atribuir usuários a workspaces
- **Configurar pipelines** para cada workspace
- **Configurar assistentes** para cada workspace
- **Configurar integrações** (Evolux, etc)
- Criar, editar e atribuir deals
- Visualizar todos os deals de todos os workspaces
- Visualizar relatórios da empresa
- **Não pode:** Gerenciar billing

**Uso:** Administrador técnico que configura workspaces para revenda.

---

#### 4. WORKSPACE_OWNER (Nível 4)
**Descrição:** Dono do workspace, cliente indireto que recebe workspace pré-configurado.

**Escopo:** Apenas o próprio workspace.

**Permissões:**
- Editar configurações básicas do workspace
- Criar e remover usuários do workspace
- **Visualizar** pipelines e assistentes (somente leitura)
- **Conectar/desconectar** conta WhatsApp (Evolux)
- Visualizar status de integrações
- Criar, editar e atribuir deals
- Visualizar todos os deals do workspace
- Visualizar relatórios do workspace

**Restrições:**
- ❌ Não pode criar ou editar pipelines
- ❌ Não pode criar ou editar assistentes
- ❌ Não pode configurar integrações (apenas conectar WhatsApp)

**Uso:** Cliente que comprou/recebeu workspace pré-configurado da empresa.

---

#### 5. WORKSPACE_ADMIN (Nível 5)
**Descrição:** Administrador do workspace que recebe workspace pré-configurado.

**Escopo:** Apenas o próprio workspace.

**Permissões:**
- Criar e remover usuários do workspace
- **Visualizar** pipelines e assistentes (somente leitura)
- **Conectar/desconectar** conta WhatsApp (Evolux)
- Visualizar status de integrações
- Criar, editar e atribuir deals
- Visualizar todos os deals do workspace
- Visualizar relatórios do workspace

**Restrições:**
- ❌ Não pode criar ou editar pipelines
- ❌ Não pode criar ou editar assistentes
- ❌ Não pode configurar integrações (apenas conectar WhatsApp)

**Uso:** Administrador técnico do workspace pré-configurado.

---

#### 6. WORKSPACE_MANAGER (Nível 6)
**Descrição:** Gerente de vendas.

**Escopo:** Apenas o próprio workspace.

**Permissões:**
- Criar vendedores (SALES_REP)
- Criar, editar e atribuir deals
- Visualizar todos os deals do workspace
- Visualizar deals da equipe
- Visualizar relatórios do workspace
- **Não pode:** Gerenciar pipelines ou assistentes

**Uso:** Gerente que supervisiona equipe de vendas.

---

#### 7. SALES_REP (Nível 7 - Mais Baixo)
**Descrição:** Vendedor/Representante de vendas.

**Escopo:** Apenas o próprio workspace e deals atribuídos.

**Permissões:**
- Visualizar pipelines e assistentes (somente leitura)
- Visualizar apenas deals atribuídos a ele
- Editar e mover deals atribuídos
- Interagir via chat
- **Não pode:** Ver deals de outros vendedores

**Uso:** Vendedor que trabalha com leads/deals.

---

## Hierarquia de Roles

### Princípio Fundamental

**Um usuário só pode criar usuários com roles abaixo dele na hierarquia.**

### Hierarquia (Do Mais Alto para o Mais Baixo)

```
1. PLATFORM_ADMIN (Nível 1)
   └─ Pode criar: Qualquer role abaixo

2. COMPANY_OWNER (Nível 2)
   └─ Pode criar: COMPANY_ADMIN, WORKSPACE_*, SALES_REP

3. COMPANY_ADMIN (Nível 3)
   └─ Pode criar: WORKSPACE_*, SALES_REP

4. WORKSPACE_OWNER (Nível 4)
   └─ Pode criar: WORKSPACE_ADMIN, WORKSPACE_MANAGER, SALES_REP

5. WORKSPACE_ADMIN (Nível 5)
   └─ Pode criar: WORKSPACE_MANAGER, SALES_REP

6. WORKSPACE_MANAGER (Nível 6)
   └─ Pode criar: SALES_REP

7. SALES_REP (Nível 7)
   └─ Pode criar: Ninguém
```

### Matriz de Criação de Roles

| Criador | Pode Criar | Não Pode Criar |
|---------|-----------|----------------|
| PLATFORM_ADMIN | ✅ Todos abaixo | ❌ Ninguém (é o topo) |
| COMPANY_OWNER | ✅ COMPANY_ADMIN, WORKSPACE_*, SALES_REP | ❌ COMPANY_OWNER, PLATFORM_ADMIN |
| COMPANY_ADMIN | ✅ WORKSPACE_*, SALES_REP | ❌ COMPANY_OWNER, COMPANY_ADMIN, PLATFORM_ADMIN |
| WORKSPACE_OWNER | ✅ WORKSPACE_ADMIN, WORKSPACE_MANAGER, SALES_REP | ❌ WORKSPACE_OWNER, COMPANY_*, PLATFORM_ADMIN |
| WORKSPACE_ADMIN | ✅ WORKSPACE_MANAGER, SALES_REP | ❌ WORKSPACE_ADMIN, WORKSPACE_OWNER, COMPANY_*, PLATFORM_ADMIN |
| WORKSPACE_MANAGER | ✅ SALES_REP | ❌ Todos acima dele |
| SALES_REP | ❌ Nenhum | ❌ Todos |

---

## Permissões Detalhadas

### Gerenciamento de Plataforma
- `manage:platform` - Gerenciar plataforma (PLATFORM_ADMIN)
- `view:platform-reports` - Visualizar relatórios da plataforma (PLATFORM_ADMIN)

### Gerenciamento de Empresas
- `create:company` - Criar empresas (PLATFORM_ADMIN)
- `delete:company` - Remover empresas (PLATFORM_ADMIN)
- `view:all-companies` - Visualizar todas as empresas (PLATFORM_ADMIN)
- `manage:company` - Gerenciar empresa (PLATFORM_ADMIN, COMPANY_OWNER)
- `update:company` - Atualizar empresa (PLATFORM_ADMIN, COMPANY_OWNER)
- `view:company-billing` - Visualizar billing (PLATFORM_ADMIN, COMPANY_OWNER)

### Gerenciamento de Workspaces
- `create:workspace` - Criar workspaces (COMPANY_OWNER, COMPANY_ADMIN)
- `update:workspace` - Editar workspaces (COMPANY_OWNER, COMPANY_ADMIN)
- `delete:workspace` - Remover workspaces (COMPANY_OWNER, COMPANY_ADMIN)
- `view:all-workspaces` - Visualizar todos os workspaces (COMPANY_OWNER, COMPANY_ADMIN)

### Gerenciamento de Usuários
- `create:company-user` - Criar usuários no nível empresa (COMPANY_OWNER, COMPANY_ADMIN)
- `delete:company-user` - Remover usuários no nível empresa (COMPANY_OWNER, COMPANY_ADMIN)
- `create:workspace-user` - Criar usuários no nível workspace (WORKSPACE_OWNER, WORKSPACE_ADMIN, WORKSPACE_MANAGER)
- `delete:workspace-user` - Remover usuários no nível workspace (WORKSPACE_OWNER, WORKSPACE_ADMIN)
- `list:users` - Listar usuários
- `assign:user-to-workspace` - Atribuir usuários a workspaces

### Gerenciamento de Pipelines (Company level only)
- `create:pipeline` - Criar pipelines (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `update:pipeline` - Editar pipelines (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `delete:pipeline` - Remover pipelines (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `view:pipeline` - Visualizar pipelines (Todos)

**Nota:** Workspace-level roles só podem **visualizar** pipelines configurados pela empresa.

### Gerenciamento de Assistentes (Company level only)
- `create:assistant` - Criar assistentes (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `update:assistant` - Editar assistentes (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `delete:assistant` - Remover assistentes (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `view:assistant` - Visualizar assistentes (Todos)

**Nota:** Workspace-level roles só podem **visualizar** assistentes configurados pela empresa.

### Gerenciamento de Integrações
- `manage:integrations` - Gerenciar todas as integrações (PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN)
- `connect:whatsapp` - Conectar/desconectar WhatsApp (Todos workspace-level roles)
- `view:integrations` - Visualizar status de integrações (Todos)

**Modelo de Integração Evolux:**
- **Company level:** Configura credenciais e parâmetros da integração
- **Workspace level:** Apenas conecta/desconecta conta WhatsApp específica

### Gerenciamento de Deals
- `create:deal` - Criar deals
- `update:deal` - Editar deals
- `delete:deal` - Remover deals
- `view:deal` - Visualizar deals
- `view:all-deals` - Visualizar todos os deals do workspace
- `view:team-deals` - Visualizar deals da equipe
- `view:own-deals` - Visualizar apenas próprios deals
- `assign:deal` - Atribuir deals a usuários
- `move:deal` - Mover deals entre etapas

### Chat e Relatórios
- `view:chat` - Visualizar chats
- `send:message` - Enviar mensagens
- `view:workspace-reports` - Visualizar relatórios do workspace

---

## Criação de Usuários

### Fluxo de Validação Completo

```
1. canCreateUser(userRole, workspaceId)
   └─ Verifica se o usuário tem permissão para criar

2. Usuário já existe?
   └─ Valida duplicação de email

3. isValidRoleForContext(role, workspaceId)
   └─ Valida se role é compatível com contexto

4. canCreateRoleHierarchy(userRole, role)
   └─ Valida se role está abaixo na hierarquia

5. Determinar role final
   └─ Default SALES_REP para workspace-level creators

6. Criar usuário
```

### Método: canCreateUser()

```typescript
private canCreateUser(userRole: UserRole, workspaceId?: string): boolean {
  // PLATFORM_ADMIN pode criar usuários em qualquer nível
  if (userRole === UserRole.PLATFORM_ADMIN) {
    return true;
  }

  // COMPANY_OWNER e COMPANY_ADMIN podem criar usuários em sua company
  if (
    userRole === UserRole.COMPANY_OWNER ||
    userRole === UserRole.COMPANY_ADMIN
  ) {
    return true;
  }

  // WORKSPACE_OWNER, WORKSPACE_ADMIN, WORKSPACE_MANAGER podem criar usuários
  // apenas dentro do workspace (workspaceId deve ser fornecido)
  if (
    userRole === UserRole.WORKSPACE_OWNER ||
    userRole === UserRole.WORKSPACE_ADMIN ||
    userRole === UserRole.WORKSPACE_MANAGER
  ) {
    return !!workspaceId;
  }

  // Outras roles (SALES_REP) não podem criar usuários
  return false;
}
```

### Método: canCreateRoleHierarchy()

```typescript
private canCreateRoleHierarchy(
  creatorRole: UserRole,
  targetRole: UserRole,
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.PLATFORM_ADMIN]: 1,
    [UserRole.COMPANY_OWNER]: 2,
    [UserRole.COMPANY_ADMIN]: 3,
    [UserRole.WORKSPACE_OWNER]: 4,
    [UserRole.WORKSPACE_ADMIN]: 5,
    [UserRole.WORKSPACE_MANAGER]: 6,
    [UserRole.SALES_REP]: 7,
  };

  const creatorLevel = roleHierarchy[creatorRole];
  const targetLevel = roleHierarchy[targetRole];

  // Creator can only create roles with higher hierarchy level (lower number = higher in hierarchy)
  return targetLevel > creatorLevel;
}
```

---

## Validação de Contexto

### Método: isValidRoleForContext()

Valida se o role a ser criado é compatível com o contexto (presença/ausência de workspaceId):

```typescript
private isValidRoleForContext(role: UserRole, workspaceId?: string): boolean {
  const companyLevelRoles = [
    UserRole.PLATFORM_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.COMPANY_ADMIN,
  ];

  const workspaceLevelRoles = [
    UserRole.WORKSPACE_OWNER,
    UserRole.WORKSPACE_ADMIN,
    UserRole.WORKSPACE_MANAGER,
    UserRole.SALES_REP,
  ];

  // Company-level roles NÃO devem ter workspaceId
  if (companyLevelRoles.includes(role)) {
    return !workspaceId;
  }

  // Workspace-level roles DEVEM ter workspaceId
  if (workspaceLevelRoles.includes(role)) {
    return !!workspaceId;
  }

  return false;
}
```

---

## Casos de Uso

### Caso 1: Empresa Configura e Revende Workspace

**Fluxo de Configuração (Company level):**
1. **COMPANY_OWNER/ADMIN** cria novo workspace
2. **COMPANY_OWNER/ADMIN** configura pipelines customizados para o workspace
3. **COMPANY_OWNER/ADMIN** configura assistentes (agentes) para o workspace
4. **COMPANY_OWNER/ADMIN** configura integrações (Evolux, credenciais API, etc)
5. **COMPANY_OWNER/ADMIN** cria usuário **WORKSPACE_OWNER** vinculado ao workspace

**Fluxo de Operação (Workspace level):**
6. **WORKSPACE_OWNER** recebe workspace pré-configurado
7. **WORKSPACE_OWNER** conecta conta WhatsApp (Evolux)
8. **WORKSPACE_OWNER** cria vendedores (SALES_REP)
9. **SALES_REP** trabalha com deals usando pipelines e assistentes configurados

**Restrições:**
- WORKSPACE_OWNER **não pode** alterar pipelines ou assistentes
- WORKSPACE_OWNER **não pode** reconfigurar integrações
- WORKSPACE_OWNER **pode apenas** conectar/desconectar WhatsApp

### Caso 2: Empresa Usa Internamente

1. **COMPANY_OWNER** cria workspaces por departamento
2. **COMPANY_ADMIN** gerencia usuários e configurações
3. **WORKSPACE_ADMIN** gerencia cada departamento
4. **SALES_REP** trabalha com deals

### Caso 3: Gerente Supervisiona Equipe

1. **WORKSPACE_MANAGER** cria vendedores
2. **WORKSPACE_MANAGER** atribui deals aos vendedores
3. **WORKSPACE_MANAGER** visualiza performance da equipe
4. **SALES_REP** trabalha com deals atribuídos

---

## Implementação Técnica

### Schema Prisma

```prisma
enum UserRole {
  PLATFORM_ADMIN
  COMPANY_OWNER
  COMPANY_ADMIN
  WORKSPACE_OWNER
  WORKSPACE_ADMIN
  WORKSPACE_MANAGER
  SALES_REP
}

model User {
  id          String     @id @default(uuid())
  email       String     @unique
  name        String
  password    String
  role        UserRole   @default(SALES_REP)
  companyId   String
  workspaceId String?    // Nullable - usuários de empresa não têm workspace
  company     Company    @relation(fields: [companyId], references: [id])
  workspace   Workspace? @relation(fields: [workspaceId], references: [id])
  // ... outros campos
}
```

### Token JWT

O token JWT contém:
```typescript
{
  userId: string;
  companyId: string;
  workspaceId: string | null;
  role: UserRole;
}
```

### APIs

#### Criar Usuário (Registro Público)
```
POST /user
Body: { name, email, password }
```
- Cria nova empresa automaticamente
- Usuário recebe role `COMPANY_OWNER`
- Workspace padrão criado automaticamente

#### Adicionar Usuário a Empresa/Workspace
```
POST /user/add-to-company
Headers: { Authorization: Bearer <token> }
Body: {
  name: string,
  email: string,
  password: string,
  role: UserRole,
  workspaceId?: string  // Opcional - para usuários de workspace
}
```
- Requer permissão `create:company-user` ou `create:workspace-user`
- Se `workspaceId` fornecido, usuário é atribuído ao workspace
- Role deve ser compatível com o nível (empresa ou workspace)

#### Login
```
POST /user/session
Body: { email, password }
Response: {
  user: {
    id, name, email, companyId, workspaceId, role, defaultWorkspaceId
  },
  token
}
```

---

## Segurança

### Validações e Regras de Negócio

#### Criação de Usuários

1. **COMPANY_OWNER/ADMIN** podem criar:
   - Outros COMPANY_ADMIN
   - WORKSPACE_OWNER/ADMIN/MANAGER/SALES_REP (com workspaceId)

2. **WORKSPACE_OWNER/ADMIN** podem criar:
   - WORKSPACE_MANAGER
   - SALES_REP
   - Apenas no próprio workspace

3. **WORKSPACE_MANAGER** pode criar:
   - SALES_REP
   - Apenas no próprio workspace

#### Acesso a Deals

1. **PLATFORM_ADMIN, COMPANY_OWNER/ADMIN:** Veem todos os deals de todos os workspaces
2. **WORKSPACE_OWNER/ADMIN/MANAGER:** Veem todos os deals do workspace
3. **SALES_REP:** Vê apenas deals atribuídos a ele

#### Validação em Services

```typescript
@Injectable()
export class UpdateDealService {
  async execute(params: UpdateDealParams) {
    const deal = await this.dealRepository.getById(params.dealId);
    
    // SALES_REP só pode editar deals atribuídos a ele
    if (params.userRole === UserRole.SALES_REP) {
      if (deal.assignedUserId !== params.userId) {
        return { success: false, error: 'Unauthorized' };
      }
    }
    
    // Workspace-level roles só podem editar deals do próprio workspace
    const workspaceLevelRoles = [
      UserRole.WORKSPACE_OWNER,
      UserRole.WORKSPACE_ADMIN,
      UserRole.WORKSPACE_MANAGER,
      UserRole.SALES_REP,
    ];
    
    if (workspaceLevelRoles.includes(params.userRole)) {
      if (deal.workspaceId !== params.workspaceId) {
        return { success: false, error: 'Unauthorized' };
      }
    }
    
    // Lógica de atualização
  }
}
```

### Princípios de Segurança

1. **Token JWT:** Inclui `userId`, `companyId`, `workspaceId` e `role`
2. **Validação Dupla:** Guards verificam permissões, services validam ownership
3. **Soft Delete:** Usuários removidos não são deletados fisicamente
4. **Isolamento:** Usuários só acessam dados da própria empresa/workspace
5. **Auditoria:** Todas as ações são registradas com userId

---

## Veja também

- [Arquitetura do Projeto](./ARQUITETURA_DO_PROJETO.md)
- [WebSocket](./WEBSOCKET.md)
- [Script de Migração](./MIGRACAO_ROLES.sql)
