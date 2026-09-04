import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AttendanceAction,
  AttendanceActionDialog,
  AttendanceActionFormValues,
} from "@/components/operation/AttendanceActionDialog";
import { OperationalAttendanceKanbanBoard } from "@/components/operation/OperationalAttendanceKanbanBoard";
import { OperationalRealtimeStatus } from "@/components/operation/OperationalRealtimeStatus";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import {
  useOperationalAttendanceKanban,
  useOperationalAttendanceOptions,
} from "@/hooks/useOperationalAttendances";
import { useOperationalRealtime } from "@/hooks/useOperationalRealtime";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import {
  AttendanceCommandResponse,
  AttendanceKanbanPage,
  AttendanceOptions,
  AttendanceStatus,
  AttendanceWithDetails,
  ListAttendanceKanbanFilters,
} from "@/types/operation-attendance";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import {
  moveAttendanceInKanban,
  replaceAttendanceInKanban,
} from "@/utils/operationalKanbanCache";
import {
  getOperationalKanbanMove,
  OperationalKanbanMoveAction,
} from "@/components/operation/operationalAttendanceKanbanMoves";

const PAGE_SIZE = 10;
const CLOSED_PAGE_SIZE = 5;
const DIALOG_ACTIONS = [
  "ROUTE",
  "ASSIGN",
  "TRANSFER",
  "PENDING",
  "CLOSE",
] as const;
type DialogAction = (typeof DIALOG_ACTIONS)[number];

interface ActiveAction {
  attendance: AttendanceWithDetails;
  action: DialogAction;
}

interface KanbanFilterDraft {
  search: string;
  areaId: string;
  queueId: string;
  assigneeUserId: string;
  channelId: string;
  unreadOnly: boolean;
}

function createFilterDraft(): KanbanFilterDraft {
  return {
    search: "",
    areaId: "ALL",
    queueId: "ALL",
    assigneeUserId: "ALL",
    channelId: "ALL",
    unreadOnly: false,
  };
}

export default function OperationAttendanceKanbanPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [movingAttendanceId, setMovingAttendanceId] = useState<string | null>(
    null,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<KanbanFilterDraft>(createFilterDraft);
  const [filters, setFilters] = useState<KanbanFilterDraft>(createFilterDraft);
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");
  const canOperateAttendances =
    canViewAttendances && has("operate:operation-attendances");

  useEffect(() => {
    setPage(1);
    setActiveAction(null);
    setDraft(createFilterDraft());
    setFilters(createFilterDraft());
  }, [workspaceId]);

  const kanbanFilters = useMemo<ListAttendanceKanbanFilters>(() => {
    const result: ListAttendanceKanbanFilters = {
      page,
      limit: PAGE_SIZE,
      closedLimit: CLOSED_PAGE_SIZE,
    };
    const f = filters;
    if (f.search.trim().length >= 2) result.search = f.search.trim();
    if (f.areaId !== "ALL") result.areaId = f.areaId;
    if (f.queueId !== "ALL") result.queueId = f.queueId;
    if (f.assigneeUserId !== "ALL") result.assigneeUserId = f.assigneeUserId;
    if (f.channelId !== "ALL") result.channelId = f.channelId;
    if (f.unreadOnly) result.unreadOnly = true;
    return result;
  }, [page, filters]);

  const hasActiveFilters =
    filters.search.trim().length >= 2 ||
    filters.areaId !== "ALL" ||
    filters.queueId !== "ALL" ||
    filters.assigneeUserId !== "ALL" ||
    filters.channelId !== "ALL" ||
    filters.unreadOnly;
  const kanbanQuery = useOperationalAttendanceKanban(
    workspaceId,
    kanbanFilters,
    canViewAttendances,
  );
  const optionsQuery = useOperationalAttendanceOptions(
    workspaceId,
    canViewAttendances,
  );
  const attendanceMutations = useOperationalAttendanceMutations(workspaceId);
  const realtime = useOperationalRealtime({
    workspaceId,
    enabled: canViewAttendances,
  });
  const options = optionsQuery.data;
  const channelNames = useMemo(
    () =>
      new Map(
        (options?.channels ?? []).map((channel) => [
          channel.id,
          channel.displayName,
        ]),
      ),
    [options?.channels],
  );
  const maxPages = Math.max(
    1,
    ...(kanbanQuery.data?.columns ?? []).map((column) => column.totalPages),
  );
  const kanbanQueryKey = useMemo(
    () =>
      [
        "operation",
        "attendance-kanban",
        workspaceId,
        kanbanFilters,
      ] as const,
    [kanbanFilters, workspaceId],
  );
  const isMutationPending =
    attendanceMutations.route.isPending ||
    attendanceMutations.claim.isPending ||
    attendanceMutations.assign.isPending ||
    attendanceMutations.transfer.isPending ||
    attendanceMutations.unassign.isPending ||
    attendanceMutations.pending.isPending ||
    attendanceMutations.resume.isPending ||
    attendanceMutations.close.isPending;

  const retryQueries = () => {
    void kanbanQuery.refetch();
    void optionsQuery.refetch();
  };

  const showOptionsError = () => {
    toast({
      title: "Opções operacionais indisponíveis",
      description:
        "Não foi possível carregar áreas, filas e responsáveis para executar esta ação.",
      variant: "destructive",
    });
  };

  const openAction = (
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
  ) => {
    if (requiresAttendanceOptions(action) && !options) {
      showOptionsError();
      return;
    }

    if (isDialogAction(action)) {
      setActiveAction({ attendance, action });
      return;
    }

    void runAttendanceAction(
      attendance,
      action,
      getActionTargetStatus(action),
    );
  };

  const handleMoveAttendance = (
    attendance: AttendanceWithDetails,
    targetStatus: AttendanceStatus,
  ) => {
    if (movingAttendanceId) return;

    const move = getOperationalKanbanMove(attendance.status, targetStatus);
    if (move.kind === "NOOP") return;

    if (move.kind === "INVALID") {
      toast({
        title: "Movimentação indisponível",
        description: move.reason,
        variant: "destructive",
      });
      return;
    }

    if (move.requiresDialog) {
      openAction(attendance, move.action);
      return;
    }

    void runAttendanceAction(attendance, move.action, move.targetStatus);
  };

  const runAttendanceAction = async (
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
    targetStatus: AttendanceStatus,
    values?: AttendanceActionFormValues,
  ): Promise<boolean> => {
    if (!workspaceId) return false;

    const snapshot = queryClient.getQueryData<AttendanceKanbanPage>(
      kanbanQueryKey,
    );
    setMovingAttendanceId(attendance.id);
    try {
      if (snapshot) {
        const optimisticData = moveAttendanceInKanban(
          snapshot,
          attendance,
          targetStatus,
          getOptimisticUpdates(attendance, action, values, options),
        );
        queryClient.setQueryData(kanbanQueryKey, optimisticData);
      }

      const response = await dispatchAttendanceCommand(
        attendance,
        action,
        values,
      );
      if (response.attendance) {
        queryClient.setQueryData<AttendanceKanbanPage | undefined>(
          kanbanQueryKey,
          (current) =>
            current
              ? replaceAttendanceInKanban(current, response.attendance)
              : current,
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-kanban", workspaceId],
      });
      toast({
        title: response.duplicate ? "Ação já registrada" : "Ação concluída",
        description: response.duplicate
          ? "O comando idempotente já havia sido processado; o quadro foi reconciliado."
          : "O quadro foi atualizado com a nova versão do atendimento.",
      });
      return true;
    } catch (error) {
      if (snapshot) {
        queryClient.setQueryData(kanbanQueryKey, snapshot);
      }
      await queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-kanban", workspaceId],
      });
      toast({
        title: "Movimentação revertida",
        description: getOperationalAttendanceErrorMessage(
          error,
          "O atendimento não pôde ser atualizado. O quadro foi restaurado; atualize e tente novamente.",
        ),
        variant: "destructive",
      });
      return false;
    } finally {
      setMovingAttendanceId(null);
    }
  };

  const submitAction = async (values: AttendanceActionFormValues) => {
    if (!activeAction) return;

    const targetStatus = getActionTargetStatus(activeAction.action, values);
    const succeeded = await runAttendanceAction(
      activeAction.attendance,
      activeAction.action,
      targetStatus,
      values,
    );
    if (succeeded) setActiveAction(null);
  };

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

  if (!canViewAttendances) {
    return (
      <section className="m-4 w-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Visualização operacional não autorizada</AlertTitle>
          <AlertDescription>
            Sua sessão não possui permissão para consultar os atendimentos deste
            workspace.
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

  const hasQueryError = kanbanQuery.isError || optionsQuery.isError;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/70 dark:bg-background">
      <div className="flex shrink-0 flex-col gap-3 border-b bg-card px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Operação / quadro
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Kanban de atendimentos
            </h1>
            <span className="text-xs text-muted-foreground">
              {kanbanQuery.data?.total ?? 0} atendimento(s) no escopo atual
            </span>
            {!canOperateAttendances ? (
              <span className="text-xs text-muted-foreground">
                Visualização somente
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OperationalRealtimeStatus
            status={realtime.status}
            joinedWorkspace={realtime.joinedWorkspace}
          />
          {kanbanQuery.isFetching || isMutationPending ? (
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
                disabled={page <= 1 || kanbanQuery.isFetching || isMutationPending}
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
                disabled={page >= maxPages || kanbanQuery.isFetching || isMutationPending}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-card px-4 py-2 lg:px-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contato (mín. 2 caracteres)"
            value={draft.search}
            onChange={(e) =>
              setDraft((d) => ({ ...d, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilters({ ...draft });
                setPage(1);
              }
            }}
            className="h-8 pl-9 text-sm"
          />
        </div>
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={hasActiveFilters ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-2"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters ? (
                <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">
                  {[
                    filters.search.trim().length >= 2,
                    filters.areaId !== "ALL",
                    filters.queueId !== "ALL",
                    filters.assigneeUserId !== "ALL",
                    filters.channelId !== "ALL",
                    filters.unreadOnly,
                  ].filter(Boolean).length}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">Filtrar quadro</p>
            </div>
            <div className="grid gap-2 p-3">
              <FilterSelect
                label="Área"
                value={draft.areaId}
                onChange={(v) => setDraft((d) => ({ ...d, areaId: v }))}
              >
                <SelectItem value="ALL">Todas as áreas</SelectItem>
                {(options?.areas ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Fila"
                value={draft.queueId}
                onChange={(v) => setDraft((d) => ({ ...d, queueId: v }))}
              >
                <SelectItem value="ALL">Todas as filas</SelectItem>
                {flattenQueueOptions(options).map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                  </SelectItem>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Responsável"
                value={draft.assigneeUserId}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, assigneeUserId: v }))
                }
              >
                <SelectItem value="ALL">Todos</SelectItem>
                {(options?.users ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Canal"
                value={draft.channelId}
                onChange={(v) => setDraft((d) => ({ ...d, channelId: v }))}
              >
                <SelectItem value="ALL">Todos os canais</SelectItem>
                {(options?.channels ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </FilterSelect>
              <label className="flex items-center gap-2 py-1 text-sm">
                <Checkbox
                  checked={draft.unreadOnly}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({
                      ...d,
                      unreadOnly: checked === true,
                    }))
                  }
                />
                Somente não lidos
              </label>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() => {
                    setFilters({ ...draft });
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                >
                  Aplicar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() => {
                    const cleared = createFilterDraft();
                    setDraft(cleared);
                    setFilters(cleared);
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
          canOperate={canOperateAttendances}
          movingAttendanceId={movingAttendanceId}
          isLoading={kanbanQuery.isLoading}
          onMoveAttendance={handleMoveAttendance}
          onAction={openAction}
        />
      </div>

      {activeAction ? (
        <AttendanceActionDialog
          open
          action={activeAction.action as AttendanceAction}
          attendance={activeAction.attendance}
          options={options}
          isSubmitting={isMutationPending}
          onOpenChange={(open) => {
            if (!open && !isMutationPending) setActiveAction(null);
          }}
          onSubmit={(values) => void submitAction(values)}
        />
      ) : null}
    </section>
  );

  async function dispatchAttendanceCommand(
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
    values?: AttendanceActionFormValues,
  ): Promise<AttendanceCommandResponse> {
    const common = {
      attendanceId: attendance.id,
      expectedVersion: attendance.version,
    };

    switch (action) {
      case "ROUTE":
        return attendanceMutations.route.mutateAsync({
          ...common,
          targetAreaId: requiredValue(
            values?.targetAreaId,
            "Selecione uma área de destino.",
          ),
          targetQueueId: requiredValue(
            values?.targetQueueId,
            "Selecione uma fila de destino.",
          ),
          reason: optionalValue(values?.reason),
        });
      case "CLAIM":
        return attendanceMutations.claim.mutateAsync(common);
      case "ASSIGN":
        return attendanceMutations.assign.mutateAsync({
          ...common,
          targetUserId: requiredValue(
            values?.targetUserId,
            "Selecione um responsável.",
          ),
          reason: optionalValue(values?.reason),
        });
      case "TRANSFER":
        return attendanceMutations.transfer.mutateAsync({
          ...common,
          targetAreaId: requiredValue(
            values?.targetAreaId,
            "Selecione uma área de destino.",
          ),
          targetQueueId: requiredValue(
            values?.targetQueueId,
            "Selecione uma fila de destino.",
          ),
          targetUserId: optionalValue(values?.targetUserId),
          reason: optionalValue(values?.reason),
        });
      case "PENDING": {
        const reason = requiredValue(
          values?.reason,
          "Informe o motivo da pendência.",
        );
        const followUp = values?.includeFollowUp
          ? {
              title: requiredValue(
                values.followUpTitle,
                "Informe o título do follow-up.",
              ),
              timezone: getTimeZone(),
              schedule: {
                kind: "ONCE" as const,
                firstRunAt: toIsoDateTime(
                  requiredValue(
                    values.followUpAt,
                    "Informe quando o follow-up deve ocorrer.",
                  ),
                ),
              },
              content: {
                kind: "TEXT" as const,
                text: requiredValue(
                  values.followUpText,
                  "Informe o conteúdo do follow-up.",
                ),
              },
            }
          : undefined;

        return attendanceMutations.pending.mutateAsync({
          ...common,
          reason,
          pendingDueAt: values?.pendingDueAt
            ? toIsoDateTime(values.pendingDueAt)
            : undefined,
          followUp,
        });
      }
      case "RESUME":
        return attendanceMutations.resume.mutateAsync({
          ...common,
          reason: optionalValue(values?.reason),
        });
      case "UNASSIGN":
        return attendanceMutations.unassign.mutateAsync({
          ...common,
          reason: optionalValue(values?.reason),
        });
      case "CLOSE":
        return attendanceMutations.close.mutateAsync({
          ...common,
          closeSummary: requiredValue(
            values?.closeSummary,
            "Informe um resumo para encerrar o atendimento.",
          ),
        });
    }
  }
}

function isDialogAction(
  action: OperationalKanbanMoveAction,
): action is DialogAction {
  return DIALOG_ACTIONS.includes(action as DialogAction);
}

function requiresAttendanceOptions(action: OperationalKanbanMoveAction) {
  return action === "ROUTE" || action === "ASSIGN" || action === "TRANSFER";
}

function getActionTargetStatus(
  action: OperationalKanbanMoveAction,
  values?: AttendanceActionFormValues,
): AttendanceStatus {
  switch (action) {
    case "ROUTE":
      return "WAITING_QUEUE";
    case "CLAIM":
    case "ASSIGN":
    case "RESUME":
      return "IN_PROGRESS";
    case "TRANSFER":
      return values?.targetUserId ? "IN_PROGRESS" : "WAITING_QUEUE";
    case "PENDING":
      return "PENDING";
    case "UNASSIGN":
      return "WAITING_QUEUE";
    case "CLOSE":
      return "CLOSED";
  }
}

function getOptimisticUpdates(
  attendance: AttendanceWithDetails,
  action: OperationalKanbanMoveAction,
  values: AttendanceActionFormValues | undefined,
  options: AttendanceOptions | undefined,
): Partial<AttendanceWithDetails> {
  const selectedArea = values?.targetAreaId
    ? options?.areas.find((area) => area.id === values.targetAreaId)
    : undefined;
  const selectedQueue = values?.targetQueueId
    ? selectedArea?.queues.find((queue) => queue.id === values.targetQueueId)
    : undefined;
  const destination = values?.targetAreaId
    ? {
        areaName: selectedArea?.name ?? null,
        queueName: selectedQueue?.name ?? null,
      }
    : attendance.destination;

  switch (action) {
    case "ROUTE":
      return {
        targetAreaId: values?.targetAreaId ?? attendance.targetAreaId,
        targetQueueId: values?.targetQueueId ?? attendance.targetQueueId,
        destination,
      };
    case "ASSIGN": {
      const user = options?.users.find((item) => item.id === values?.targetUserId);
      return {
        assignee: user
          ? { type: "USER", id: user.id, name: user.name }
          : attendance.assignee,
        assigneeUserId: values?.targetUserId ?? attendance.assigneeUserId,
        assigneeAssistantId: null,
      };
    }
    case "TRANSFER": {
      const user = options?.users.find((item) => item.id === values?.targetUserId);
      return {
        targetAreaId: values?.targetAreaId ?? attendance.targetAreaId,
        targetQueueId: values?.targetQueueId ?? attendance.targetQueueId,
        destination,
        assignee: user
          ? { type: "USER", id: user.id, name: user.name }
          : null,
        assigneeUserId: user?.id ?? null,
        assigneeAssistantId: null,
      };
    }
    case "PENDING":
      return {
        pendingReason: values?.reason?.trim() || attendance.pendingReason,
        pendingDueAt: values?.pendingDueAt
          ? toIsoDateTime(values.pendingDueAt)
          : attendance.pendingDueAt,
      };
    case "RESUME":
      return { pendingReason: null, pendingDueAt: null };
    case "UNASSIGN":
      return { assignee: null, assigneeUserId: null, assigneeAssistantId: null };
    case "CLOSE":
      return {
        targetAreaId: null,
        targetQueueId: null,
        destination: { areaName: null, queueName: null },
        assignee: null,
        assigneeUserId: null,
        assigneeAssistantId: null,
        pendingReason: null,
        pendingDueAt: null,
        closedAt: new Date().toISOString(),
      };
    case "CLAIM":
      return {};
  }
}

function requiredValue(value: string | undefined, message: string) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

function optionalValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

function toIsoDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Informe uma data válida.");
  }
  return date.toISOString();
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function flattenQueueOptions(options: AttendanceOptions | undefined) {
  if (!options) return [];
  return options.areas.flatMap((area) =>
    (area.queues ?? []).map((queue) => ({
      id: queue.id,
      name: `${area.name} · ${queue.name}`,
    })),
  );
}
