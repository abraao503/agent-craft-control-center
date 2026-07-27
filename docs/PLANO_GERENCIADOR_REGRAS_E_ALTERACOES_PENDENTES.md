# Gerenciador de regras e proteção de alterações pendentes

## Objetivo

Substituir o editor expansível de regras por um modal de gerenciamento e evitar
perda de alterações na tela de criar e editar funis.

## Gerenciador de regras

- Manter no card da etapa somente o toggle de automação e o botão
  **Gerenciar regras**, com a quantidade configurada.
- Abrir um modal amplo, com rolagem interna e duas colunas:
  - à esquerda, botão **Nova regra** e a lista de regras salvas;
  - à direita, o formulário da regra selecionada.
- Cada item da lista deve mostrar destino e quantidade de condições.
- **Nova regra** abre um rascunho no painel direito e só a adiciona à lista
  após **Salvar regra**.
- **Salvar regra** atualiza o rascunho do funil apenas no frontend. A
  persistência no backend continua exclusiva do botão principal da página.
- Ao trocar de regra, criar outra regra ou fechar o modal com alterações
  pendentes, mostrar confirmação para salvar, descartar ou continuar editando.
- Usar o AlertDialog padrão para excluir regras.
- Manter a área “Refinar regra” oculta e comentada para possível uso futuro.

## Condições

- Apresentar condições como uma lista estruturada: campo de texto, botão para
  adicionar e remoção individual.
- Explicar que cada condição é um fato observável na conversa, por exemplo
  “Cliente solicitou uma proposta”.
- Exigir etapa de destino e ao menos uma condição para habilitar o salvamento,
  conforme o contrato atual da API.

## Proteção de alterações não salvas

- Implementar um contexto de alterações pendentes usado inicialmente somente
  pelas telas de criar e editar funis.
- Marcar alterações em nome, etapas, automação, regras, agente e configurações.
- Não marcar alterações durante a carga inicial dos dados.
- Limpar o estado pendente após salvar com sucesso.
- Interceptar links da sidebar e ações de voltar/cancelar da página com um
  AlertDialog: continuar editando ou descartar alterações.
- Registrar beforeunload enquanto houver alterações pendentes para proteger
  recarregamento, fechamento de aba e saída pelo navegador.

## Verificação

- Criar, salvar, cancelar e trocar regras.
- Validar a confirmação ao fechar/trocar com uma regra em edição.
- Validar navegação por sidebar, voltar, cancelar e recarregamento com
  alterações pendentes.
- Salvar o funil e confirmar que não há aviso após o sucesso.
- Executar Prettier, ESLint, build do frontend e git diff --check.
