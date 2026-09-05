import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Bot, Radio, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";

export default function OperationAgentsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const canViewAssistants = has("view:assistant");
  const canManageTriageIntegrations = has("manage:operation-setup");
  const canViewChannels = has("view:operation-channels");

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para configurar agentes.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="border-b pb-6">
        <Link
          to="/operation"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-3 mb-2",
          })}
        >
          Configuração operacional
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Configuração operacional
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Agentes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Escolha o tipo de recurso que deseja configurar. Assistentes de
          atendimento são recursos nativos; integrações de triagem conectam
          serviços externos ao fluxo operacional.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {canViewAssistants ? (
          <AgentCategoryCard
            icon={<Bot className="h-5 w-5 text-primary" />}
            title="Assistentes de atendimento"
            description="Configure recursos nativos que podem responder atendimentos e participar das rotas de entrada."
            to="/operation/agents/assistants"
            actionLabel="Configurar assistentes"
          />
        ) : null}

        {canManageTriageIntegrations ? (
          <AgentCategoryCard
            icon={<Radio className="h-5 w-5 text-primary" />}
            title="Integrações de triagem"
            description="Cadastre serviços externos que analisam a entrada e devolvem uma decisão para a operação."
            to="/operation/agents/triage"
            actionLabel="Configurar integrações"
          />
        ) : null}
      </div>

      {canViewChannels ? (
        <Card>
          <CardHeader>
            <CardTitle>Onde os agentes são usados?</CardTitle>
            <CardDescription>
              Depois de configurar um recurso, vincule-o a uma rota de entrada
              em Canais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/operation/channels"
              className={buttonVariants({ variant: "outline" })}
            >
              Abrir canais
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function AgentCategoryCard({
  icon,
  title,
  description,
  to,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Link to={to} className={buttonVariants({ variant: "outline" })}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
