# Gerenciamento Dinâmico de Workspaces

> **Legado.** Consulte [`docs/agent/autorizacao-e-tenancy.md`](agent/autorizacao-e-tenancy.md)
> para regras atuais e confirme `WorkspaceContext`, sidebar e contracts antes
> de implementar mudanças.

## Visão Geral

Este documento descreve o comportamento dinâmico do sistema de workspaces quando ocorrem operações de criação, edição e exclusão.

## Comportamentos Implementados

### 1. Criação de Workspace

#### Comportamento
Quando um workspace é criado:

1. **Invalidação de Queries**: As seguintes queries são invalidadas para atualizar as listas:
   - `["workspaces"]` - Lista de workspaces na sidebar
   - `["companyDetails"]` - Detalhes da empresa
   - `["companies"]` - Lista de empresas (para PLATFORM_ADMIN)

2. **Seleção Automática**: 
   - Se o workspace criado pertence à **mesma empresa** do usuário logado, ele é automaticamente selecionado
   - Se criado por PLATFORM_ADMIN em **outra empresa**, não interfere no workspace atual

3. **Atualização da Listagem**:
   - O novo workspace aparece automaticamente no seletor da sidebar
   - O novo workspace aparece nas listas de workspaces das páginas de administração

#### Código Relevante
```typescript
// CreateWorkspaceDialog.tsx
const createMutation = useMutation({
  mutationFn: createWorkspace,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    queryClient.invalidateQueries({ queryKey: ["companyDetails"] });
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    // ...
  },
});

// Sidebar.tsx - useWorkspace hook
const createWorkspaceMutation = useMutation({
  mutationFn: createWorkspace,
  onSuccess: (newWorkspace) => {
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    
    // Seleciona automaticamente se for da mesma empresa
    if (newWorkspace.companyId === user?.companyId) {
      setCurrentWorkspace(newWorkspace);
    }
  },
});
```

---

### 2. Edição de Workspace

#### Comportamento
Quando um workspace é editado (nome alterado):

1. **Invalidação de Queries**: As seguintes queries são invalidadas:
   - `["workspaces"]` - Para atualizar a lista na sidebar
   - `["companyDetails"]` - Para atualizar nas páginas de administração

2. **Atualização em Tempo Real**:
   - Se o workspace editado é o **atual**, o nome é atualizado automaticamente
   - Não interfere se for workspace de outra empresa (PLATFORM_ADMIN)

3. **Sincronização**:
   - O hook `useWorkspace` detecta mudanças no nome e atualiza o workspace selecionado
   - Mantém a seleção do mesmo workspace, apenas atualiza os dados

#### Código Relevante
```typescript
// EditWorkspaceDialog.tsx
const mutation = useMutation({
  mutationFn: updateWorkspace,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    queryClient.invalidateQueries({ queryKey: ["companyDetails"] });
    // ...
  },
});

// Sidebar.tsx - useWorkspace hook
useEffect(() => {
  if (workspaces && workspaces.length > 0 && currentWorkspace) {
    // Atualiza os dados do workspace atual (caso o nome tenha sido editado)
    const updatedWorkspace = workspaces.find(
      (w) => w.id === currentWorkspace.id
    );
    if (
      updatedWorkspace &&
      updatedWorkspace.name !== currentWorkspace.name
    ) {
      setCurrentWorkspace(updatedWorkspace);
    }
  }
}, [workspaces, currentWorkspace, setCurrentWorkspace]);
```

---

### 3. Exclusão de Workspace

#### Comportamento Básico
Quando um workspace é deletado:

1. **Invalidação de Queries**: As seguintes queries são invalidadas:
   - `["workspaces"]` - Para atualizar a lista na sidebar
   - `["companyDetails"]` - Para atualizar nas páginas de administração

2. **Remoção da Listagem**:
   - O workspace deletado desaparece automaticamente do seletor
   - As listas nas páginas de administração são atualizadas

#### Comportamento Especial: Deletando o Workspace Atual

Quando o usuário deleta o workspace em que está trabalhando:

1. **Detecção**:
   - O sistema verifica se `currentWorkspace.id === workspace.id`
   - E se `currentWorkspace.companyId === user.companyId` (mesma empresa)

