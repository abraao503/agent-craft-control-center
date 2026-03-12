import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const PrivacyPolicyPage = () => {
  return (
    <div className="h-screen overflow-y-auto bg-background dark:bg-[#0f0f0f] text-foreground">
      <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className={buttonVariants({
              variant: "ghost",
              className: "mb-6 -ml-4",
            })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-primary">
            Política de Privacidade
          </h1>
          <p className="text-lg text-muted-foreground">
            Última atualização: 12 de Março de 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-base leading-relaxed text-foreground/90">
          <p>
            A <strong>7 Agentes</strong> ("nós", "nosso" ou "nossa") está
            comprometida em proteger a privacidade dos nossos usuários. Esta
            Política de Privacidade descreve como coletamos, usamos,
            armazenamos, compartilhamos e protegemos as suas informações
            pessoais ao utilizar a nossa plataforma, incluindo integrações com
            serviços de terceiros como o <strong>Google Calendar</strong>.
          </p>

          {/* Seção 1 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              1. Informações que Coletamos
            </h2>
            <p className="mb-4">
              Ao utilizar os nossos serviços, podemos coletar os seguintes tipos
              de informações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Informações de Identificação Pessoal:</strong> Nome,
                endereço de e-mail, número de telefone e outros dados que você
                nos fornece diretamente ao criar sua conta ou utilizar a
                plataforma.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Informações sobre como você
                interage com nossa plataforma, incluindo tempos de acesso,
                páginas visualizadas, ações realizadas e seu endereço IP.
              </li>
              <li>
                <strong>Dados de Integrações com Serviços de Terceiros:</strong>{" "}
                Quando você conecta serviços de terceiros (como Google Calendar
                ou WhatsApp), podemos acessar os dados necessários para o
                funcionamento dessas integrações, conforme descrito nas seções a
                seguir.
              </li>
            </ul>
          </section>

          {/* Seção 2 - Uso de Dados do Google */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              2. Uso de Dados do Google
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-4">
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Google Calendar
              </h3>
              <p className="mb-4">
                A <strong>7 Agentes</strong> solicita acesso ao seu{" "}
                <strong>Google Calendar</strong> exclusivamente para fornecer
                funcionalidades de agendamento automatizado através do nosso
                assistente virtual de inteligência artificial. Ao conectar sua
                conta do Google, utilizamos os seguintes dados:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Leitura de eventos:</strong> Acessamos os eventos
                  existentes no seu calendário para verificar disponibilidade de
                  horários e evitar o agendamento de compromissos em horários já
                  ocupados.
                </li>
                <li>
                  <strong>Criação de eventos:</strong> Criamos novos eventos no
                  seu calendário quando o assistente virtual agenda reuniões ou
                  compromissos em seu nome.
                </li>
                <li>
                  <strong>Atualização de eventos:</strong> Atualizamos eventos
                  existentes quando há alterações solicitadas por você ou pelos
                  participantes da reunião.
                </li>
              </ul>
              <p className="mb-4">
                <strong>
                  Não utilizamos os dados do Google Calendar para nenhum outro
                  propósito
                </strong>{" "}
                além dos descritos acima. Especificamente:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Não utilizamos seus dados do Google para fins publicitários.
                </li>
                <li>
                  Não utilizamos seus dados do Google para treinar modelos de
                  inteligência artificial ou machine learning.
                </li>
                <li>
                  Não utilizamos seus dados do Google para realizar análises de
                  perfil ou personalização de conteúdo fora do escopo do
                  agendamento.
                </li>
              </ul>
              <p>
                O uso dos dados recebidos das APIs do Google está em
                conformidade com a{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Política de Dados de Usuário dos Serviços de API do Google
                </a>
                , incluindo os requisitos de Uso Limitado.
              </p>
            </div>
          </section>

          {/* Seção 3 - Uso de Inteligência Artificial */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              3. Uso de Inteligência Artificial
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-4">
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Modelo de IA de Terceiros (OpenAI / GPT)
              </h3>
              <p className="mb-4">
                A <strong>7 Agentes</strong> utiliza serviços de inteligência
                artificial fornecidos por terceiros para potencializar as
                funcionalidades dos assistentes virtuais disponíveis na
                plataforma. Atualmente, a plataforma integra-se com os modelos{" "}
                <strong>GPT</strong> da <strong>OpenAI</strong>.
              </p>
              <p className="mb-4">
                <strong>Importante:</strong> A 7 Agentes{" "}
                <strong>não fornece nem intermedia chaves de API</strong> da
                OpenAI. Cada usuário é responsável por fornecer e gerenciar sua
                própria chave de API da OpenAI para utilizar as funcionalidades
                de inteligência artificial da plataforma. Isso significa que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  As chamadas à API da OpenAI são realizadas utilizando a chave
                  de API fornecida pelo próprio usuário.
                </li>
                <li>
                  O relacionamento contratual referente ao uso dos serviços da
                  OpenAI é diretamente entre o usuário e a OpenAI.
                </li>
                <li>
                  O usuário é responsável por cumprir os{" "}
                  <a
                    href="https://openai.com/policies/terms-of-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="https://openai.com/policies/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Política de Privacidade da OpenAI
                  </a>
                  .
                </li>
                <li>
                  A 7 Agentes não tem acesso, não armazena e não compartilha as
                  chaves de API dos usuários além do necessário para o
                  funcionamento da plataforma.
                </li>
              </ul>
              <p>
                Os dados enviados à OpenAI através da plataforma podem incluir
                mensagens de conversas e informações de contexto necessárias
                para o funcionamento dos assistentes virtuais. Recomendamos que
                os usuários consultem a{" "}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Política de Privacidade da OpenAI
                </a>{" "}
                para entender como a OpenAI trata os dados recebidos através de
                sua API.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              4. Como Usamos as Suas Informações
            </h2>
            <p className="mb-4">
              Utilizamos as informações coletadas para os seguintes fins:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fornecer, operar e manter nossos serviços e a plataforma,
                incluindo a funcionalidade de agendamento automatizado via
                Google Calendar.
              </li>
              <li>Processar e gerenciar sua conta de usuário.</li>
              <li>Melhorar, personalizar e expandir nossos serviços.</li>
              <li>
                Compreender e analisar como você utiliza a nossa plataforma para
                melhorar a experiência do usuário.
              </li>
              <li>Desenvolver novos produtos, recursos e funcionalidades.</li>
              <li>
                Comunicar-nos com você para suporte, atualizações de serviço e
                informações relevantes à sua conta.
              </li>
            </ul>
          </section>

          {/* Seção 5 - Compartilhamento */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              5. Compartilhamento, Transferência e Divulgação de Dados
            </h2>
            <p className="mb-4">
              <strong>
                Não vendemos, alugamos ou comercializamos suas informações
                pessoais ou dados do Google para terceiros.
              </strong>
            </p>
            <p className="mb-4">
              Podemos compartilhar suas informações apenas nas seguintes
              circunstâncias limitadas:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>Provedores de serviços essenciais:</strong>{" "}
                Compartilhamos dados com provedores de infraestrutura e serviços
                que nos auxiliam na operação da plataforma (como serviços de
                hospedagem em nuvem e banco de dados). Esses provedores estão
                contratualmente obrigados a proteger seus dados e usá-los apenas
                para os fins para os quais foram compartilhados.
              </li>
              <li>
                <strong>Exigência legal:</strong> Podemos divulgar suas
                informações quando exigido por lei, regulamentação, processo
                judicial ou solicitação governamental aplicável.
              </li>
              <li>
                <strong>Proteção de direitos:</strong> Podemos divulgar
                informações quando necessário para proteger nossos direitos
                legais, a segurança da plataforma ou a segurança de nossos
                usuários.
              </li>
            </ul>
            <p>
              <strong>Em relação aos dados do Google especificamente:</strong>{" "}
              Não transferimos, compartilhamos ou divulgamos dados obtidos
              através das APIs do Google para terceiros, exceto conforme
              necessário para fornecer e melhorar os recursos do aplicativo
              visíveis ao usuário, conforme exigido por lei, ou com o seu
              consentimento explícito.
            </p>
          </section>

          {/* Seção 6 - Segurança */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              6. Segurança e Proteção dos Dados
            </h2>
            <p className="mb-4">
              Levamos a segurança dos seus dados muito a sério. Empregamos as
              seguintes medidas de segurança organizacionais e técnicas para
              proteger as informações que coletamos e armazenamos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Criptografia em trânsito:</strong> Todas as comunicações
                entre seu navegador e nossos servidores são protegidas através
                de criptografia TLS/SSL (HTTPS), garantindo que seus dados não
                possam ser interceptados durante a transmissão.
              </li>
              <li>
                <strong>Criptografia em repouso:</strong> As informações
                sensíveis armazenadas em nossos bancos de dados são protegidas
                por criptografia em repouso.
              </li>
              <li>
                <strong>Controle de acesso:</strong> Implementamos controles
                rigorosos de acesso baseados em função (RBAC) para garantir que
                apenas pessoal autorizado tenha acesso aos dados dos usuários, e
                somente quando necessário.
              </li>
              <li>
                <strong>Autenticação segura:</strong> Utilizamos protocolos
                seguros de autenticação, incluindo OAuth 2.0 para integrações
                com serviços de terceiros como o Google, e tokens de
                autenticação com expiração para acesso à plataforma.
              </li>
              <li>
                <strong>Monitoramento contínuo:</strong> Nossos sistemas são
                monitorados continuamente para detectar e responder rapidamente
                a quaisquer ameaças de segurança ou acessos não autorizados.
              </li>
              <li>
                <strong>Infraestrutura segura:</strong> Nossos servidores são
                hospedados em provedores de nuvem que possuem certificações de
                segurança reconhecidas pela indústria.
              </li>
            </ul>
          </section>

          {/* Seção 7 - Retenção e Exclusão */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              7. Retenção e Exclusão de Dados
            </h2>
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              7.1. Período de Retenção
            </h3>
            <p className="mb-4">
              Retemos suas informações pessoais pelo tempo necessário para
              cumprir os propósitos descritos nesta Política de Privacidade, a
              menos que um período de retenção mais longo seja exigido ou
              permitido por lei. Especificamente:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>
                <strong>Dados da conta:</strong> Mantemos os dados da sua conta
                enquanto ela estiver ativa ou conforme necessário para fornecer
                os serviços.
              </li>
              <li>
                <strong>Dados do Google Calendar:</strong> Os dados acessados do
                Google Calendar são utilizados em tempo real para verificação de
                disponibilidade e criação/atualização de eventos. Não
                armazenamos cópias permanentes dos seus dados do Google Calendar
                em nossos servidores além do necessário para o funcionamento
                imediato do serviço.
              </li>
              <li>
                <strong>Dados de uso e logs:</strong> Retemos dados de uso e
                registros de acesso por um período máximo de 12 (doze) meses
                para fins de análise, segurança e melhoria da plataforma.
              </li>
            </ul>

            <h3 className="text-lg font-semibold mb-3 text-foreground">
              7.2. Exclusão de Dados
            </h3>
            <p className="mb-4">
              Quando o período de retenção expira para um determinado tipo de
              dado, iremos excluí-lo ou anonimizá-lo de forma segura. Além
              disso:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>
                <strong>Exclusão da conta:</strong> Ao solicitar a exclusão da
                sua conta, todos os seus dados pessoais serão removidos de
                nossos sistemas em até 30 (trinta) dias, exceto quando a
                retenção for exigida por lei ou para fins legítimos de
                cumprimento de obrigações legais.
              </li>
              <li>
                <strong>Revogação de acesso ao Google:</strong> Você pode
                revogar o acesso da 7 Agentes ao seu Google Calendar a qualquer
                momento através das{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  configurações de permissão da sua conta Google
                </a>
                . Ao revogar o acesso, deixaremos imediatamente de acessar os
                dados do seu Google Calendar.
              </li>
              <li>
                <strong>Exclusão de dados específicos do Google:</strong> Ao
                revogar o acesso ou solicitar a exclusão, quaisquer tokens de
                acesso e dados relacionados ao Google armazenados em nossos
                servidores serão removidos em até 30 (trinta) dias.
              </li>
            </ul>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 my-4">
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Como solicitar a exclusão dos seus dados
              </h3>
              <p className="mb-3">
                Você pode solicitar a exclusão dos seus dados pessoais,
                incluindo dados relacionados ao Google, a qualquer momento,
                através de um dos seguintes métodos:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  Enviando um e-mail para:{" "}
                  <strong>contato@7agentes.com.br</strong>
                </li>
                <li>
                  Utilizando a opção de exclusão de conta disponível nas
                  configurações do seu perfil na plataforma.
                </li>
              </ul>
              <p>
                Responderemos à sua solicitação em até 15 (quinze) dias úteis.
              </p>
            </div>
          </section>

          {/* Seção 8 - Direitos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              8. Seus Direitos
            </h2>
            <p className="mb-4">
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você
              tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Acesso:</strong> Solicitar uma cópia dos dados pessoais
                que mantemos sobre você.
              </li>
              <li>
                <strong>Correção:</strong> Solicitar a correção de dados
                pessoais incompletos, inexatos ou desatualizados.
              </li>
              <li>
                <strong>Exclusão:</strong> Solicitar a exclusão dos seus dados
                pessoais, observadas as exceções legais.
              </li>
              <li>
                <strong>Portabilidade:</strong> Solicitar a transferência dos
                seus dados pessoais para outro fornecedor de serviços.
              </li>
              <li>
                <strong>Revogação do consentimento:</strong> Revogar o
                consentimento para tratamento de dados a qualquer momento.
              </li>
              <li>
                <strong>Informação:</strong> Ser informado sobre as entidades
                com as quais compartilhamos seus dados.
              </li>
            </ul>
          </section>

          {/* Seção 9 - Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              9. Cookies e Tecnologias Similares
            </h2>
            <p>
              Utilizamos cookies e tecnologias semelhantes para manter sua
              sessão ativa, lembrar suas preferências e melhorar sua experiência
              na plataforma. Cookies essenciais são necessários para o
              funcionamento básico do site. Você pode configurar seu navegador
              para recusar cookies, mas isso pode afetar a funcionalidade da
              plataforma.
            </p>
          </section>

          {/* Seção 10 - Alterações */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              10. Alterações a Esta Política
            </h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente.
              Avisaremos sobre quaisquer mudanças significativas postando a nova
              política nesta página, atualizando a data no topo deste documento
              e, quando aplicável, notificando-o por e-mail. Recomendamos que
              você revise esta política regularmente.
            </p>
          </section>

          {/* Seção 11 - Contato */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              11. Contato
            </h2>
            <p className="mb-4">
              Se você tiver dúvidas, preocupações ou solicitações sobre esta
              Política de Privacidade ou sobre o tratamento dos seus dados
              pessoais, entre em contato conosco:
            </p>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
              <p>
                <strong>7 Agentes</strong>
              </p>
              <p>
                E-mail: <strong>contato@7agentes.com.br</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
