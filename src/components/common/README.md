# Componentes Comuns Reutilizáveis

Esta pasta contém componentes genéricos e reutilizáveis que podem ser usados em múltiplas partes da aplicação.

---

## 📄 SmartPagination

Componente de paginação inteligente que lida automaticamente com grandes quantidades de páginas usando truncamento com reticências (...).

### Características

✅ **Truncamento Inteligente** - Mostra apenas páginas relevantes  
✅ **Primeira/Última Sempre Visíveis** - Acesso rápido aos extremos  
✅ **Página Atual Destacada** - Visual claro da posição atual  
✅ **Contador de Itens Opcional** - "Mostrando X a Y de Z itens"  
✅ **Totalmente Customizável** - Props para ajustar comportamento  
✅ **Acessível** - Componentes Radix UI

### Uso Básico

```tsx
import { SmartPagination } from "@/components/common/SmartPagination";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

function MyListPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 10;

  const { data } = useQuery({
    queryKey: ["items", currentPage],
    queryFn: () => listItems({ 
      limit, 
      offset: currentPage * limit 
    }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      {/* Sua lista de itens */}
      <div>
        {data?.items.map(item => (
          <ItemCard key={item.id} {...item} />
        ))}
      </div>

      {/* Paginação */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
```

### Uso Completo (com contador)

```tsx
<SmartPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showItemCount
  itemsPerPage={10}
  totalItems={data?.total || 0}
  itemLabel="empresas"
  siblingCount={2}
/>
```

### Props

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `currentPage` | `number` | ✅ | - | Página atual (0-indexed) |
| `totalPages` | `number` | ✅ | - | Total de páginas disponíveis |
| `onPageChange` | `(page: number) => void` | ✅ | - | Callback quando usuário muda de página |
| `siblingCount` | `number` | ❌ | `2` | Quantas páginas mostrar antes/depois da atual |
| `showItemCount` | `boolean` | ❌ | `false` | Mostrar contador "Mostrando X a Y de Z" |
| `itemsPerPage` | `number` | ❌ | `10` | Itens por página (para cálculo do contador) |
| `totalItems` | `number` | ❌ | `0` | Total de itens (para o contador) |
| `itemLabel` | `string` | ❌ | `"itens"` | Label customizado (ex: "empresas", "usuários") |

### Padrões de Exibição

O componente adapta a visualização baseado na quantidade de páginas e posição atual:

#### Poucas páginas (≤7)
```
← 1 2 3 4 5 6 7 →
```
Mostra todas as páginas.

#### Navegando no início
```
← 1 2 3 4 5 ... 20 →
```
Primeira página + páginas próximas + ... + última página.

#### Navegando no meio
```
← 1 ... 8 9 10 11 12 ... 20 →
```
Primeira + ... + páginas ao redor + ... + última.

#### Navegando no final
```
← 1 ... 16 17 18 19 20 →
```
Primeira + ... + páginas finais + última página.

### Exemplos Completos

#### Lista de Empresas

```tsx
import { SmartPagination } from "@/components/common/SmartPagination";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCompanies } from "@/services/company/listCompanies";

export default function AdminCompaniesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["companies", currentPage],
    queryFn: () => listCompanies({
      limit,
      offset: currentPage * limit,
    }),
  });

  if (isLoading) return <Loader />;

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6 p-6">
      <h1>Gerenciar Empresas</h1>

      {/* Tabela */}
      <Table>
        {/* ... conteúdo da tabela ... */}
      </Table>

      {/* Paginação */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showItemCount
        itemsPerPage={limit}
        totalItems={data.total}
        itemLabel="empresas"
      />
    </div>
  );
}
```

#### Lista de Usuários do Workspace

```tsx
function WorkspaceUsersTab({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data } = useQuery({
    queryKey: ["workspace-users", workspaceId, page],
    queryFn: () => listUsers({ workspaceId, page, limit }),
  });

  return (
    <>
      <div className="space-y-2">
        {data?.users.map(user => (
          <UserCard key={user.id} {...user} />
        ))}
      </div>

      <SmartPagination
        currentPage={page}
        totalPages={data?.totalPages || 0}
        onPageChange={setPage}
        showItemCount
        itemsPerPage={limit}
        totalItems={data?.total || 0}
        itemLabel="usuários"
      />
    </>
  );
}
```

### Integração com React Query

O componente funciona perfeitamente com React Query. Basta:

1. Usar a página atual no `queryKey`
2. Passar offset correto para a API
3. Calcular `totalPages` a partir do `data.total`

```tsx
const { data } = useQuery({
  queryKey: ["resource", currentPage], // ← Página no queryKey
  queryFn: () => fetchResource({
    limit: 10,
    offset: currentPage * 10, // ← Offset calculado
  }),
});

const totalPages = Math.ceil(data.total / 10); // ← Total de páginas
```

### Customização Visual

O componente usa os componentes base do Shadcn/UI (`Pagination`, `PaginationLink`, etc.), então herda automaticamente o tema da aplicação.

Para customizar estilos específicos, você pode:

1. **Modificar o tema global** em `tailwind.config.ts`
2. **Wrapper com className** personalizado:

```tsx
<div className="custom-pagination">
  <SmartPagination {...props} />
</div>
```

### Acessibilidade

- ✅ Navegação por teclado (Tab, Enter)
- ✅ ARIA labels nos botões
- ✅ Estados disabled visualmente claros
- ✅ Página atual semanticamente marcada

### Boas Práticas

#### ✅ DO - Use quando:
- Listando recursos paginados da API
- Mais de 10 itens no total
- Usuário precisa navegar entre páginas

#### ✅ DO - Combine com:
- React Query para cache automático
- Loading states enquanto carrega
- Empty states quando não há dados

#### ❌ DON'T - Evite quando:
- Poucos itens (< 10) - mostre todos
- Infinite scroll é mais apropriado
- Dados não são paginados no backend

### Troubleshooting

#### Paginação não aparece
- ✅ Verifique se `totalPages > 1`
- ✅ O componente retorna `null` automaticamente se houver apenas 1 página

#### Contador de itens errado
- ✅ Verifique se `showItemCount={true}`
- ✅ Confirme que `itemsPerPage` e `totalItems` estão corretos
- ✅ Lembre que `currentPage` é 0-indexed

#### Páginas não mudam
- ✅ Verifique se `onPageChange` está atualizando o state
- ✅ Confirme que o `queryKey` inclui `currentPage`

### Performance

- 🚀 **Renderização Otimizada** - Apenas páginas visíveis são renderizadas
- 🚀 **Zero Re-renders Desnecessários** - Props estáveis
- 🚀 **Cache Automático** - React Query mantém dados anteriores

### Changelog

**v1.0.0** (Novembro 2024)
- ✨ Lançamento inicial
- ✨ Truncamento inteligente com reticências
- ✨ Contador de itens opcional
- ✨ Totalmente tipado com TypeScript

---

## Adicionar Novos Componentes

Ao criar novos componentes reutilizáveis nesta pasta:

1. **Crie o arquivo do componente**
   ```tsx
   // MyComponent.tsx
   interface MyComponentProps {
     // ...
   }

   export function MyComponent(props: MyComponentProps) {
     // ...
   }
   ```

2. **Documente no README.md** (este arquivo)
   - Propósito
   - Props
   - Exemplos de uso
   - Boas práticas

3. **Exporte se necessário**
   ```tsx
   // index.ts
   export { SmartPagination } from "./SmartPagination";
   export { MyComponent } from "./MyComponent";
   ```

---

**Mantido por:** Equipe de Desenvolvimento  
**Última Atualização:** Novembro 2024
