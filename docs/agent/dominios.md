# Regras de domínio preservadas

Este guia consolida conhecimento útil dos documentos anteriores. Ele não fixa
contratos: antes de alterar um fluxo, confirme os services e a API atuais.

## Follow-ups de deals

Follow-ups são mensagens WhatsApp programadas para um deal. O domínio inclui
criação, listagem e cancelamento/soft delete, com estados `PENDING`, `SENT`,
`FAILED` e `CANCELLED`.

- A criação exige título, mensagem e data futura; a data é informada no fuso
  local e enviada em ISO/UTC conforme o service.
- A listagem é vinculada ao `dealId` e sua query deve ser invalidada após criar
  ou excluir.
- Exclusão exige confirmação e deve informar claramente o resultado.
- Exiba loading, vazio, erro, status, data agendada e última tentativa quando
  forem parte da resposta.
- Falhas possíveis incluem deal inexistente, agendamento inválido/duplicado,
  integração WhatsApp ausente ou cliente sem telefone. A UI não deve tentar
  inferir a causa sem a resposta da API.

Os pontos de implementação históricos ficam em
`src/components/deals/follow-up/`, `src/services/deal/dealFollowUp.ts` e
`src/types/deal-follow-up.ts`; confirme se continuam sendo os pontos ativos.

## Administração de usuários

Ao criar usuário, preserve três validações independentes: permissão do
criador, hierarquia de role e compatibilidade do contexto (empresa versus
workspace). Email duplicado e ownership pertencem à API. A interface deve
oferecer apenas roles possíveis para o contexto, mas não substituir a validação
do servidor.

## Administração de workspaces

Criação, edição e exclusão precisam manter sincronizados sidebar, dados da
empresa e listas administrativas. Os comportamentos obrigatórios de seleção e
fallback estão em [Autorização e tenancy](autorizacao-e-tenancy.md).
