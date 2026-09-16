# Guia de Revisão Front-end — Operação e Canais

## Objetivo

Este documento orienta a revisão e evolução **exclusivamente do front-end** de duas áreas do módulo operacional do 7 Agentes:

1. **Operação / Visão geral da operação**
2. **Canais / Canais de entrada**

A análise parte da interface atual e de padrões observados em plataformas maduras de atendimento e help desk, como Zendesk, Intercom, Freshdesk e Front.

O objetivo não é reproduzir outra plataforma, nem alterar o modelo de domínio do projeto. O objetivo é melhorar:

- hierarquia de informação;
- densidade;
- escaneabilidade;
- gerenciamento de estruturas grandes;
- clareza das ações;
- apresentação de estados;
- progressive disclosure;
- consistência visual;
- uso de espaço;
- redução de linguagem excessivamente técnica;
- ergonomia administrativa.

O agente responsável deve **confirmar cada recomendação no código antes de implementá-la**.

---

# 1. Escopo obrigatório

## Permitido

- layout;
- hierarquia visual;
- organização da informação;
- composição de cards;
- listas e tabelas;
- tabs;
- accordions;
- drawers;
- dialogs;
- popovers;
- tooltips;
- badges;
- empty states;
- loading states;
- estados de erro;
- responsividade;
- textos da interface;
- labels;
- microcopy;
- agrupamento de ações;
- ícones;
- destaque visual;
- navegação puramente front-end;
- colapso/expansão de seções;
- filtros client-side, quando os dados necessários já estiverem disponíveis;
- busca client-side, quando os dados necessários já estiverem disponíveis;
- componentes reutilizáveis já existentes;
- persistência local de preferências visuais, se já houver infraestrutura adequada.

## Fora de escopo

Não implementar mudanças que exijam:

- novo endpoint;
- alteração de endpoint;
- alteração de payload;
- alteração de schema;
- alteração de banco;
- nova regra de área/fila;
- alteração do modelo de membros;
- nova regra de restrição de operadores;
- nova política de distribuição;
- mudança de runtime;
- mudança no fluxo de conexão de canais;
- nova validação de credenciais;
- mudança na semântica dos diagnósticos;
- alteração da máquina de estados;
- mudança nas regras de ativação/desativação;
- mudança nas permissões;
- mudança em E4, E6 ou outras etapas do backend;
- transformação de códigos técnicos retornados pelo backend.

Quando uma melhoria depender disso, registrar:

> **Fora de escopo front-end: depende de suporte do backend.**

---

# 2. Referência conceitual

Plataformas maduras tendem a separar duas experiências:

## Gestão estrutural

Usada para:

- equipes/grupos;
- membros;
- filas/inboxes;
- permissões;
- atribuições;
- configuração da operação.

## Gestão de canais

Usada para:

- conectar canais;
- verificar estado;
- configurar entrada;
- definir destinos;
- diagnosticar problemas;
- administrar integrações.

Essa separação já existe no 7 Agentes por meio de:

```text
Operação
Canais
Distribuição
Administração
```

Portanto, a arquitetura geral de navegação deve ser preservada.

O principal problema atual não é a separação entre páginas. É a **densidade interna de cada página** e a quantidade de configuração exibida simultaneamente.

---

# PARTE A — OPERAÇÃO

# 3. Diagnóstico da tela Operação

A tela mistura duas funções:

## Função 1 — Dashboard/overview

No topo existem:

- título;
- descrição;
- CTA para central de atendimentos;
- acesso rápido;
- card "Estrutura da operação";
- métricas:
  - áreas ativas;
  - filas ativas;
  - membros ativos;
- indicador de prontidão.

Isso funciona como uma visão geral.

## Função 2 — Editor estrutural completo

Logo abaixo, a mesma página passa a exibir:

- todas as áreas;
- membros de cada área;
- formulário para adicionar membros;
- função/papel do membro;
- filas de cada área;
- restrições de operadores;
- formulários de restrição;
- editar/desativar;
- criação de filas;
- criação de áreas;
- resumo de canais.

Com poucas áreas isso funciona.

Com muitas áreas, a página cresce verticalmente de forma muito agressiva e o usuário perde contexto.

---

# 4. Problema principal — Tudo está expandido ao mesmo tempo

Cada área apresenta simultaneamente:

```text
Área
Descrição
Membros
Formulário para adicionar membro
Lista de membros
Filas
Fila
Restrição de operadores
Formulário de restrição
Lista de operadores restritos
Ações
```

Isso faz cada área ocupar uma grande parte da viewport.

Com quatro áreas já existe uma página muito longa.

Com:

- 10 áreas;
- 20 áreas;
- várias filas por área;
- dezenas de operadores;

a abordagem deixa de escalar.

## Direção recomendada

Aplicar **progressive disclosure**.

