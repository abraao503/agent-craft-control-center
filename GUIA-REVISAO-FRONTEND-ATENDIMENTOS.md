# Guia de Revisão Front-end — Módulo de Atendimentos

## Objetivo

Este documento orienta a revisão e evolução **exclusivamente do front-end** do módulo de Atendimentos do 7 Agentes.

A referência de produto é o padrão adotado por plataformas maduras de atendimento como Zendesk, Intercom, Freshdesk, Front, Help Scout e Octadesk, mas a implementação deve respeitar o que já existe no projeto.

O agente responsável deve:

1. Ler o código atual antes de propor alterações.
2. Confirmar quais sugestões deste documento já são atendidas pela implementação.
3. Identificar quais melhorias podem ser feitas **somente no front-end**.
4. Não alterar contratos de API, regras de negócio, banco de dados, filas, distribuição ou estrutura do backend.
5. Reutilizar estados, dados, endpoints, componentes, design tokens e padrões já existentes sempre que possível.
6. Caso uma melhoria dependa de backend, registrá-la apenas como **fora de escopo**, sem implementá-la.

---

# 1. Escopo obrigatório

## Permitido

- Layout.
- Hierarquia visual.
- Organização de informações.
- Textos e nomenclaturas exibidas ao usuário.
- Componentização.
- Responsividade.
- Densidade da interface.
- Estados visuais.
- Feedbacks de interação.
- Tooltips.
- Menus.
- Popovers.
- Drawers.
- Abas/views.
- Exibição e priorização de dados já recebidos.
- Reaproveitamento de ações já suportadas pelas APIs existentes.
- Melhorias de acessibilidade.
- Atalhos de teclado puramente front-end quando compatíveis com ações existentes.
- Persistência local de preferências de UI, se já houver infraestrutura apropriada.
- Melhorias de loading, empty state, erro e disabled state.

## Fora de escopo

Não implementar mudanças que exijam:

- novo endpoint;
- alteração de payload;
- alteração de schema;
- alteração de banco;
- nova regra de distribuição;
- alteração no algoritmo de roteamento;
- criação de SLA no backend;
- nova política de filas;
- nova capacidade por agente;
- novos estados persistidos;
- nova máquina de estados;
- WebSocket/SSE novo;
- mudança na semântica de eventos existentes;
- alteração na atribuição concorrente de atendimentos.

Se algum item deste documento depender dessas mudanças, registrar como:

> **Fora de escopo front-end: depende de suporte do backend.**

---

# 2. Princípio de produto

A estrutura atual segue um padrão correto para ferramentas de atendimento:

```text
Lista de conversas → Conversa atual → Contexto do contato
```

Esse padrão deve ser preservado.

A meta não é redesenhar completamente o produto.

A meta é:

- reduzir ruído;
- aumentar densidade útil;
- melhorar leitura da fila;
- tornar ações mais óbvias;
- reduzir duplicação;
- melhorar a hierarquia visual;
- aproximar a experiência de ferramentas maduras de atendimento.

---

# 3. Primeiro passo obrigatório: auditar a implementação existente

Antes de editar qualquer arquivo, localizar e documentar:

- página principal de Atendimentos;
- componente da lista de conversas;
- item/card de conversa;
- header da conversa;
- compositor/resposta;
- filtros;
- painel lateral de detalhes;
- componente de Follow-ups;
- tabs atuais;
- ação "Atender";
- ação "Transferir";
- estados de loading;
- empty states;
- tratamento responsivo;
- design system/tokens usados nessa área;
- store/hook/context responsável pelo estado da página.

Também verificar se já existem componentes reutilizáveis para:

- Popover;
- Dropdown;
- Drawer;
- Tooltip;
- Badge;
- Tabs;
- Segmented control;
- Resizable panel;
- Collapse;
- Command menu;
- Skeleton;
- Empty state.

Evitar criar componentes novos se o design system já possuir equivalentes.

---

# 4. Prioridade 1 — Melhorar a navegação das views/tabs

