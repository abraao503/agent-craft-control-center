# agent-craft-control-center

Painel de controle de agentes IA.

## Documentação e trabalho assistido por agentes

- [`AGENTS.md`](AGENTS.md) contém as regras operacionais do frontend.
- [`docs/agent/README.md`](docs/agent/README.md) é a documentação atual,
  organizada por arquitetura, dados, tenancy, UI e domínios.
- Os demais arquivos Markdown em `docs/` são legado e devem ser confirmados
  contra o código e a API antes de orientar uma implementação.

## Stack

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- Highlight.run para monitoramento de erros e session replay

## Desenvolvimento

```sh
npm install
npm run dev
```

## Deploy

Build de produção:

```sh
npm run build
```

## Monitoramento e Error Tracking

O projeto usa Highlight.run para session replay e rastreamento de erros:

- Captura erros front-end e reporta ao dashboard do Highlight
- Grava sessões de usuário para debug em produção
- Roda apenas em produção (controlado por `VITE_HIGHLIGHT_ENABLED`)
- Inclui error boundary customizado para erros React
- Rastreia erros de validação de formulários com contexto detalhado

### Rastreamento de Erros em Formulários

Para adicionar rastreamento a um formulário, envolva-o com o componente `FormErrorTracker`:

```tsx
<FormErrorTracker
  form={form}
  formId="your-form-id"
  formName="Nome do Formulário"
  contextInfo={{ /* contexto adicional */ }}
>
  <Form {...form}>
    {/* campos do formulário */}
  </Form>
</FormErrorTracker>
```

Dashboard do Highlight: [app.highlight.io](https://app.highlight.io) — project ID: `mem5yojg`.

Em desenvolvimento, o Highlight está desabilitado por padrão. Para habilitar, defina `VITE_HIGHLIGHT_ENABLED=true` no `.env.development`.
