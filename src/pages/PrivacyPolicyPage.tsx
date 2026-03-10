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
            to="/login"
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
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-base leading-relaxed text-foreground/90">
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
                endereço de e-mail, número de telefone, e outros dados que você
                nos fornece diretamente.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Informações sobre como você
                interage com nossa plataforma, tempos de acesso, páginas
                visualizadas e seu endereço IP.
              </li>
              <li>
                <strong>Integrações:</strong> Quando você conecta serviços de
                terceiros (como Google Calendar ou WhatsApp), podemos acessar os
                dados necessários para o funcionamento contínuo destas
                integrações de acordo com as permissões concedidas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              2. Como Usamos as Suas Informações
            </h2>
            <p className="mb-4">
              As informações que coletamos são utilizadas para os seguintes
              propósitos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, operar e manter nossos serviços e a plataforma.</li>
              <li>Melhorar, personalizar e expandir nossos serviços.</li>
              <li>
                Compreender e analisar como você utiliza a nossa plataforma.
              </li>
              <li>
                Desenvolver novos produtos, serviços, recursos e
                funcionalidades.
              </li>
              <li>
                Comunicar com você, seja diretamente ou de forma automatizada,
                para atualizações, suporte ao cliente e envio de informações
                operacionais ou de marketing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              3. Compartilhamento de Informações
            </h2>
            <p className="mb-4">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais
              com terceiros, exceto nas seguintes circunstâncias:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Com provedores de serviços:</strong> Podemos
                compartilhar suas informações com parceiros que prestam serviços
                em nosso nome, como processamento de pagamentos, análise de
                dados e entrega de e-mails, desde que sob acordos estritos de
                confidencialidade.
              </li>
              <li>
                <strong>Por exigência legal:</strong> Podemos divulgar suas
                informações quando acreditarmos que a divulgação é necessária
                para cumprir a lei, regulamentos ou ordens judiciais.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              4. Segurança dos Dados
            </h2>
            <p>
              Empregamos medidas de segurança organizacionais e técnicas para
              proteger as informações que coletamos e armazenamos. No entanto,
              lembre-se de que nenhuma transmissão pela internet ou método de
              armazenamento eletrônico é 100% seguro e confiável, e não podemos
              garantir total segurança.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              5. Seus Direitos e Opções
            </h2>
            <p>
              Dependendo de sua localização, você pode ter o direito de acessar,
              corrigir ou excluir os dados pessoais que mantemos sobre você.
              Além disso, você pode ter o direito de restringir ou se opor a
              certos tipos de processamento de seus dados. Caso deseje exercer
              esses direitos, entre em contato conosco através dos nossos canais
              de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              6. Alterações a Esta Política
            </h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente.
              Avisaremos sobre quaisquer mudanças postando a nova política nesta
              página e atualizando a data no topo deste documento. Recomendamos
              que você revise esta página regularmente para estar ciente de
              quaisquer alterações.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              7. Contato
            </h2>
            <p>
              Se você tiver alguma dúvida ou indagação sobre esta Política de
              Privacidade, não hesite em nos contatar através do nosso suporte
              ou e-mail de atendimento disponível na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