A lista inicial deve mostrar apenas o necessário para escolher qual área administrar.

Exemplo:

```text
Áreas

Atendimento ao cliente                 Ativa
3 membros · 1 fila
Dúvidas gerais, primeiro contato...
                                            [Editar] [⋯]

Experiência do cliente                 Ativa
2 membros · 1 fila
Retenção, feedback e satisfação...
                                            [Editar] [⋯]

Financeiro e benefícios                Ativa
2 membros · 1 fila
Solicitações financeiras...
                                            [Editar] [⋯]
```

Ao clicar na área:

- expandir um accordion;
- abrir drawer;
- abrir painel;
- ou navegar para detalhe da área;

dependendo dos componentes e rotas já existentes.

## Regra

Não criar rota nova apenas por preferência estética se isso gerar trabalho estrutural desnecessário.

A alternativa mais segura é:

```text
lista compacta + accordion/detalhe expandido
```

---

# 5. Separar "visão geral" de "edição detalhada"

A parte superior da página é boa como overview.

Entretanto, depois dela o usuário entra diretamente em formulários de configuração.

## Sugestão

Manter o topo:

```text
Operação
Visão geral
Acesso rápido
Estrutura da operação
```

Depois transformar a seção `Áreas` em um gerenciador compacto.

Exemplo:

```text
Áreas                                         [Nova área]

4 áreas ativas

┌─────────────────────────────────────────────────────────────┐
│ Atendimento ao cliente                         Ativa        │
│ 3 membros · 1 fila                                          │
│ Dúvidas gerais, primeiro contato...                [Abrir]  │
├─────────────────────────────────────────────────────────────┤
│ Experiência do cliente                         Ativa        │
│ 2 membros · 1 fila                                          │
│ Retenção, feedback...                            [Abrir]     │
└─────────────────────────────────────────────────────────────┘
```

---

# 6. Evitar formulários de inclusão permanentemente abertos

Hoje cada área sempre exibe:

```text
Usuário
[Selecione um usuário]

Papel
[Operador]

[Adicionar]
```

Mesmo quando o administrador não pretende adicionar ninguém.

Isso aumenta muito a altura e cria ruído.

## Sugestão

Trocar por:

```text
Membros da área                         [Adicionar membro]
```

Ao clicar:

- revelar formulário inline;
- abrir popover;
- abrir dialog;
- ou drawer.

Depois da ação, o formulário pode ser fechado novamente.

O mesmo princípio vale para:

```text
Restrição de operadores
[Selecione um operador]
[Restringir]
```

Preferir:

```text
Restrições de operadores               [Adicionar restrição]
```

e revelar o formulário somente sob demanda.

---

# 7. Compactar a lista de membros

Hoje cada membro ocupa um card/row relativamente alto.

Exemplo atual:

```text
Marina Costa
marina.costa.demo@example.com

                             [Supervisor ▾] [Excluir]
```

A estrutura está correta, mas pode ser mais compacta.

## Direção

Usar row administrativo:

```text
Marina Costa
marina.costa.demo@example.com         Supervisor ▾    🗑
```

ou:

```text
Marina Costa        marina@...        Supervisor       ⋯
```

Dependendo da largura disponível.

## Critérios

- nome é informação principal;
- e-mail é secundário;
- papel é editável;
- remover membro continua acessível;
- row não deve parecer um card independente se ele faz parte de uma lista.

---

# 8. Evitar excesso de bordas e "cards dentro de cards"

A tela atual possui vários níveis:

```text
card da área
  formulário de membros
  card de membro
  seção filas
    card da fila
      formulário de restrição
      card do operador
```

Cada nível adiciona:

- border;
- padding;
- margem;
- altura.

Isso cria sensação de interface pesada.

## Direção

Definir no máximo três níveis visuais claros:

```text
Página
  Seção/área
    Rows/subseções
```

Usar:

- divisores;
- backgrounds sutis;
- headings;
- spacing;

em vez de colocar borda completa em todo elemento.

---

# 9. Melhorar hierarquia das ações da área

Hoje as ações:

```text
Editar
Desativar
```

ficam posicionadas lateralmente ao conteúdo e, em alguns casos, parecem desconectadas do título da área.

## Sugestão

Levar ações da área para o header da própria área.

Exemplo:

```text
Atendimento ao cliente   Ativa              [Editar] [⋯]
Dúvidas gerais...
```

No menu `⋯`:

```text
Desativar
```

A ação destrutiva não precisa ocupar espaço permanente em vermelho.

## Benefícios

- associação visual clara;
- menos ruído;
- menor chance de clique acidental;
- padrão administrativo mais comum.

## Regra

Se "Desativar" tiver requisito de visibilidade permanente no produto, manter.

Caso contrário, preferir menu contextual.

---

# 10. Melhorar hierarquia das ações da fila