## Problema observado

Hoje existem tabs horizontais como:

```text
Todas
Triagem
Aguardando fila
Em atendimento
...
```

Em largura limitada, alguns títulos já ficam truncados.

Isso tende a piorar conforme novas categorias forem adicionadas.

## Direção recomendada

Manter poucas views primárias visíveis e mover as secundárias para um menu.

Exemplo conceitual:

```text
[ Minhas ] [ Não atribuídas ] [ Aguardando cliente ] [ Mais ▾ ]
```

ou, se a nomenclatura atual precisar ser preservada por compatibilidade:

```text
[ Todas ] [ Triagem ] [ Aguardando fila ] [ Mais ▾ ]
```

O agente deve decidir com base no código e nos estados realmente disponíveis.

## Regra importante

Não criar estados novos apenas para reproduzir esse exemplo.

Se "Não atribuídas" ou "Aguardando cliente" não existirem nos dados atuais, não inventar filtros ou regras no front.

## Critérios de aceite

- Tabs não devem truncar de forma agressiva em desktop comum.
- Não deve existir overflow horizontal pouco descobrível.
- A view ativa deve continuar evidente.
- Contadores existentes devem continuar visíveis.
- O comportamento atual de filtro deve continuar funcionando.

---

# 5. Prioridade 2 — Filtros não devem consumir a altura da lista

## Problema observado

Ao abrir "Mais filtros", o painel empurra a lista para baixo e reduz muito a quantidade de conversas visíveis.

Isso prejudica uma ferramenta cuja principal atividade é escanear rapidamente uma fila.

## Direção recomendada

Preferir:

- Popover;
- Dropdown avançado;
- Drawer lateral pequeno;

em vez de um bloco expansível que desloca permanentemente a lista.

Exemplo:

```text
[ Buscar conversas... ]

[ Filtros 2 ]  [ Ordenar ▾ ]

[Estado: aguardando ×] [Área: Financeiro ×]
```

## Aplicação dos filtros

Verificar como o código funciona hoje.

Se tecnicamente seguro e sem alterar backend:

- considerar aplicar filtros imediatamente;
- ou manter "Aplicar" dentro do popover.

Não alterar o contrato atual de busca/filtro.

## Critérios de aceite

- Abrir filtros não deve reduzir significativamente a área visível da lista.
- Filtros ativos devem ser facilmente percebidos.
- Deve existir forma óbvia de limpar filtros.
- A experiência deve funcionar por teclado.
- Não perder nenhum filtro já existente.

---

# 6. Prioridade 3 — Compactar os itens da lista de conversas

## Problema observado

Cada atendimento ocupa altura relativamente grande.

Isso reduz a quantidade de conversas visíveis simultaneamente.

## Objetivo

Melhorar a capacidade de leitura rápida da fila.

## Hierarquia sugerida

Cada item deve priorizar:

1. nome;
2. indicador de estado;
3. horário/tempo;
4. preview da última mensagem;
5. destino/área/fila;
6. responsável, se relevante.

Exemplo visual:

```text
Ana Clara Souza                         13:59
Quero entender os planos e quais documentos...
Novos atendimentos · Sem responsável
```

## Evitar

Repetir informações em múltiplas linhas quando não for necessário.

Exemplo atual que pode ser simplificado:

```text
Disponível para atendimento
[ Atender ]
```

Se a mesma ação já existe no header da conversa, avaliar se o botão no item realmente precisa ficar sempre visível.

Possíveis alternativas front-end:

- mostrar ação no hover;
- mostrar somente na conversa selecionada;
- usar menu de ações;
- remover duplicação se a UX continuar clara.

## Critérios de aceite

- Mais conversas visíveis por viewport.
- Preview continua legível.
- Nome e status continuam fáceis de identificar.
- Item selecionado continua claramente destacado.
- Não remover informação necessária para operação.

---

# 7. Prioridade 4 — Rever a duplicação da ação "Atender"

