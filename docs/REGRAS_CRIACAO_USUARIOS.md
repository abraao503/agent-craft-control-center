# Regras de Criação de Usuários

## Validações Implementadas

### 1. Hierarquia de Roles

Os usuários só podem criar outros usuários de **nível inferior** na hierarquia:

```
1. PLATFORM_ADMIN      (Nível 1 - Mais alto)
   └─ Pode criar: Todos abaixo

2. COMPANY_OWNER       (Nível 2)
   └─ Pode criar: COMPANY_ADMIN, WORKSPACE_*, SALES_REP
   └─ NÃO pode criar: PLATFORM_ADMIN, COMPANY_OWNER

3. COMPANY_ADMIN       (Nível 3)
   └─ Pode criar: WORKSPACE_*, SALES_REP
   └─ NÃO pode criar: PLATFORM_ADMIN, COMPANY_OWNER, COMPANY_ADMIN

4. WORKSPACE_OWNER     (Nível 4)
   └─ Pode criar: WORKSPACE_ADMIN, WORKSPACE_MANAGER, SALES_REP
   └─ NÃO pode criar: PLATFORM_ADMIN, COMPANY_*, WORKSPACE_OWNER

5. WORKSPACE_ADMIN     (Nível 5)
   └─ Pode criar: WORKSPACE_MANAGER, SALES_REP
   └─ NÃO pode criar: Todos os níveis acima

6. WORKSPACE_MANAGER   (Nível 6)
   └─ Pode criar: SALES_REP
   └─ NÃO pode criar: Todos os níveis acima

7. SALES_REP           (Nível 7 - Mais baixo)
   └─ NÃO pode criar: Ninguém
```

### 2. Unicidade de Owners

#### COMPANY_OWNER
- ✅ **Apenas 1 por empresa**
- Tentativa de criar segundo COMPANY_OWNER resulta em erro
- Frontend valida antes de enviar ao backend
- Mensagem: "Já existe um dono para esta Empresa"

#### WORKSPACE_OWNER
- ✅ **Apenas 1 por workspace**
- Tentativa de criar segundo WORKSPACE_OWNER resulta em erro
- Frontend valida antes de enviar ao backend
- Mensagem: "Já existe um dono para este Workspace"

### 3. Implementação no Frontend

#### Componente: CreateCompanyUserDialog

**Validações automáticas:**
1. Filtra roles disponíveis baseado no role do usuário atual
2. Verifica hierarquia antes de permitir seleção
3. Consulta API para verificar se Owner já existe
4. Desabilita opção de Owner se já existir
5. Mostra indicador visual "(já existe)" na lista

**Código relevante:**
```typescript
// Hierarquia definida
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PLATFORM_ADMIN]: 1,
  [UserRole.COMPANY_OWNER]: 2,
  [UserRole.COMPANY_ADMIN]: 3,
  [UserRole.WORKSPACE_OWNER]: 4,
  [UserRole.WORKSPACE_ADMIN]: 5,
  [UserRole.WORKSPACE_MANAGER]: 6,
  [UserRole.SALES_REP]: 7,
};

// Filtragem de roles disponíveis
const getAvailableRoles = () => {
  const baseRoles = isWorkspaceContext
    ? WORKSPACE_LEVEL_ROLES
    : COMPANY_LEVEL_ROLES;
  
  if (!currentUserRole) return baseRoles;
  
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  
  // Apenas roles com nível maior (menor privilégio)
  return baseRoles.filter(role => {
    const targetLevel = ROLE_HIERARCHY[role];
    return targetLevel > currentLevel;
  });
};
```

### 4. Serviço de Validação

#### checkOwnerExists

**Localização:** `src/services/user/checkOwnerExists.ts`

**Parâmetros:**
```typescript
{
  companyId?: string;  // Para verificar COMPANY_OWNER
  workspaceId?: string; // Para verificar WORKSPACE_OWNER
}
```

**Resposta:**
```typescript
{
  exists: boolean;      // Se owner já existe
  ownerName?: string;   // Nome do owner existente (opcional)
}
```

**Uso:**
```typescript
const { data: ownerCheck } = useQuery({
  queryKey: ["checkOwner", companyId, workspaceId, formData.role],
  queryFn: () => {
    if (formData.role === UserRole.COMPANY_OWNER && !isWorkspaceContext) {
      return checkOwnerExists({ companyId });
    } else if (formData.role === UserRole.WORKSPACE_OWNER && isWorkspaceContext) {
      return checkOwnerExists({ workspaceId });
    }
    return Promise.resolve({ exists: false });
  },
  enabled: formData.role === UserRole.COMPANY_OWNER || 
           formData.role === UserRole.WORKSPACE_OWNER,
});
```

### 5. Validações no Submit

Ordem de validações ao submeter formulário:

1. ✅ Campos obrigatórios preenchidos
2. ✅ Senha com mínimo 8 caracteres
3. ✅ Hierarquia respeitada (não pode criar nível igual ou superior)
4. ✅ Owner único (se aplicável)
5. ✅ Envio ao backend

```typescript
// Validação de hierarquia
if (currentUserRole && formData.role) {
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  const targetLevel = ROLE_HIERARCHY[formData.role as UserRole];
  
  if (targetLevel <= currentLevel) {
    toast({
      title: "Erro",
      description: "Você só pode criar usuários de nível inferior ao seu.",
      variant: "destructive",
    });
    return;
  }
}

// Validação de Owner único
if (ownerCheck?.exists) {
  const ownerType = isWorkspaceContext ? "Workspace" : "Empresa";
  toast({
    title: "Erro",
    description: `Já existe um dono para este ${ownerType}.`,
    variant: "destructive",
  });
  return;
}
```

## UX - Experiência do Usuário

### Feedback Visual

1. **Roles desabilitados:** Se Owner já existe, opção aparece desabilitada no select
2. **Indicador visual:** Texto "(já existe)" ao lado do role desabilitado
3. **Lista vazia:** Se não há roles disponíveis, mostra mensagem explicativa
4. **Erros claros:** Mensagens específicas para cada tipo de erro

### Mensagens de Erro

| Situação | Mensagem |
|----------|----------|
| Tentar criar role igual/superior | "Você só pode criar usuários de nível inferior ao seu." |
| Tentar criar segundo COMPANY_OWNER | "Já existe um dono para esta Empresa: [Nome]." |
| Tentar criar segundo WORKSPACE_OWNER | "Já existe um dono para este Workspace: [Nome]." |
| Sem roles disponíveis | "Você não tem permissão para criar usuários de nível inferior." |

## Integração Backend

### Endpoint Necessário

O backend deve implementar o endpoint:

```
GET /user/check-owner
Query params: companyId OR workspaceId
Response: { exists: boolean, ownerName?: string }
```

**Lógica esperada:**
- Se `companyId` fornecido: busca usuário com role COMPANY_OWNER naquela empresa
- Se `workspaceId` fornecido: busca usuário com role WORKSPACE_OWNER naquele workspace
- Retorna `exists: true` se encontrar, opcionalmente com nome do owner

### Validação Adicional no Backend

Embora o frontend valide, o backend **DEVE** também validar:

1. ✅ Hierarquia de roles na criação
2. ✅ Unicidade de COMPANY_OWNER por empresa
3. ✅ Unicidade de WORKSPACE_OWNER por workspace
4. ✅ Permissões do usuário que está criando

## Casos de Teste

### Teste 1: Hierarquia Respeitada
- **Given:** Usuário COMPANY_ADMIN logado
- **When:** Tenta criar COMPANY_OWNER
- **Then:** Role não aparece na lista de opções

### Teste 2: Owner Único - Empresa
- **Given:** Empresa já tem COMPANY_OWNER
- **When:** PLATFORM_ADMIN tenta criar outro COMPANY_OWNER
- **Then:** Opção aparece desabilitada com "(já existe)"

### Teste 3: Owner Único - Workspace
- **Given:** Workspace já tem WORKSPACE_OWNER
- **When:** COMPANY_OWNER tenta criar outro WORKSPACE_OWNER
- **Then:** Erro ao tentar submeter

### Teste 4: Sem Permissão
- **Given:** Usuário SALES_REP logado
- **When:** Acessa diálogo de criar usuário
- **Then:** Lista de roles vazia com mensagem explicativa

## Segurança

### Camadas de Proteção

1. **UI:** Select não mostra options inválidas
2. **Frontend:** Validação antes de enviar
3. **Backend:** Validação definitiva no servidor
4. **Database:** Constraints únicos (recomendado)

### Recomendações Backend

```sql
-- Constraint para garantir unicidade de COMPANY_OWNER
CREATE UNIQUE INDEX idx_unique_company_owner 
ON users (company_id) 
WHERE role = 'COMPANY_OWNER';

-- Constraint para garantir unicidade de WORKSPACE_OWNER
CREATE UNIQUE INDEX idx_unique_workspace_owner 
ON users (workspace_id) 
WHERE role = 'WORKSPACE_OWNER';
```

## Manutenção

### Adicionar Novo Role

1. Adicionar em `UserRole` enum
2. Adicionar em `ROLE_LABELS`
3. Adicionar em `ROLE_HIERARCHY` com nível apropriado
4. Adicionar em `COMPANY_LEVEL_ROLES` ou `WORKSPACE_LEVEL_ROLES`
5. Atualizar documentação

### Modificar Hierarquia

1. Ajustar números em `ROLE_HIERARCHY`
2. Testar todas as combinações de criação
3. Atualizar documentação
4. Comunicar mudanças ao time