O mesmo problema existe nas filas.

Atualmente:

```text
Editar
Desativar
```

aparecem no lado direito do bloco.

## Direção

Associar as ações ao header da fila:

```text
Novos atendimentos   Ativa                 [Editar] [⋯]
Fila de entrada para novos contatos.
```

Isso deixa evidente qual objeto será alterado.

---

# 11. "Restrição de operadores" ocupa espaço demais quando vazia

Quando não há restrições, a tela ainda mostra:

- título;
- explicação longa;
- input/select;
- botão;
- empty state.

É muita interface para representar:

```text
Nenhuma restrição.
```

## Versão compacta

Exemplo:

```text
Operadores
Todos os operadores da área podem atuar nesta fila.

[Restringir operadores]
```

Quando houver restrições:

```text
Operadores restritos
Rafael Lima
Felipe Nunes

[Gerenciar]
```

## Importante

A recomendação é exclusivamente visual.

Não alterar a semântica atual de restrição.

---

# 12. Microcopy de restrição

Texto atual:

> Sem vínculos, operadores da área podem atuar nesta fila. Com vínculos, somente os operadores listados recebem este escopo.

É tecnicamente correto, mas exige interpretação.

## Sugestão de texto mais direto

Quando não houver restrições:

> Todos os operadores desta área podem atuar nesta fila.

Quando houver:

> Somente os operadores listados abaixo podem atuar nesta fila.

Se "vínculo" for terminologia importante em outras áreas do produto, confirmar antes de remover.

---

# 13. Empty states devem ser menores em páginas administrativas densas

Exemplos atuais:

```text
Nenhum membro ativo
Adicione um usuário elegível para liberar a atuação nesta área.
```

e:

```text
Nenhum operador com restrição específica nesta fila.
```

O conteúdo é útil, mas o container ocupa altura significativa.

## Direção

Usar empty state compacto quando estiver dentro de uma estrutura já compreendida:

```text
Nenhum membro nesta área.
[Adicionar membro]
```

ou:

```text
Sem restrições específicas.
```

Reservar empty states grandes para páginas realmente vazias.

---

# 14. Melhorar o topo da tela Operação

A parte superior possui:

```text
VISÃO GERAL DA OPERAÇÃO
Operação
Descrição
[Abrir central de atendimentos]
```

Depois:

```text
Acesso rápido
[Atendimentos] [Distribuição]
```

Existe uma pequena redundância porque:

- o CTA principal leva a Atendimentos;
- o primeiro acesso rápido também leva a Atendimentos.

## Investigação obrigatória

Verificar se ambos possuem razão funcional diferente.

Se levarem ao mesmo lugar, considerar:

### Opção A

Manter CTA principal e remover Atendimentos do acesso rápido.

### Opção B

Remover CTA grande e manter acessos rápidos.

### Opção C

Trocar acesso rápido por elementos complementares:

```text
Distribuição
Canais
Administração
```

Não duplicar navegação sem necessidade.

---

# 15. Card "Estrutura da operação"

O card apresenta:

```text
Estrutura da operação
Configuração estrutural concluída em ...

Áreas ativas     4
Filas ativas     4
Membros ativos   5

Prontidão
A estrutura está pronta para receber atendimentos.
```

É uma boa síntese.

## Melhorias possíveis

### 15.1 Reduzir altura

As três métricas podem ser um row mais compacto.

### 15.2 Tornar a prontidão mais visual

Se já existe um estado booleano/enum no front:

```text
✓ Estrutura pronta
```

pode ocupar menos espaço.

### 15.3 Evitar informação duplicada

Se o check verde e o bloco "Prontidão" comunicam exatamente a mesma coisa, manter apenas um dos dois níveis de confirmação.

Não eliminar detalhes se os estados puderem divergir.

---

# 16. Área "Canais de entrada" no final da página Operação

Atualmente existe um resumo:

```text
Canais de entrada

1 canais conectados
1 rotas prontas

[Administrar canais]
```

Essa seção funciona bem como cross-navigation.

## Recomendações

- manter compacta;
- não replicar detalhes da página Canais;
- usar linguagem consistente com Canais;
- corrigir pluralização dinamicamente se necessário:
  - `1 canal conectado`;
  - `2 canais conectados`;
  - `1 rota pronta`;
  - `2 rotas prontas`.

Verificar se o projeto já possui helper de pluralização/i18n antes de criar solução local.

---

# 17. Busca e filtragem de áreas — somente se necessário

Com quatro áreas, busca é desnecessária.

Se o sistema puder ter dezenas de áreas e os dados já estiverem carregados no front, considerar:

```text
[Buscar áreas...]  [Status: Ativas ▾]
```

Não implementar prematuramente sem verificar o volume esperado.

---

# 18. Estado recomendado da área expandida