## Problema observado

A ação "Atender" aparece:

- no item da lista;
- no header da conversa.

Ao mesmo tempo, o compositor informa que não é possível responder até o atendimento estar no estado adequado.

## Objetivo

Criar uma única hierarquia clara para a ação principal.

## Sugestão

No estado em que a conversa ainda precisa ser assumida:

### Header

Manter a ação principal:

```text
[ Atender ] [ Transferir ] [...]
```

### Compositor

Em vez de apenas:

```text
Resposta indisponível
O atendimento precisa estar em andamento ou pendente.
```

mostrar uma ação contextual, caso ela possa chamar exatamente a mesma função já existente:

```text
Você precisa assumir esta conversa para responder.

[ Atender ]
```

ou:

```text
[ Assumir atendimento ]
```

Somente alterar o texto para "Assumir atendimento" se isso não gerar inconsistência com a terminologia usada em outras telas.

## Importante

Não alterar a regra que determina quando uma conversa pode ser respondida.

Apenas melhorar a apresentação do estado já retornado pelo sistema.

## Critérios de aceite

- O usuário entende imediatamente por que o campo está bloqueado.
- A solução fica próxima ao local do bloqueio.
- Não existem duas CTAs igualmente fortes competindo na mesma região.
- A ação reutiliza a implementação existente.

---

# 8. Prioridade 5 — Reduzir chrome no header da conversa

## Problema observado

Há várias faixas sucessivas:

- identificação do contato;
- "Próxima ação";
- botões de ação;
- título "Conversa";
- metadados da conversa.

Isso ocupa uma quantidade relevante de altura antes de chegar às mensagens.

## Direção recomendada

Consolidar informações no header sempre que possível.

Exemplo conceitual:

```text
Ana Clara Souza
WhatsApp · Atendimento ao cliente · Novos atendimentos
Aguardando fila · Sem responsável

[ Atender ] [ Transferir ] [...]
```

A mensagem:

```text
PRÓXIMA AÇÃO
Assuma a conversa ou transfira para outro destino.
```

pode ser transformada em:

- helper text menor;
- alert compacto;
- tooltip;
- texto contextual ao lado do status;

desde que continue compreensível.

## Critérios de aceite

- Ganhar área vertical para a conversa.
- Não esconder estados importantes.
- Não remover ações.
- O header continuar legível em resoluções menores.

---

# 9. Prioridade 6 — Rever "Tempo real ativo"

## Problema observado

O indicador "Tempo real ativo" ocupa espaço privilegiado no header.

## Investigação obrigatória

Verificar no código o que esse indicador representa.

### Caso seja status técnico da conexão

Exemplo:

- WebSocket conectado;
- SSE conectado;
- polling funcionando.

Nesse caso, considerar esconder o estado saudável e mostrar apenas estados anormais:

```text
Reconectando...
Atualização em tempo real indisponível
```

### Caso seja status operacional do usuário

Preservar e reposicionar próximo ao perfil/status do operador.

## Critério

Não remover o indicador sem primeiro confirmar sua função no código.

---

# 10. Prioridade 7 — Rever o botão "Voltar" no desktop

## Problema observado

No desktop, a lista de conversas permanece visível à esquerda.

O botão "Voltar" pode ser redundante.

## Investigação

Descobrir se ele serve para:

- mobile;
- deep link;
- modo full-screen;
- navegação histórica;
- rota anterior.

## Direção

Se no desktop ele apenas retorna para uma tela que já está representada pela coluna esquerda, considerar:

- esconder em breakpoints grandes;
- manter em mobile;
- manter quando a página foi aberta isoladamente.

Não alterar o roteamento sem necessidade.

---

# 11. Prioridade 8 — Melhorar o compositor bloqueado

O compositor é uma região operacional central.

Quando estiver indisponível, deve apresentar:

1. motivo;
2. próxima ação;
3. estado visual inequívoco.

Evitar um grande input visualmente semelhante a um campo editável quando ele está completamente bloqueado.