2. **Aviso ao Usuário**:
   - Exibe um alerta no dialog de confirmação:
   ```
   ⚠️ Você está deletando o workspace atual. Após a exclusão, você
   será redirecionado para o workspace padrão.
   ```

3. **Redirecionamento Automático**:
   - Após a exclusão bem-sucedida, busca o workspace padrão (`isDefault: true`)
   - Seleciona automaticamente o workspace padrão
   - Mostra um toast informativo:
   ```
   Workspace deletado
   Você foi redirecionado para o workspace padrão "Nome do Workspace".
   ```

4. **Invalidação de Dados**:
   - Todas as queries relacionadas ao workspace são invalidadas
   - Os dados são recarregados para o novo workspace selecionado

#### Comportamento para PLATFORM_ADMIN

Quando PLATFORM_ADMIN deleta workspace de outra empresa:

- **Não interfere** no workspace atual do admin
- **Não redireciona** automaticamente
- Apenas mostra mensagem de sucesso padrão
- Atualiza apenas as listas de administração

#### Código Relevante
```typescript
// DeleteWorkspaceDialog.tsx
export function DeleteWorkspaceDialog() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();

  // Verifica se está deletando o workspace atual da mesma empresa
  const isDeletingCurrentWorkspace =
    currentWorkspace?.id === workspace?.id &&
    currentWorkspace?.companyId === user?.companyId;

  const mutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: async () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["companyDetails"] });

      // Se está deletando o workspace atual da mesma empresa
      if (isDeletingCurrentWorkspace) {
        // Aguarda a lista de workspaces ser atualizada
        await queryClient.refetchQueries({ queryKey: ["workspaces"] });

        // Busca o workspace padrão
        const workspaces = queryClient.getQueryData<Workspace[]>(["workspaces"]);
        const defaultWorkspace = workspaces?.find((w) => w.isDefault);

        if (defaultWorkspace) {
          setCurrentWorkspace(defaultWorkspace);
          toast({
            title: "Workspace deletado",
            description: `Você foi redirecionado para o workspace padrão "${defaultWorkspace.name}".`,
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Workspace deletado com sucesso!",
        });
      }

      onOpenChange(false);
    },
  });
}
```

---

## Fluxo de Detecção e Atualização

### useWorkspace Hook (Sidebar)

O hook monitora continuamente a lista de workspaces e reage a mudanças:

```typescript
useEffect(() => {
  if (workspaces && workspaces.length > 0) {
    if (!currentWorkspace) {
      // Seleciona workspace padrão se não há seleção
      const defaultWorkspace =
        workspaces.find((w) => w.isDefault) || workspaces[0];
      setCurrentWorkspace(defaultWorkspace);
    } else {
      // Verifica se o workspace atual ainda existe
      const workspaceExists = workspaces.some(
        (w) => w.id === currentWorkspace.id
      );
      
      if (!workspaceExists) {
        // Workspace foi deletado - seleciona o padrão
        const defaultWorkspace =
          workspaces.find((w) => w.isDefault) || workspaces[0];
        setCurrentWorkspace(defaultWorkspace);
      } else {
        // Atualiza dados do workspace (nome editado)
        const updatedWorkspace = workspaces.find(
          (w) => w.id === currentWorkspace.id
        );
        if (
          updatedWorkspace &&
          updatedWorkspace.name !== currentWorkspace.name
        ) {
          setCurrentWorkspace(updatedWorkspace);
        }
      }
    }
  }
}, [workspaces, currentWorkspace, setCurrentWorkspace]);
```

---

## Cenários de Uso

### Cenário 1: COMPANY_OWNER cria novo workspace

1. Usuário está no workspace "Vendas"
2. Clica em "Novo Workspace" em `/company/settings`
3. Cria workspace "Marketing"
4. **Resultado**:
   - ✅ Workspace "Marketing" aparece na listagem da sidebar
   - ✅ Workspace "Marketing" é automaticamente selecionado
   - ✅ Usuário começa a trabalhar no novo workspace imediatamente

### Cenário 2: PLATFORM_ADMIN cria workspace em outra empresa

1. Admin está trabalhando na empresa "Empresa A"
2. Acessa `/admin/companies` e seleciona "Empresa B"
3. Cria workspace "Vendas" para "Empresa B"
4. **Resultado**:
   - ✅ Workspace é criado em "Empresa B"
   - ✅ Não interfere no workspace atual do admin
   - ✅ Admin continua no workspace da "Empresa A"

