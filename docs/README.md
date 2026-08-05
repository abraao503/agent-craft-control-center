# Documentação do frontend

## Fonte atual

Para implementação humana ou assistida por agentes, comece em
[Documentação atual para agentes](agent/README.md). Ela é dividida por assunto,
verificada contra a estrutura atual do projeto e complementada por
[`../AGENTS.md`](../AGENTS.md).

## Legado

Os arquivos abaixo são registros históricos. Eles preservam decisões e regras
de domínio, mas podem conter rotas inexistentes, exemplos de React Query v4 ou
referências de arquivos removidos. Não os use como instrução normativa sem
confirmar no código e no contrato da API.

- [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md)
- [FEATURE_DEAL_FOLLOW_UP.md](FEATURE_DEAL_FOLLOW_UP.md)
- [GERENCIAMENTO_WORKSPACE_DINAMICO.md](GERENCIAMENTO_WORKSPACE_DINAMICO.md)
- [REGRAS_CRIACAO_USUARIOS.md](REGRAS_CRIACAO_USUARIOS.md)
- [REGRAS_CRIACAO_WORKSPACE.md](REGRAS_CRIACAO_WORKSPACE.md)
- [Sistema de roles e permissões](api/SISTEMA_ROLES_PERMISSOES.md)

Planos de trabalho em andamento não são documentação normativa e permanecem
fora desta lista.

## Como manter esta documentação

Atualize o guia temático atual junto com uma mudança que altere convenção,
contrato, permissão ou fluxo transversal. Registros pontuais de implementação
devem ir para legado ou para a documentação do domínio, nunca transformar um
guia de agentes em changelog.