Exemplo:

```text
Responder

┌─────────────────────────────────────────┐
│ Esta conversa ainda não pode receber    │
│ respostas.                              │
│                                         │
│ [ Atender ]                             │
└─────────────────────────────────────────┘
```

Se houver diferentes motivos de bloqueio, utilizar mensagens específicas conforme os estados já existentes no front.

Não criar novos estados.

---

# 12. Prioridade 9 — Painel lateral de detalhes

## Estrutura atual

O painel lateral contém informações como:

- contato;
- telefone;
- e-mail;
- destino;
- responsável;
- canal;
- follow-ups.

O padrão é adequado.

## Melhorias recomendadas

### 12.1 Tornar recolhível

Se os componentes existentes permitirem, possibilitar esconder o painel para dar mais espaço à conversa.

### 12.2 Avaliar redimensionamento

Somente se já houver componente seguro e simples no projeto.

Não introduzir uma biblioteca grande apenas para isso.

### 12.3 Priorizar informações operacionais

Se os dados já existirem, avaliar colocar primeiro:

```text
Atendimento
Destino
Responsável
Canal
```

e depois:

```text
Contato
Telefone
E-mail
```

A prioridade deve ser decidida com base no uso real do módulo.

## Critérios de aceite

- Painel não deve disputar largura excessiva com a conversa.
- Informações críticas devem aparecer sem scroll desnecessário.
- Recolhimento não deve perder estado importante.

---

# 13. Prioridade 10 — "Ciclo" e terminologia interna

## Investigação

Verificar como o termo "Ciclo" é usado no restante do produto.

Atualmente aparecem elementos como:

```text
Ciclo 1 · sem responsável
Contato e ciclo
```

## Pergunta para validação

"Ciclo" é uma informação relevante para o operador durante o atendimento ou principalmente um conceito interno do domínio?

Se for pouco acionável, reduzir sua proeminência visual.

Não remover se tiver significado funcional importante.

---

# 14. Prioridade 11 — Busca

O placeholder atual é:

```text
Nome ou telefone
```

## Melhoria simples

Se o mecanismo atual pesquisar mais campos do que esses dois, usar:

```text
Buscar conversas
```

Se pesquisar somente nome e telefone, manter o placeholder preciso.

Não prometer uma capacidade que o backend não oferece.

---

# 15. Prioridade 12 — Tempo e urgência

## Objetivo

Em ferramentas de atendimento, o operador geralmente precisa entender rapidamente qual conversa exige atenção.

## Somente se os dados já existirem

Se o frontend já recebe timestamps suficientes, avaliar exibir tempo relativo:

```text
agora
2 min
14 min
1 h
```

em vez de depender somente de:

```text
13:59
```

O horário exato pode ficar em tooltip.

## SLA

Não implementar SLA novo.

Se o backend já retornar alguma informação de SLA, prioridade ou vencimento que atualmente não esteja visível, avaliar destacá-la na lista.

Se não existir, registrar apenas:

> Fora de escopo front-end: depende de suporte do backend.

---

# 16. Prioridade 13 — Paginação

Na captura existe:

```text
Página 1 de 1
[Anterior] [Próxima]
```

Quando existe apenas uma página, considerar esconder ou simplificar os controles.

Exemplo:

```text
2 atendimentos
```

Não alterar o mecanismo de paginação.

Somente adaptar sua apresentação.

---

# 17. Prioridade 14 — Estados visuais

Auditar especificamente:

- carregamento inicial;
- carregamento ao trocar conversa;
- busca vazia;
- filtro sem resultados;
- nenhuma conversa na fila;
- erro ao carregar;
- erro ao assumir;
- erro ao transferir;
- conversa sem mensagens;
- conversa selecionada;
- ação em andamento;
- botão disabled.

A interface deve evitar saltos bruscos de layout.

Preferir skeletons coerentes com os componentes existentes.

---

# 18. Prioridade 15 — Responsividade

Validar ao menos:

