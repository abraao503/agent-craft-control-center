import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalSetup } from "@/hooks/useOperationalSetup";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { usePermissions } from "@/hooks/usePermissions";
import { OperationalAreasCard } from "@/components/operation/OperationalAreasCard";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

const MISSING_LABELS = {
  ACTIVE_AREA: "Área ativa",
  ACTIVE_QUEUE: "Fila ativa",
  ACTIVE_MEMBER: "Membro operacional",
  FALLBACK_ROUTE: "Rota alternativa",
} as const;

export default function OperationLandingPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const setupQuery = useOperationalSetup();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewChannels = has("view:operation-channels");
  const channelsQuery = useOperationalChannels(
    workspaceId,
    1,
    canViewChannels,
  );

  const setup = setupQuery.data;
  const isStructured = setup?.setupStatus === "STRUCTURED";
  const isReady = setup?.readiness.status === "READY_FOR_ACTIVATION";
  const hasPendingFallback =
    setup?.readiness.missing.includes("FALLBACK_ROUTE") ?? false;
  const hasPendingStructuralItems =
    setup?.readiness.missing.some((item) => item !== "FALLBACK_ROUTE") ?? false;

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Visão geral da operação
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {currentWorkspace?.name || "Operação"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acesse a fila de atendimentos e mantenha áreas, canais e distribuição
            prontos para a equipe.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {has("manage:operation-setup") ? (
            <Link
              to="/operation/distribution"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Distribuição
            </Link>
          ) : null}
          {has("view:operation-attendances") ? (
            <Link
              to="/operation/attendances"
              className={buttonVariants({ size: "lg" })}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Abrir atendimentos
            </Link>
          ) : null}
          {has("view:assistant") ? (
            <Link
              to="/operation/assistants"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Bot className="mr-2 h-4 w-4" />
              Assistentes
            </Link>
          ) : null}
          {has("manage:operation-setup") ? (
            <Link
              to="/operation/triage-agents"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Bot className="mr-2 h-4 w-4" />
              Agentes de triagem
            </Link>
          ) : null}
        </div>
      </header>

      {setupQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">
              Carregando configuração operacional
            </span>
          </CardContent>
        </Card>
      ) : setupQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a configuração</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Verifique sua permissão ou tente novamente.
            <Button
              variant="outline"
              size="sm"
              onClick={() => setupQuery.refetch()}
              disabled={setupQuery.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : setup ? (
        <>
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-card/80 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                {isReady ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                Estrutura da operação
                </CardTitle>
                <CardDescription className="mt-1">
                  {isStructured
                    ? `Configuração estrutural concluída${
                      setup.setupCompletedAt
                        ? ` em ${formatDateTime(setup.setupCompletedAt)}`
                        : "."
                    }`
                    : "Ainda existem itens estruturais para configurar."}
                </CardDescription>
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium sm:mt-0 ${
                isReady
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}>
                {isReady ? "Estrutura pronta" : "Configuração pendente"}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Metric label="Áreas ativas" value={setup.counts.activeAreas} />
                <Metric
                  label="Filas ativas"
                  value={setup.counts.activeQueues}
                />
                <Metric
                  label="Membros ativos"
                  value={setup.counts.activeMembers}
                />
              </div>

              {!isReady ? (
                <div className="rounded-lg bg-amber-50/70 p-4 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {isStructured && hasPendingFallback && !hasPendingStructuralItems
                      ? "Configure a rota alternativa para concluir a ativação."
                      : "Conclua os itens abaixo para liberar a operação."}
                  </p>
                  {setup.readiness.missing.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {setup.readiness.missing.map((item) => (
                      <li key={item}>• {MISSING_LABELS[item]}</li>
                    ))}
                  </ul>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
          <OperationalAreasCard workspaceId={currentWorkspace?.id} />
          {canViewChannels ? (
            <OperationalChannelsEntryCard
              channelsQuery={channelsQuery}
              canManageChannels={has("manage:operation-channels")}
            />
          ) : null}
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração indisponível</AlertTitle>
          <AlertDescription>
              Este ambiente ainda não possui uma configuração operacional
            inicializada.
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}

function OperationalChannelsEntryCard({
  channelsQuery,
  canManageChannels,
}: {
  channelsQuery: ReturnType<typeof useOperationalChannels>;
  canManageChannels: boolean;
}) {
  const channels = channelsQuery.data?.items ?? [];
  const validRoutes = channels.filter(
    (channel) => channel.route.configurationStatus === "VALID",
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Radio className="h-5 w-5 text-primary" />
              Canais de entrada
            </CardTitle>
            <CardDescription>
              Conexões, rotas e diagnóstico do ambiente operacional.
            </CardDescription>
          </div>
          <Link
            to="/operation/channels"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {canManageChannels ? "Administrar canais" : "Ver canais"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {channelsQuery.isLoading ? (
          <div className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando conexões...
          </div>
        ) : channelsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Diagnóstico indisponível</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Abra a seção de canais ou tente novamente.
              <Button
                size="sm"
                variant="outline"
                onClick={() => channelsQuery.refetch()}
                disabled={channelsQuery.isFetching}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-md border px-3 py-2">
              {pluralizeCount(channelsQuery.data?.total ?? 0, "canal conectado", "canais conectados")}
            </span>
            <span className="rounded-md border px-3 py-2">
              {pluralizeCount(validRoutes, "rota pronta", "rotas prontas")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:block">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold sm:mt-1">{value}</p>
    </div>
  );
}

function pluralizeCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