Exemplo conceitual:

```text
Atendimento ao cliente     Ativa                 [Editar] [⋯]
Dúvidas gerais, primeiro contato e suporte aos clientes.
3 membros · 1 fila

Membros                                          [Adicionar]
──────────────────────────────────────────────────────────
Marina Costa         marina@...        Supervisor      ⋯
Rafael Lima          rafael@...        Operador        ⋯
Felipe Nunes         felipe@...        Operador        ⋯

Filas                                            [Nova fila]
──────────────────────────────────────────────────────────
Novos atendimentos    Ativa                         [⋯]
Fila de entrada para novos contatos.
Operadores: Rafael Lima, Felipe Nunes          [Gerenciar]
```

A mesma informação permanece disponível, porém sem formulários e containers permanentes.

---

# PARTE B — CANAIS

# 19. Diagnóstico da tela Canais

A tela atual possui:

```text
Setup estrutural
CANAIS DE ENTRADA
Operação
Descrição
[Nova conexão]

Runtime de atendimento
Mensagem sobre E4 e E6

WhatsApp Operação Carará     Ativa
Meta Cloud · Meta WhatsApp Cloud API · Conectado
[Editar conexão]

Estado do provider
Aberto

Credenciais
Incompletas

Versão
v1

Rota de entrada       Rota válida
Fila · atualizada em ...

Diagnóstico · CONFIGURATION_READY
texto

Destinos: Área → Fila

Tráfego bloqueado até E4...

Número provisionado
Mídia suportada

Desativar conexão
```

A estrutura contém dados úteis, mas mistura:

- estado de negócio;
- estado técnico;
- informação de configuração;
- diagnóstico de implementação;
- etapas do roadmap/runtime.

---

# 20. Problema principal — Linguagem técnica domina a experiência

Exemplos:

```text
Runtime de atendimento
E4
E6
CONFIGURATION_READY
provider
v1
```

Esses termos podem ser importantes para desenvolvimento e diagnóstico, mas para um administrador comum criam carga cognitiva.

## Regra

Não remover informação técnica necessária.

Aplicar **dois níveis de leitura**:

### Nível 1 — operacional

```text
Canal conectado
Credenciais incompletas
Rota configurada
Recebimento temporariamente indisponível
```

### Nível 2 — técnico

```text
Provider: Aberto
Versão: v1
Diagnóstico: CONFIGURATION_READY
Runtime: E4/E6
```

Pode ficar em:

- accordion "Detalhes técnicos";
- tooltip;
- seção expandível;
- bloco de diagnóstico.

---

# 21. Status geral da conexão deve ser mais evidente

Hoje aparecem simultaneamente:

```text
Ativa
Conectado
Estado do provider: Aberto
Credenciais: Incompletas
Rota válida
CONFIGURATION_READY
Tráfego bloqueado
```

São muitos sinais.

A primeira pergunta do usuário é:

> Este canal está funcionando para receber atendimentos agora?

## Direção

Criar uma hierarquia visual explícita.

Exemplo:

```text
WhatsApp Operação Carará

⚠ Configurado, mas ainda não recebe atendimentos
Meta WhatsApp Cloud API

[Editar conexão]
```

Depois:

```text
Conexão       Conectada
Credenciais   Incompletas
Rota          Configurada
Destino       Atendimento ao cliente → Novos atendimentos
```

E abaixo:

```text
Detalhes técnicos
```

## Importante

Somente derivar um resumo desses estados se o front **já possuir informação suficiente e inequívoca**.

Não inventar uma interpretação diferente da regra do backend.

Se houver dúvida, apenas reorganizar os estados existentes.

---

# 22. Alert "Runtime de atendimento"

O alert atual é bastante técnico e ocupa largura/altura considerável:

> A configuração pode ser salva como rascunho e diagnosticada agora, mas o tráfego permanece bloqueado até E4. Assistants operacionais só serão executados quando E6 estiver disponível.

## Problemas

- E4/E6 são referências internas;
- mistura dois assuntos;
- exige contexto de desenvolvimento;
- aparece antes da conexão e domina visualmente a página.

## Direção front-end

Se esses códigos precisarem permanecer:

```text
Recebimento de mensagens ainda indisponível
A conexão pode ser configurada e validada, mas o runtime de atendimento
ainda não está habilitado.

[Ver detalhes técnicos]
```

Detalhes:

```text
Tráfego bloqueado até E4.
Assistants operacionais disponíveis a partir de E6.
```

## Regra

Não alterar o significado.

Somente separar linguagem operacional e técnica.

---

# 23. Evitar duplicação de "tráfego bloqueado"

A mesma limitação aparece:

1. no alert geral "Runtime de atendimento";
2. dentro da rota em caixa laranja.

Se ambos representam exatamente a mesma condição, há redundância.