- 1920×1080;
- 1440×900;
- 1366×768;
- 1280×720;
- tablet, caso suportado pelo produto.

Observar principalmente:

- tabs;
- largura da lista;
- largura da conversa;
- painel direito;
- header;
- botões;
- filtros.

Em larguras menores, priorizar progressivamente:

1. conversa;
2. lista;
3. detalhes.

O painel de detalhes é o primeiro candidato a recolhimento.

---

# 19. Prioridade 16 — Acessibilidade e ergonomia

Verificar:

- foco visível;
- `aria-label` em botões somente com ícone;
- tooltips para ícones;
- contraste de badges;
- navegação por teclado;
- áreas clicáveis adequadas;
- estados disabled perceptíveis;
- labels corretos nos filtros;
- semântica dos headings;
- leitura por screen reader quando razoável.

---

# 20. Atalhos de teclado — opcional

Somente implementar se:

- não houver conflito com atalhos existentes;
- as ações já existirem;
- houver arquitetura simples para isso.

Possíveis exemplos:

```text
J / K   conversa anterior/próxima
R       focar resposta
A       atender/assumir
T       transferir
Esc     fechar popover/drawer
```

Não é prioridade frente às melhorias estruturais de UI.

---

# 21. Pontos que NÃO devem ser implementados nesta etapa

As referências de mercado sugerem funcionalidades como:

- distribuição por menor carga;
- round-robin;
- skills;
- capacidade por agente;
- SLA;
- overflow de fila;
- redistribuição automática;
- collision detection;
- presença de outro agente;
- snooze persistido;
- views salvas no servidor.

Esses itens só devem ser implementados se o backend **já oferecer integralmente suporte** e o front apenas ainda não os expuser.

Caso contrário:

```text
NÃO IMPLEMENTAR.
```

Registrar como recomendação futura, fora deste escopo.

---

# 22. Sugestão de resultado visual

Sem alterar radicalmente a identidade atual, buscar algo próximo deste modelo:

```text
Atendimentos · Operação

[ Todas ] [ Triagem ] [ Aguardando fila ] [ Mais ▾ ]

┌────────────────────────┬───────────────────────────────────────────┬──────────────────┐
│ Buscar conversas       │ Ana Clara Souza                          │ Atendimento      │
│ [Filtros 2]            │ WhatsApp · Novos atendimentos            │                  │
│                        │ Aguardando fila · Sem responsável        │ Responsável      │
│ Ana Clara         4m   │                         [Atender] [...]   │ Sem responsável  │
│ Quero entender...      │                                           │                  │
│ Novos atendimentos     │ Cliente                         12:04      │ Destino          │
│                        │ Olá, gostaria de saber...                  │ Novos atend.     │
│ Fernanda          17m  │                                           │                  │
│ Se puderem me...       │ Assistente                      12:34      │ Canal            │
│ Benefícios             │ Olá, Ana! Vou te ajudar...                │ WhatsApp         │
│                        │                                           │                  │
│                        │ Cliente                         13:59      │ Contato          │
│                        │ Quero entender os planos...                │ Ana Clara        │
│                        │                                           │                  │
│                        │ ┌───────────────────────────────────────┐ │ Follow-ups       │
│                        │ │ Para responder, atenda a conversa    │ │                  │
│                        │ │             [ Atender ]              │ │                  │
│                        │ └───────────────────────────────────────┘ │                  │
└────────────────────────┴───────────────────────────────────────────┴──────────────────┘
```

Esse wireframe é apenas orientação.

Não copiar literalmente se conflitar com:

- design system;
- componentes existentes;
- estados disponíveis;
- responsividade;
- padrões já consolidados no projeto.

---

# 23. Ordem recomendada de implementação

## Etapa 1 — Diagnóstico

- mapear componentes;
- mapear estados;
- confirmar comportamento de filtros;
- confirmar significado de cada status;
- confirmar significado de "Tempo real ativo";
- confirmar comportamento de "Voltar";
- identificar componentes reutilizáveis.

