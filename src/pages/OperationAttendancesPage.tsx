import { Link } from "react-router-dom";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalAttendanceOptions,
  useOperationalAttendanceSummary,
} from "@/hooks/useOperationalAttendances";
import { usePermissions } from "@/hooks/usePermissions";
import { AttendanceStatus } from "@/types/operation-attendance";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
  PENDING: "Pendentes",
  CLOSED: "Encerrados",
};

const STATUS_ORDER: AttendanceStatus[] = [
  "TRIAGE",
  "WAITING_QUEUE",
  "IN_PROGRESS",
  "PENDING",
  "CLOSED",
];

export default function OperationAttendancesPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");
  const summaryQuery = useOperationalAttendanceSummary(
    workspaceId,
    {},
    canViewAttendances,
  );
  const optionsQuery = useOperationalAttendanceOptions(
    workspaceId,
    canViewAttendances,
  );

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em workspaces operacionais</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para abrir os atendimentos.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const summary = summaryQuery.data;
  const hasQueryError = summaryQuery.isError || optionsQuery.isError;

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Operação / atendimento humano
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Atendimentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Acompanhe os ciclos do workspace e opere cada conversa dentro do
            escopo autorizado.
          </p>
        </div>
        <Link
          to="/operation"
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar para operação
        </Link>
      </header>

      {hasQueryError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar o resumo da inbox</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Tente novamente para atualizar o escopo operacional.
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void summaryQuery.refetch();
                void optionsQuery.refetch();
              }}
              disabled={summaryQuery.isFetching || optionsQuery.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryMetric
          label="Total visível"
          value={summary?.total}
          loading={summaryQuery.isLoading}
        />
        <SummaryMetric
          label="Com novas mensagens"
          value={summary?.unreadAttendances}
          loading={summaryQuery.isLoading}
        />
        {STATUS_ORDER.map((status) => (
          <SummaryMetric
            key={status}
            label={STATUS_LABELS[status]}
            value={summary?.byStatus[status]}
            loading={summaryQuery.isLoading}
          />
        ))}
      </div>

      <div className="grid min-h-[22rem] gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="flex min-h-[22rem] flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Inbox operacional
            </CardTitle>
            <CardDescription>
              A lista, os filtros e a seleção de atendimento serão carregados
              nesta área.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center rounded-b-lg bg-muted/20 p-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="font-medium">Casca da inbox disponível</p>
              <p className="text-sm text-muted-foreground">
                A navegação já está isolada por workspace e permissão. Cards,
                filtros e conversa entram nas próximas fatias de E5.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Escopo carregado</CardTitle>
            <CardDescription>
              Catálogos retornados pelo backend para os filtros operacionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ScopeMetric
              label="Áreas visíveis"
              value={optionsQuery.data?.areas.length}
              loading={optionsQuery.isLoading}
            />
            <ScopeMetric
              label="Usuários elegíveis"
              value={optionsQuery.data?.users.length}
              loading={optionsQuery.isLoading}
            />
            <ScopeMetric
              label="Canais visíveis"
              value={optionsQuery.data?.channels.length}
              loading={optionsQuery.isLoading}
            />
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Os totais e catálogos seguem o mesmo escopo de tenant e
              membership aplicado pela API.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p className="mt-2 text-2xl font-semibold">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ScopeMetric({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-muted-foreground">{label}</span>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <span className="font-semibold">{value ?? 0}</span>
      )}
    </div>
  );
}