## Sugestão

### Alert global

Comunica estado geral:

```text
Recebimento ainda indisponível.
```

### Rota

Comunica apenas estado específico da rota:

```text
Rota configurada corretamente.
```

Ou vice-versa, dependendo dos estados reais.

Antes de remover qualquer aviso, confirmar se cada mensagem representa condições diferentes.

---

# 24. Cards de "Estado do provider / Credenciais / Versão"

Os três cards atualmente recebem o mesmo peso visual.

Mas provavelmente têm importância diferente.

```text
Estado do provider
Aberto

Credenciais
Incompletas

Versão
v1
```

## Direção

Usar uma lista de propriedades compacta:

```text
Conexão
Provider       Aberto
Credenciais    Incompletas
Versão         v1
```

ou duas colunas.

Se `Credenciais incompletas` demandar atenção, ela deve receber destaque maior que `Versão v1`.

## Regra

Hierarquia deve refletir criticidade, não apenas tipo de dado.

---

# 25. Card da conexão deve ser escaneável

Com várias conexões, o formato atual produzirá uma longa pilha de cards muito grandes.

## Estado colapsado recomendado

```text
WhatsApp Operação Carará               Ativa
WhatsApp · Meta Cloud

⚠ Credenciais incompletas
✓ Rota configurada

Destino: Atendimento ao cliente → Novos atendimentos

[Gerenciar]
```

Ao abrir/expandir:

- detalhes;
- rota;
- diagnóstico;
- propriedades técnicas;
- ações.

## Alternativa

Se a aplicação já tiver padrão master/detail:

```text
lista de conexões → detalhe da conexão
```

é ainda melhor.

Não criar arquitetura nova sem verificar o projeto.

---

# 26. "Nova conexão"

O CTA está bem posicionado no header.

Manter como ação primária.

## Verificar

- loading ao criar;
- disabled;
- permissões;
- retorno após salvar;
- feedback de sucesso/erro.

Não adicionar segundo CTA equivalente em outra região sem necessidade.

---

# 27. "Editar conexão" e "Editar rota"

As duas ações são corretamente separadas semanticamente.

Porém, a diferença pode não ser evidente para usuários novos.

## Sugestão

Manter:

```text
Editar conexão
Editar rota
```

e usar tooltip/helper quando necessário:

- conexão = credenciais/provedor/canal;
- rota = destino das mensagens.

Não juntar as ações se elas representam objetos diferentes no código.

---

# 28. Destino da rota

Hoje:

```text
Destinos: Atendimento ao cliente → Novos atendimentos
```

É uma informação operacional importante.

Ela deve ter peso maior.

## Sugestão

```text
Destino
Atendimento ao cliente
└─ Novos atendimentos
```

ou:

```text
Destino
Atendimento ao cliente → Novos atendimentos
```

Evitar aparência de input disabled se o elemento for apenas informativo.

Na captura, o destino está dentro de um container visual semelhante a campo.

Se não for editável ali, usar row/propriedade, não input-like.

---

# 29. Diagnóstico da rota

Hoje:

```text
Diagnóstico · CONFIGURATION_READY
Rota operacional válida; o tráfego permanece bloqueado...
```

## Sugestão

Primeiro nível:

```text
✓ Rota configurada corretamente
```

Segundo nível:

```text
Diagnóstico técnico: CONFIGURATION_READY
```

Se o código técnico for útil apenas para suporte/desenvolvimento, deixá-lo copiável.

Exemplo:

```text
CONFIGURATION_READY   [Copiar]
```

Isso é mais útil do que usar o código como headline.

---

# 30. "Número provisionado" e "Mídia suportada"

Atualmente aparecem como chips:

```text
Número provisionado
Mídia suportada
```

Sem valor visível nas capturas.

## Investigação obrigatória

Verificar o que esses chips representam.

Possibilidades:

- capacidade disponível;
- feature suportada;
- status booleano;
- atalhos para detalhes;
- metadado.

## Problema

Um chip normalmente representa:

- status;
- filtro;
- categoria.

Se "Número provisionado" for uma seção/atributo, usar:

```text
Número
+55 ...

Mídia
Texto, imagem...
```

Se os chips abrirem detalhes, adicionar affordance visual adequada.

Não redesenhar sem entender o comportamento.

---

# 31. "Desativar conexão"

A ação destrutiva aparece permanentemente no rodapé.

É visível e ocupa um lugar de destaque alto para uma ação rara.

## Sugestão

Mover para menu:

```text
[Editar conexão] [⋯]
                  └ Desativar conexão
```

ou para seção:

```text
Mais ações
Desativar conexão
```

Se a política de produto exigir visibilidade explícita, manter.

Sempre exigir confirmação se isso já fizer parte do padrão do projeto.

Não mudar regra de confirmação no backend.

---