## Etapa 2 — Densidade da lista

- compactar itens;
- revisar duplicação do botão "Atender";
- melhorar hierarquia textual;
- simplificar paginação.

## Etapa 3 — Filtros e navegação

- mover "Mais filtros" para overlay/popover/drawer;
- melhorar indicação de filtros ativos;
- revisar tabs e overflow.

## Etapa 4 — Área central

- compactar header;
- revisar faixa "Próxima ação";
- melhorar estado bloqueado do compositor;
- aumentar área útil da conversa.

## Etapa 5 — Painel direito

- revisar hierarquia;
- avaliar recolhimento;
- melhorar densidade.

## Etapa 6 — Refinamento

- responsividade;
- acessibilidade;
- loading/empty/error states;
- atalhos opcionais.

---

# 24. Checklist de validação no código

Antes de concluir, responder objetivamente:

## Lista

- [ ] Quantas conversas cabem no viewport antes e depois?
- [ ] O item selecionado continua evidente?
- [ ] O preview continua legível?
- [ ] Não houve perda de metadados necessários?

## Filtros

- [ ] Abrir filtros não destrói a área útil da fila?
- [ ] É claro que há filtros ativos?
- [ ] Limpar filtros é fácil?
- [ ] Todos os filtros antigos continuam funcionando?

## Conversa

- [ ] A ação primária está evidente?
- [ ] Não existem CTAs redundantes competindo?
- [ ] O estado bloqueado explica como prosseguir?
- [ ] O histórico ganhou mais espaço?

## Painel direito

- [ ] Os dados mais úteis aparecem primeiro?
- [ ] O painel pode ser recolhido se necessário?
- [ ] O layout continua utilizável em 1366×768?

## Estados

- [ ] loading;
- [ ] empty;
- [ ] error;
- [ ] disabled;
- [ ] selected;
- [ ] filtered;
- [ ] mobile/responsive.

## Regressão

- [ ] Atender continua funcionando.
- [ ] Transferir continua funcionando.
- [ ] Busca continua funcionando.
- [ ] Filtros continuam funcionando.
- [ ] Paginação continua funcionando.
- [ ] Seleção de conversa continua funcionando.
- [ ] URL/deep link continua funcionando.
- [ ] Follow-ups continuam funcionando.

---

# 25. Validação visual obrigatória

Após cada grupo relevante de alterações:

1. iniciar a aplicação;
2. abrir a tela de Atendimentos;
3. validar com dados suficientes para representar:
   - conversa selecionada;
   - conversa sem responsável;
   - conversa com mensagens;
   - filtros ativos;
4. capturar screenshots;
5. comparar antes/depois;
6. corrigir regressões de espaçamento, truncamento ou responsividade.

Se houver Playwright, Chrome DevTools MCP ou ferramenta equivalente disponível ao agente, utilizá-la para validar a interface.

---

# 26. Como reportar a conclusão

Ao final, entregar um resumo no formato:

```markdown
## Diagnóstico

### Já existia
- ...

### Alterado
- ...

### Mantido por decisão de produto/código
- ...

### Fora de escopo por depender de backend
- ...

## Arquivos alterados
- ...

## Validação
- resolução 1920×1080: OK
- resolução 1366×768: OK
- filtros: OK
- selecionar conversa: OK
- atender: OK
- transferir: OK

## Evidências
- screenshot antes
- screenshot depois
```

---

# 27. Regra final para o agente

Não usar este documento como especificação cega.

Ele é um **guia de revisão**.

O código atual é a fonte de verdade para:

- capacidades existentes;
- estados;
- ações;
- nomenclaturas obrigatórias;
- contratos;
- componentes;
- limitações.

Quando uma sugestão conflitar com uma restrição real do projeto:

1. preservar o funcionamento atual;
2. escolher a melhoria de UI mais próxima possível;
3. explicar a decisão;
4. não introduzir alteração de backend para forçar a implementação.
