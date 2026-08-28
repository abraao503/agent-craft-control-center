import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalSetup } from "@/hooks/useOperationalSetup";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { usePermissions } from "@/hooks/usePermissions";
import { OperationalAreasCard } from "@/components/operation/OperationalAreasCard";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Radio,
} from "lucide-react";

const MISSING_LABELS = {
  ACTIVE_AREA: "Área ativa",
  ACTIVE_QUEUE: "Fila ativa",
  ACTIVE_MEMBER: "Membro operacional",
  FALLBACK_ROUTE: "Rota de fallback",
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
  const hasPendingFallback =
    setup?.readiness.missing.includes("FALLBACK_ROUTE") ?? false;
  const hasPendingStructuralItems =
    setup?.readiness.missing.some((item) => item !== "FALLBACK_ROUTE") ?? false;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Workspace de operação
          </p>
          <CardTitle className="mt-3 text-3xl">
            {currentWorkspace?.name || "Operação"}
          </CardTitle>
          <CardDescription>
            Acompanhe a estrutura operacional deste workspace e retome a
            configuração quando novas seções estiverem disponíveis.
          </CardDescription>
        </CardHeader>
      </Card>

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
          <AlertTitle>Não foi possível carregar o setup</AlertTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                {isStructured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                Setup estrutural
              </CardTitle>
              <CardDescription>
                {isStructured
                  ? `A estrutura mínima foi concluída${
                      setup.setupCompletedAt
                        ? ` em ${formatDateTime(setup.setupCompletedAt)}`
                        : "."
                    }`
                  : "Ainda existem itens estruturais para configurar."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
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

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Prontidão</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {setup.readiness.status === "READY_FOR_ACTIVATION"
                    ? "Pronto para a ativação prevista em etapa posterior."
                    : isStructured && hasPendingFallback && !hasPendingStructuralItems
                      ? "A estrutura está pronta, mas a ativação permanece bloqueada até a rota de fallback ser entregue em E3."
                    : "Bloqueado até que os itens abaixo sejam concluídos."}
                </p>
                {setup.readiness.missing.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {setup.readiness.missing.map((item) => (
                      <li key={item}>• {MISSING_LABELS[item]}</li>
                    ))}
                  </ul>
                )}
                {setup.readiness.deferredTo.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Dependências posteriores: {setup.readiness.deferredTo.join(
                      ", "
                    )}.
                  </p>
                )}
              </div>
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
          <AlertTitle>Setup indisponível</AlertTitle>
          <AlertDescription>
            Este workspace ainda não possui uma configuração operacional
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
              Conexões, rotas e diagnóstico do workspace operacional.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/operation/channels">
              {canManageChannels ? "Administrar canais" : "Ver canais"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
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
              {channelsQuery.data?.total ?? 0} conexão(ões)
            </span>
            <span className="rounded-md border px-3 py-2">
              {validRoutes} rota(s) válida(s)
            </span>
            <span className="rounded-md border px-3 py-2">
              Tráfego bloqueado até E4
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
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