# 32. Header da página Canais

Atualmente:

```text
← Setup estrutural
CANAIS DE ENTRADA
Operação
Gerencie conexões...
[Nova conexão]
```

O título `Operação` pode ser ambíguo, porque o usuário está na navegação `Canais`.

## Investigação

Verificar por que a página usa `Operação` como H1.

Se for apenas o nome do workspace, diferenciar visualmente:

```text
Canais de entrada
Operação
```

ou:

```text
Canais
Workspace: Operação
```

Se "Operação" tiver significado específico no domínio, preservar.

Evitar que breadcrumb, eyebrow e H1 comuniquem três hierarquias concorrentes.

---

# 33. "Setup estrutural" vs navegação lateral

Existe um link:

```text
← Setup estrutural
```

enquanto `Operação` continua disponível na sidebar.

## Investigação

Descobrir se "Setup estrutural":

- leva para Operação;
- representa onboarding;
- é uma rota anterior;
- possui fluxo próprio.

Se simplesmente duplica a navegação lateral, considerar remover em desktop e manter em contextos específicos.

---

# 34. Estado recomendado para página com uma conexão

Exemplo conceitual:

```text
Canais de entrada                                      [Nova conexão]
Gerencie os canais que recebem mensagens neste workspace.

⚠ Recebimento de mensagens ainda indisponível
  A configuração pode ser concluída agora.
  [Detalhes técnicos]

WhatsApp Operação Carará                                Ativa
WhatsApp · Meta Cloud

⚠ Credenciais incompletas                    [Editar conexão] [⋯]

Conexão
Provider                         Aberto
Credenciais                      Incompletas

Rota de entrada                                  [Editar rota]
✓ Configurada

Destino
Atendimento ao cliente → Novos atendimentos

────────────────────────────────────────────────────────────
Detalhes técnicos                                      [∨]
Versão        v1
Diagnóstico   CONFIGURATION_READY
Runtime       ...
```

Não copiar literalmente se os componentes atuais oferecerem solução melhor.

---

# 35. Estado recomendado para múltiplas conexões

A interface precisa continuar utilizável caso existam muitas conexões.

Exemplo:

```text
Canais de entrada                                      [Nova conexão]

[Todos 4] [Com atenção 1] [Ativos 3]

WhatsApp Operação Carará         Ativa
Meta Cloud
⚠ Credenciais incompletas
Destino: Atendimento → Novos atendimentos         [Abrir]

WhatsApp Financeiro               Ativa
Meta Cloud
✓ Configurado
Destino: Financeiro → Benefícios                  [Abrir]

Instagram Atendimento             Inativa
Meta
— Sem rota                                           [Abrir]
```

Filtros somente devem ser implementados se:

- os estados já existirem;
- os dados necessários estiverem no front;
- houver volume que justifique.

---

# PARTE C — CONSISTÊNCIA ENTRE AS DUAS TELAS

# 36. Definir um padrão de "objeto administrativo"

Áreas, filas e conexões são objetos administrativos.

Eles deveriam compartilhar uma linguagem visual.

Exemplo:

```text
Nome                     Badge de status
Descrição/metadado

Resumo

[Ação principal] [⋯]
```

Hoje cada parte usa uma composição um pouco diferente.

O agente deve procurar componentes existentes e identificar oportunidade de padronização.

---

# 37. Padrão de status

Auditar badges como:

```text
Ativa
Rota válida
Conectado
Aberto
Incompletas
```

Definir visualmente:

## Sucesso

- ativo;
- válido;
- conectado;
- pronto.

## Atenção

- incompleto;
- parcialmente configurado;
- bloqueado.

## Neutro

- versão;
- informação.

## Perigo

- erro;
- falha;
- desconectado, quando aplicável.

Não aplicar cor de sucesso a estados que não significam sucesso operacional completo.

---

# 38. Padrão de ações

Sugestão geral:

## Primária

Criação/início:

```text
Nova área
Nova fila
Nova conexão
```

## Secundária

Alteração comum:

```text
Editar
Gerenciar
Editar rota
```

## Destrutiva

```text
Desativar
Remover
```

Ações destrutivas não precisam competir visualmente com a ação principal.

Preferir menu contextual quando adequado.

---

# 39. Reduzir ações com ícone + texto repetidas

Existem diversos:

```text
✎ Editar
🗑 Desativar
```

repetidos muitas vezes na página.

Isso aumenta ruído.

Em listas densas, considerar:

```text
[Editar] [⋯]
```

ou apenas:

```text
[⋯]
```

quando a ação for claramente contextual.

Manter acessibilidade com `aria-label` e tooltip.

---

# 40. Largura de conteúdo

Na tela Operação, o conteúdo usa grande largura.

Na tela Canais, o conteúdo é consideravelmente mais estreito e centralizado.

