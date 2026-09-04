import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalAttendanceKanban,
  useOperationalAttendanceOptions,
} from "@/hooks/useOperationalAttendances";
import { useOperationalRealtime } from "@/hooks/useOperationalRealtime";
import { usePermissions } from "@/hooks/usePermissions";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import { OperationalRealtimeStatus } from "@/components/operation/OperationalRealtimeStatus";
import { OperationalAttendanceKanbanBoard } from "@/components/operation/OperationalAttendanceKanbanBoard";

const PAGE_SIZE = 10;
const CLOSED_PAGE_SIZE = 5;

export default function OperationAttendanceKanbanPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");

  useEffect(() => {
    setPage(1);
  }, [workspaceId]);

  const kanbanFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      closedLimit: CLOSED_PAGE_SIZE,
    }),
    [page],
  );
  const kanbanQuery = useOperationalAttendanceKanban(
    workspaceId,
    kanbanFilters,
    canViewAttendances,
  );
  const optionsQuery = useOperationalAttendanceOptions(
    workspaceId,
    canViewAttendances,
  );
  const realtime = useOperationalRealtime({
    workspaceId,
    enabled: canViewAttendances,
  });

  const channelNames = useMemo(
    () =>
      new Map(
        (optionsQuery.data?.channels ?? []).map((channel) => [
          channel.id,
          channel.displayName,
        ]),
      ),
    [optionsQuery.data?.channels],
  );
  const maxPages = Math.max(
    1,
    ...(kanbanQuery.data?.columns ?? []).map((column) => column.totalPages),
  );

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="m-4 w-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em workspaces operacionais</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para abrir o quadro.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (realtime.status === "access-denied") {
    return (
      <section className="m-4 w-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso operacional revogado</AlertTitle>
          <AlertDescription>
            A sessão perdeu acesso a este workspace. O quadro foi removido e
            será reconciliado quando o acesso for restabelecido.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const retryQueries = () => {
    void kanbanQuery.refetch();
    void optionsQuery.refetch();
  };
  const hasQueryError = kanbanQuery.isError || optionsQuery.isError;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/70 dark:bg-background">
      <div className="flex shrink-0 flex-col gap-3 border-b bg-card px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Operação / quadro
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Kanban de atendimentos</h1>
            <span className="text-xs text-muted-foreground">
              {kanbanQuery.data?.total ?? 0} atendimento(s) no escopo atual
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OperationalRealtimeStatus
            status={realtime.status}
            joinedWorkspace={realtime.joinedWorkspace}
          />
          {kanbanQuery.isFetching ? (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-label="Atualizando quadro"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryQueries}
            disabled={kanbanQuery.isFetching || optionsQuery.isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          {maxPages > 1 ? (
            <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Página anterior"
                disabled={page <= 1 || kanbanQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-20 text-center text-xs text-muted-foreground">
                Página {page} de {maxPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Próxima página"
                disabled={page >= maxPages || kanbanQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {hasQueryError ? (
        <Alert variant="destructive" className="m-4 shrink-0">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar o quadro</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalAttendanceErrorMessage(
              kanbanQuery.error || optionsQuery.error,
              "Atualize para consultar novamente o escopo operacional.",
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={retryQueries}
              disabled={kanbanQuery.isFetching || optionsQuery.isFetching}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="min-h-0 flex-1">
        <OperationalAttendanceKanbanBoard
          data={kanbanQuery.data}
          channelNames={channelNames}
          isLoading={kanbanQuery.isLoading}
        />
      </div>
    </section>
  );
}