### Cenário 3: Usuário edita nome do workspace atual

1. Usuário está no workspace "Venda"
2. Edita o nome para "Vendas e Marketing"
3. **Resultado**:
   - ✅ Nome atualiza automaticamente na sidebar
   - ✅ Nome atualiza em todas as listas de administração
   - ✅ Workspace selecionado continua o mesmo

### Cenário 4: Usuário deleta workspace que não está usando

1. Usuário está no workspace "Vendas"
2. Deleta workspace "Marketing"
3. **Resultado**:
   - ✅ Workspace "Marketing" desaparece das listas
   - ✅ Usuário continua no workspace "Vendas"
   - ✅ Sem redirecionamento

### Cenário 5: Usuário deleta o workspace atual

1. Usuário está no workspace "Marketing"
2. Tenta deletar workspace "Marketing"
3. **Resultado**:
   - ⚠️ Aviso exibido: "Você será redirecionado para o workspace padrão"
   - ✅ Após confirmação, workspace é deletado
   - ✅ Usuário é automaticamente movido para workspace padrão
   - ✅ Toast informativo exibido
   - ✅ Dados do workspace padrão são carregados

### Cenário 6: PLATFORM_ADMIN deleta workspace de outra empresa

1. Admin está trabalhando na empresa "Empresa A"
2. Deleta workspace de "Empresa B"
3. **Resultado**:
   - ✅ Workspace deletado de "Empresa B"
   - ✅ Admin continua no workspace da "Empresa A"
   - ✅ Sem redirecionamento ou interferência

---

## Invalidação de Cache (React Query)

### Queries Invalidadas

| Operação | Queries Invalidadas | Motivo |
|----------|-------------------|---------|
| Criar Workspace | `workspaces`, `companyDetails`, `companies` | Atualizar listas em todos os lugares |
| Editar Workspace | `workspaces`, `companyDetails` | Atualizar nome em listas |
| Deletar Workspace | `workspaces`, `companyDetails` | Remover de listas |

### Refetch Automático

```typescript
// Query com refetch automático quando a janela recebe foco
const { data: workspaces } = useQuery({
  queryKey: ["workspaces"],
  queryFn: listWorkspaces,
  refetchOnWindowFocus: true, // ⚡ Garante dados atualizados
});
```

---

## Mensagens e Feedbacks

### Criação de Workspace
- ✅ Sucesso: "Workspace criado - O workspace foi criado com sucesso."

### Edição de Workspace
- ✅ Sucesso: "Sucesso - Workspace atualizado com sucesso!"
- ❌ Erro: Nome vazio, erro no servidor, etc.

### Exclusão de Workspace

#### Workspace Normal
- ✅ Sucesso: "Sucesso - Workspace deletado com sucesso!"

#### Workspace Atual (Redirecionamento)
- ✅ Sucesso: "Workspace deletado - Você foi redirecionado para o workspace padrão '[Nome]'."

#### Workspace Padrão (Bloqueado)
- ⚠️ Aviso no Dialog: "Este é o workspace padrão e não pode ser deletado."
- ❌ Botão deletar desabilitado

---

## Proteções Implementadas

1. **Workspace Padrão**: Não pode ser deletado
2. **Workspace Atual**: Aviso antes de deletar + redirecionamento automático
3. **Isolamento por Empresa**: PLATFORM_ADMIN não interfere em workspaces de outras empresas
4. **Sincronização**: Dados sempre atualizados via invalidação de queries
5. **Fallback**: Se workspace deletado, sempre redireciona para o padrão

---

## Componentes Envolvidos

1. **CreateWorkspaceDialog**: Criação de workspaces
2. **EditWorkspaceDialog**: Edição de nome
3. **DeleteWorkspaceDialog**: Exclusão com proteções
4. **Sidebar (useWorkspace hook)**: Detecção e sincronização automática
5. **WorkspaceContext**: Estado global do workspace atual

---

## Conclusão

O sistema implementa um gerenciamento dinâmico e inteligente de workspaces que:

- ✅ Reflete mudanças em tempo real
- ✅ Protege contra ações destrutivas
- ✅ Mantém o contexto do usuário
- ✅ Isola operações entre empresas diferentes
- ✅ Fornece feedback claro ao usuário
- ✅ Garante consistência de dados via React Query