Isso pode ser intencional, mas gera sensação de dois produtos diferentes.

## Investigação

Localizar:

- `max-width`;
- containers;
- page layouts;
- padrões do design system.

## Direção

Definir categorias coerentes:

### Página de visão/listagem

largura maior.

### Página de formulário/detalhe

largura mais controlada.

Se Canais for uma página de detalhe, a largura menor é justificável.

Não padronizar cegamente.

---

# 41. Vertical rhythm

As telas possuem bastante espaço vertical entre:

- cards;
- seções;
- headers;
- inputs.

Isso cria uma estética limpa, porém aumenta o scroll em páginas administrativas.

## Direção

Densidade moderada:

- manter breathing room entre grandes seções;
- compactar dentro de listas;
- reduzir padding de rows;
- evitar card com padding grande dentro de outro card.

---

# 42. Responsividade

Validar pelo menos:

- 1920×1080;
- 1440×900;
- 1366×768;
- 1280×720.

Na tela Operação, atenção especial:

- formulário de membro;
- papel;
- adicionar;
- ações da área;
- ações da fila;
- nomes/e-mails longos.

Na tela Canais:

- três propriedades lado a lado;
- header da conexão;
- rota;
- destino;
- alert;
- botões de edição.

Em larguras menores:

- propriedades devem empilhar;
- ações podem ir para menu;
- textos técnicos não devem estourar container;
- e-mails devem truncar corretamente.

---

# 43. Acessibilidade

Verificar:

- headings semânticos;
- labels dos selects;
- foco visível;
- menus acessíveis por teclado;
- `aria-expanded` em accordions;
- `aria-label` em botões só com ícone;
- contraste de badges;
- estados de erro associados aos inputs;
- confirmação de ações destrutivas;
- tooltips acessíveis;
- ícone não ser o único indicador de estado.

---

# 44. Loading e feedback

Auditar:

## Operação

- criar área;
- editar área;
- desativar área;
- adicionar/remover membro;
- trocar papel;
- criar fila;
- editar fila;
- desativar fila;
- adicionar/remover restrição.

## Canais

- criar conexão;
- editar conexão;
- editar rota;
- desativar conexão;
- carregar diagnóstico.

A interface deve deixar claro:

- ação em andamento;
- sucesso;
- falha;
- rollback visual em caso de erro.

Não criar optimistic update se a arquitetura atual não suportar de forma segura.

---

# 45. Checklist obrigatório no código

Antes de alterar:

## Operação

- [ ] Onde é renderizado o overview?
- [ ] Onde é renderizada cada área?
- [ ] Cada área possui componente próprio?
- [ ] Membros possuem componente próprio?
- [ ] Filas possuem componente próprio?
- [ ] Restrições possuem componente próprio?
- [ ] Existe Accordion no design system?
- [ ] Existe Drawer/Dialog?
- [ ] Existem menus contextuais?
- [ ] Existe padrão de confirmação?
- [ ] Existe padrão de badge/status?

## Canais

- [ ] Qual componente renderiza a lista/conexão?
- [ ] O card representa uma coleção ou somente uma conexão?
- [ ] É possível haver múltiplas conexões?
- [ ] O que significa "Estado do provider"?
- [ ] O que significa "Aberto"?
- [ ] O que significa "Credenciais incompletas"?
- [ ] O que representam "Número provisionado" e "Mídia suportada"?
- [ ] O que significa CONFIGURATION_READY?
- [ ] E4 e E6 precisam ser visíveis ao usuário final?
- [ ] O alert global e o alert da rota representam a mesma condição?
- [ ] Existe componente de disclosure/detalhes técnicos?

---

# 46. Ordem recomendada de implementação

## Etapa 1 — Diagnóstico

Mapear componentes e confirmar comportamentos.

Não editar antes disso.

## Etapa 2 — Operação: reduzir scroll estrutural

Prioridades:

1. colapsar áreas;
2. ocultar formulários de adição até serem solicitados;
3. compactar membros;
4. compactar filas;
5. reorganizar ações.

Essa é provavelmente a melhoria de maior impacto.

## Etapa 3 — Operação: overview

- revisar redundância dos CTAs;
- compactar métricas;
- revisar prontidão;
- revisar resumo de canais.

## Etapa 4 — Canais: hierarquia de status

- definir status principal;
- separar operacional de técnico;
- compactar propriedades;
- revisar alertas redundantes.

## Etapa 5 — Canais: progressive disclosure

- detalhes técnicos recolhíveis;
- conexão compactável;
- ações destrutivas secundárias;
- destino mais legível.

## Etapa 6 — Consistência

- badges;
- cards;
- menus;
- espaçamento;
- tipografia;
- responsividade;
- acessibilidade.

---

# 47. Prioridades resumidas

## P0 — Deve ser investigado antes de qualquer mudança

