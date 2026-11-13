# Padrões de telas

Use este guia ao criar ou ajustar páginas de consulta e configuração do
frontend. Ele define a hierarquia do cabeçalho, a navegação e os tamanhos
visuais compartilhados; o conteúdo de cada domínio continua específico.

## Composição da página

- Mantenha páginas de conteúdo dentro do shell de `src/App.tsx`, com contêiner
  central `mx-auto w-full max-w-6xl space-y-6`.
- Nas rotas de Operação, use `OperationPageHeader` para manter um único H1,
  kicker, descrição, breadcrumb e ações alinhados.
- Na página raiz de uma seção, omita o breadcrumb. Em páginas filhas, use o
  rótulo da seção como pai e o rótulo de navegação da página atual como folha.
  Para páginas operacionais, o pai é `Operação` com destino `/operation`.
- Trate breadcrumb como navegação entre níveis. Use um link com seta de retorno
  em telas de detalhe ou fluxos que realmente voltam a uma etapa anterior.
- Use o kicker para identificar a seção: `Visão geral da operação` na raiz e
  `Configuração operacional` nas páginas filhas de Operação.

## Hierarquia visual

- H1: 24/32 px em viewport estreita e 30/36 px a partir do breakpoint `sm`,
  peso 600.
- Kicker: 12/16 px, peso 600, caixa alta, tracking `0.16em` e cor `primary`.
- Título de seção (H2): 20/28 px, peso 600.
- Título de card: 18/28 px, peso 600. Use 16/24 px para títulos compactos de
  controles dentro de cards.
- Descrição e texto auxiliar: 14/20 px, peso regular, cor `muted-foreground`.
- Rótulos pequenos e metadados: 12/16 px; use peso e cor para comunicar estado
  sem competir com o título da página.

## Ações e divisores

- Use a variante padrão de `Button` para ações do cabeçalho: altura 40 px,
  texto 14/20 px e peso 500. Mantenha botões de ícone em 36 × 36 px e filtros
  compactos em 36 px de altura.
- Agrupe ações no lado oposto ao título em desktop. Em viewport estreita,
  empilhe o grupo e permita ações principais de largura total.
- Termine o cabeçalho compartilhado com uma borda `border-border` e `pb-6`.
  Use o mesmo componente também quando a página não tiver ação no cabeçalho.
- Mantenha cores por tokens semânticos (`primary`, `foreground`, `background`,
  `border`, `muted-foreground`). Reserve cores de estado para estados como
  ativo, pausado, pronto, aviso e erro.

## Responsividade e acessibilidade

- Deixe título, descrição e ações empilharem sem sobreposição em telas estreitas.
- Use links para navegação e botões para ações; botões de ícone precisam de
  `aria-label`.
- Preserve um único H1 por página e use H2/H3 conforme a hierarquia do
  conteúdo. Mantenha foco visível, estados desabilitados e rótulos associados.
- Mantenha estados de carregamento, erro, vazio e dados visíveis dentro do
  conteúdo da página, sem substituir ou deslocar a estrutura do cabeçalho.

Páginas com fluxo especializado podem compor o conteúdo de forma própria,
mantendo a escala tipográfica, os tokens e os padrões de navegação deste guia.
