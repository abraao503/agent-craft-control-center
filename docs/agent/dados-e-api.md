# Dados, API e cache

## Contrato HTTP

`src/services/api.ts` centraliza Axios, o token Bearer, observabilidade e o
comportamento de sessão em `401`. Services importam `api` e retornam dados
tipados; páginas e componentes não criam clientes Axios próprios.

Antes de criar ou alterar um service:

1. Procure o domínio em `src/services/` e `src/types/`.
2. Confirme rota, payload, paginação, erros e autorização em `../api`.
3. Mantenha a conversão/normalização de payload no service quando necessária.
4. Não trate um `401` localmente como se fosse sucesso: o interceptor já
   controla a expiração de sessão.

## React Query v5

Use keys determinísticas e com todo o contexto que altera a resposta:

```tsx
const query = useQuery({
  queryKey: ["pipelines", companyId, workspaceId],
  queryFn: () => listPipelines({ companyId, workspaceId }),
  enabled: Boolean(companyId && workspaceId),
});
```

Após uma mutation, invalide a menor chave que cubra todos os consumidores
afetados. Uma alteração de workspace pode exigir listas, detalhes da empresa e
o estado selecionado; siga [Autorização e tenancy](autorizacao-e-tenancy.md).

```tsx
const mutation = useMutation({
  mutationFn: updatePipeline,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["pipelines", companyId] });
    toast({ title: "Pipeline atualizado" });
  },
  onError: (error: unknown) => {
    toast({ title: "Não foi possível atualizar", variant: "destructive" });
  },
});
```

Para paginação com retenção visual dos dados anteriores, use:

```tsx
placeholderData: (previousData) => previousData
```

Não use `keepPreviousData: true`, nem `onSuccess`/`onError` em `useQuery`:
esses padrões pertencem a versões anteriores da biblioteca. Callbacks são
apropriados para `useMutation`; efeitos derivados de uma query devem usar o
estado retornado ou `useEffect` quando realmente necessários.

## Paginação e tipos

Não presuma que todos os endpoints usam `offset`, página zero ou o mesmo
formato de resposta. O backend normalmente usa `page`/`limit`, com `page`
iniciando em 1 e resposta `items`, `total`, `page`, `limit`, `totalPages`, mas
o service deve refletir o contrato específico confirmado na API.

Tipos devem expressar a resposta real. Não reutilize um type de tela como
payload HTTP quando ele inclui estado transitório, rótulos ou campos derivados.

## Estados obrigatórios

Toda leitura remota deve lidar de forma adequada com carregamento, erro, vazio
e sucesso. Toda mutation deve impedir envio duplicado enquanto pendente,
notificar o usuário e atualizar/invalidate o cache necessário. Erros vindos da
API devem ser apresentados de forma segura; não exponha payloads, tokens ou
detalhes internos em toast ou console.