- significado de E4/E6;
- CONFIGURATION_READY;
- "Aberto";
- "Número provisionado";
- "Mídia suportada";
- diferença entre alert global e alert da rota;
- duplicação do CTA para Atendimentos;
- função de "Setup estrutural".

## P1 — Alto impacto, front-end puro

- áreas colapsáveis;
- formulários sob demanda;
- membros compactos;
- filas compactas;
- ações no header do objeto;
- detalhes técnicos recolhíveis em Canais;
- hierarquia clara de status.

## P2 — Refinamento

- microcopy;
- compactação de métricas;
- pluralização;
- responsive;
- empty states;
- loading;
- tooltips.

## P3 — Somente se houver necessidade real

- busca de áreas;
- filtros de conexões;
- persistência da expansão;
- atalhos.

---

# 48. O que NÃO fazer

Não:

- redesenhar todo o design system;
- criar nova biblioteca de UI sem necessidade;
- trocar a estrutura de rotas apenas por estética;
- alterar contratos do backend;
- criar estados fictícios;
- esconder diagnóstico necessário sem alternativa;
- mudar regras de ativação/desativação;
- transformar E4/E6 em regras novas no front;
- implementar nova política de distribuição;
- alterar significado de área, fila, operador ou supervisor;
- transformar a tela em dashboard visual complexo;
- adicionar gráficos sem necessidade operacional;
- usar animações decorativas;
- aumentar ainda mais o número de cards.

---

# 49. Validação visual obrigatória

Após as alterações:

## Operação

Capturar:

1. topo da página;
2. lista de áreas com todas colapsadas;
3. uma área expandida com membros;
4. uma área expandida com fila;
5. estado sem membros;
6. estado com restrição de operadores.

Comparar:

- scroll total;
- número de áreas visíveis;
- clareza da hierarquia;
- densidade.

## Canais

Capturar:

1. topo;
2. conexão em estado resumido;
3. detalhes expandidos;
4. rota;
5. diagnóstico técnico;
6. estado de atenção.

Comparar:

- clareza do status geral;
- quantidade de linguagem técnica em primeiro plano;
- altura do card;
- redundância de alertas.

---

# 50. Métricas visuais úteis

Não precisam ser instrumentadas no produto.

Usar apenas para avaliação da implementação.

## Operação

Perguntar:

- Quantas áreas consigo identificar em uma viewport?
- Quantos cliques são necessários para adicionar um membro?
- A área correta é óbvia antes de clicar em Editar?
- Uma ação destrutiva pode ser acionada por engano?
- É possível compreender área → fila → operadores sem ler toda a página?

## Canais

Perguntar:

- Em 3 segundos, consigo responder se o canal está operacional?
- Consigo identificar o problema principal?
- Sei para qual fila as mensagens irão?
- Consigo editar conexão sem confundir com editar rota?
- Os códigos técnicos dominam a interface?
- O card continuará utilizável com cinco conexões?

---

# 51. Formato esperado do relatório do agente

Ao final:

```markdown
# Revisão Front-end — Operação e Canais

## Diagnóstico do código

### Operação
- componentes:
- estados:
- padrões reutilizados:
- limitações:

### Canais
- componentes:
- estados:
- significado dos diagnósticos:
- padrões reutilizados:
- limitações:

## Mudanças implementadas

### Operação
- ...

### Canais
- ...

## Recomendações não implementadas

### Por não serem necessárias
- ...

### Por dependerem de backend
- ...

### Por conflitarem com o design system atual
- ...

## Regressão funcional

- criar área: OK
- editar área: OK
- adicionar membro: OK
- alterar papel: OK
- remover membro: OK
- criar fila: OK
- editar fila: OK
- restrições: OK
- criar conexão: OK
- editar conexão: OK
- editar rota: OK
- desativar: OK

## Validação visual

- 1920×1080: OK
- 1440×900: OK
- 1366×768: OK
- 1280×720: OK

## Evidências

- antes/depois Operação
- antes/depois Canais
```

---

# 52. Regra final para o agente

Este documento é um **guia de revisão**, não uma especificação cega.

O agente deve usar o código atual como fonte de verdade.

Para cada recomendação:

1. localizar a implementação atual;
2. entender o comportamento;
3. verificar componentes já disponíveis;
4. confirmar que a mudança é puramente front-end;
5. implementar a solução mínima que gere ganho real;
6. validar visualmente;
7. garantir regressão funcional;
8. explicar quando decidir não seguir a sugestão.

A meta é deixar as telas mais próximas de uma **ferramenta administrativa madura**, especialmente em:

- progressive disclosure;
- densidade adequada;
- hierarquia de status;
- consistência de ações;
- redução de scroll;
- separação entre informação operacional e detalhe técnico.

Sem alterar a estrutura funcional do backend.
