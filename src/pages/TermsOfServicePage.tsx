import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const TermsOfServicePage = () => {
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  return (
    <div className="h-screen overflow-y-auto bg-background dark:bg-[#0f0f0f] text-foreground">
      <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="mb-8">
          <Link
            to="/login"
            className={buttonVariants({
              variant: "ghost",
              className: "mb-6 -ml-4",
            })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-primary">
            {t("legal.termsTitle")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("legal.lastUpdatedTerms", { date: new Date().toLocaleDateString(locale) })}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-base leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar e utilizar os serviços do nosso sistema, você concorda
              expressamente em cumprir e estar sujeito aos seguintes Termos de
              Serviço. Se você não concorda com qualquer parte destes termos,
              não deve utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              2. Uso dos Serviços
            </h2>
            <p className="mb-4">
              Nossa plataforma fornece um conjunto de ferramentas para
              gerenciamento de agentes, fluxos de mensagens, integrações de
              calendário, entre outros. Ao utilizar os serviços, você concorda
              que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Você fornecerá informações verdadeiras, precisas, atuais e
                completas sobre si mesmo ao se registrar.
              </li>
              <li>
                Você é o único responsável por manter a confidencialidade de sua
                conta e senha.
              </li>
              <li>
                Você não utilizará a plataforma para fins ilegais, não
                autorizados ou que violem quaisquer leis em sua jurisdição
                (incluindo, mas não se limitando a, leis de direitos autorais e
                de privacidade).
              </li>
              <li>
                Você não transmitirá nenhum worm, vírus ou qualquer código de
                natureza destrutiva.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              3. Contas de Usuário
            </h2>
            <p>
              Para acessar certos recursos da plataforma, você pode precisar
              registrar uma conta. Você é responsável por todas as atividades
              que ocorrem sob sua conta. Reservamo-nos o direito de encerrar
              contas, remover ou editar conteúdos e cancelar serviços, a nosso
              exclusivo critério, caso vejamos violações aos Termos de Serviço
              ou atividades fraudulentas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              4. Propriedade Intelectual
            </h2>
            <p>
              O serviço e seu conteúdo original, recursos e funcionalidade são e
              permanecerão sendo propriedade exclusiva da nossa empresa e de
              seus licenciadores. O sistema é protegido por direitos autorais,
              marcas registradas e outras leis tanto no país quanto em
              jurisdições estrangeiras.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              5. Integrações de Terceiros
            </h2>
            <p>
              Nossa plataforma permite conexões com serviços de terceiros (como
              WhatsApp, Google Calendar, etc). Ao utilizar tais integrações,
              você também concorda em cumprir com os termos e as políticas de
              privacidade desses respectivos serviços de terceiros. Não somos
              responsáveis pelo funcionamento ou políticas dessas plataformas
              externas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              6. Limitação de Responsabilidade
            </h2>
            <p>
              Em nenhuma circunstância seremos responsáveis por quaisquer danos
              indiretos, incidentais, especiais, consequenciais ou punitivos,
              incluindo, sem limitação, perda de lucros, dados, uso, boa vontade
              ou outras perdas intangíveis, resultantes do seu acesso ou uso ou
              incapacidade de acessar ou utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              7. Modificações dos Termos
            </h2>
            <p>
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar
              ou substituir estes Termos a qualquer momento. Se uma revisão for
              material, tentaremos fornecer um aviso com pelo menos 30 dias de
              antecedência antes de quaisquer novos termos entrarem em vigor. O
              que constitui uma alteração material será determinado a nosso
              exclusivo critério.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              8. Contato
            </h2>
            <p>
              Se você tiver alguma dúvida ou questão sobre estes Termos de
              Serviço, por favor, entre em contato com nosso time de suporte.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
