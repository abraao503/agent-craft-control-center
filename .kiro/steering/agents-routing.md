---
inclusion: auto
---

# AGENTS.md — Roteamento obrigatório

Você está no subprojeto `front/` (painel React/Vite). Antes de qualquer alteração:

1. Leia [`front/AGENTS.md`](../../AGENTS.md) — padrões técnicos deste repositório.
2. Leia [`7agentes/AGENTS.md`](../../../AGENTS.md) — regras globais do workspace.

O `AGENTS.md` mais próximo do arquivo alterado **prevalece** sobre os de nível superior.

## Leitura dirigida por escopo

| Se a mudança envolve                                  | Leia também                        |
|-------------------------------------------------------|------------------------------------|
| Estrutura, rota ou provider                           | `docs/agent/arquitetura.md`        |
| Endpoint, type, cache ou mutation                     | `docs/agent/dados-e-api.md`        |
| Role, workspace, empresa ou usuário                   | `docs/agent/autorizacao-e-tenancy.md` |
| Formulário, UI, toast, socket ou acessibilidade       | `docs/agent/ui-e-tempo-real.md`    |
| Follow-up ou comportamento de domínio documentado     | `docs/agent/dominios.md`           |

Antes de uma mudança ampla, consulte também `docs/DESENVOLVIMENTO.md`.

## Repositório independente

`front/` não compartilha dependências, lockfiles ou comandos com `api/`. Não
confirme endpoints, payloads ou tipos a partir de documentos: verifique o
contrato atual em `../api` (e Swagger quando disponível).

## Verificação proporcional

Execute sempre a partir de `front/`:

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run build
```

Use `npm run typecheck` (não `tsc --noEmit` direto): o `tsconfig.json` raiz usa
project references e requer `tsc -b`.

Não há testes automatizados configurados. Para mudanças de interface, valide
manualmente o fluxo relevante quando o ambiente estiver disponível.
