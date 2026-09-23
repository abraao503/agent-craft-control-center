# Contas de teste por role

Use este fluxo quando uma validação precisar entrar como um usuário diferente
da conta administrativa de teste compartilhada.

## Conta administrativa compartilhada

As credenciais da conta administrativa do tenant de teste são fornecidas pelo
`.env` na raiz compartilhada do workspace. O runner E2E já as carrega em
runtime. Use-as apenas contra o ambiente local/de QA configurado para testes;
antes de autenticar ou alterar usuários, confirme que a aplicação e a API não
apontam para produção.

Não leia nem copie os valores para comandos, documentação, ledger, código,
logs, mensagens de erro, screenshots, vídeos, traces ou relatórios. Não altere
a senha da conta administrativa compartilhada. O fato de existir uma credencial
no `.env` não autoriza seu uso em outro tenant ou ambiente.

## Preparar um usuário para um role

1. Consulte a [matriz atual de permissões](autorizacao-e-tenancy.md) e a tarefa
   que será validada. Não deduza o que uma role pode fazer apenas pelo nome.
2. Entre com a conta administrativa de teste e confirme a empresa/tenant de
   teste. Para um novo usuário, use a tela de criação no contexto correto:
   contexto da empresa para roles da empresa; contexto do workspace para roles
   do workspace. A interface filtra as roles pela hierarquia e pelo contexto,
   e a API continua sendo a autoridade para validar essas operações.
3. Crie uma conta dedicada com nome/e-mail identificáveis como teste e uma
   senha temporária própria. O formulário de criação aceita de 8 a 16
   caracteres. Use somente dados fictícios, sem reutilizar dados pessoais ou
   credenciais de pessoas reais.
4. Se for necessário reutilizar uma conta, confirme primeiro que ela é uma
   conta dedicada de teste do mesmo tenant. Na edição do usuário do workspace,
   informe uma nova senha temporária de pelo menos 8 caracteres; deixar o campo
   vazio mantém a senha atual. Preserve role e vínculos existentes, salvo
   quando a tarefa pedir explicitamente para alterá-los.
5. Encerre a sessão administrativa e entre com o usuário preparado em uma
   sessão separada. Confirme role, empresa, workspace e, no módulo operacional,
   os vínculos de área/fila necessários para a jornada.
6. Ao terminar, remova usuários criados para a validação ou restaure as
   alterações de uma conta de teste existente, se isso fizer parte do escopo e
   for seguro. Não remova contas compartilhadas nem altere usuários fora do
   tenant de teste. Registre apenas a identificação não sensível e o resultado
   da validação; nunca registre a senha.

Os fluxos de interface ficam em
[`CreateCompanyUserDialog`](../../src/components/admin/CreateCompanyUserDialog.tsx)
e [`EditWorkspaceUserDialog`](../../src/components/admin/EditWorkspaceUserDialog.tsx).
Eles ajudam a escolher role e contexto, mas não substituem a checagem de
autorização da API.

## Teste manual e smoke automatizado

Esta preparação manual permite manter usuários de teste dedicados quando uma
validação por role exigir isso. Para testes automatizados direcionados a outra
role, crie ou atualize uma fixture identificável dentro do teste e remova-a ou
restaure-a no teardown.

O smoke E2E genérico usa a conta administrativa apenas para autenticação e não
deve deixar usuários persistentes como efeito colateral. Não converta a conta
compartilhada em fixture de role, não grave suas credenciais e não desative a
limpeza para obter um resultado verde.
