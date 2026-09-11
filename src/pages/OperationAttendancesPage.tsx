import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalAttendances,
  useOperationalAttendanceOptions,
  useOperationalAttendanceSummary,
} from "@/hooks/useOperationalAttendances";
import { useOperationalRealtime } from "@/hooks/useOperationalRealtime";
import { usePermissions } from "@/hooks/usePermissions";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import {
  AttendanceOptions,
  AttendanceStatus,
  ListAttendancesFilters,
} from "@/types/operation-attendance";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OperationalRealtimeStatus } from "@/components/operation/OperationalRealtimeStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
  PENDING: "Pendente",
  CLOSED: "Encerrado",
};

const STATUS_ORDER: AttendanceStatus[] = [
  "TRIAGE",
  "WAITING_QUEUE",
  "IN_PROGRESS",
  "PENDING",
  "CLOSED",
];

const PRIMARY_STATUSES: AttendanceStatus[] = ["TRIAGE", "WAITING_QUEUE"];
const SECONDARY_STATUSES: AttendanceStatus[] = [
  "IN_PROGRESS",
  "PENDING",
  "CLOSED",
];

const MESSAGE_SENDER_LABELS = {
  CUSTOMER: "Cliente",
  HUMAN: "Operador",
  ASSISTANT: "Agente",
} as const;

type FilterDraft = {
  search: string;
  status: AttendanceStatus | "ALL";
  areaId: string;
  queueId: string;
  assigneeUserId: string;
  channelId: string;
  unreadOnly: boolean;
};

function createFilterDraft(): FilterDraft {
  return {
    search: "",
    status: "ALL",
    areaId: "ALL",
    queueId: "ALL",
    assigneeUserId: "ALL",
    channelId: "ALL",
    unreadOnly: false,
  };
}

interface OperationAttendancesPageProps {
  embedded?: boolean;
  realtimeEnabled?: boolean;
}

export default function OperationAttendancesPage({
  embedded = false,
  realtimeEnabled = true,
}: OperationAttendancesPageProps = {}) {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(createFilterDraft);
  const [filters, setFilters] = useState<ListAttendancesFilters>({
    page: 1,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    setDraft(createFilterDraft());
    setFilters({ page: 1, limit: PAGE_SIZE });
  }, [workspaceId]);

  const summaryFilters = useMemo(
    () => ({
      areaId: filters.areaId,
      queueId: filters.queueId,
      assigneeUserId: filters.assigneeUserId,
      assigneeAssistantId: filters.assigneeAssistantId,
      channelId: filters.channelId,
      customerId: filters.customerId,
      updatedFrom: filters.updatedFrom,
      updatedTo: filters.updatedTo,
      search: filters.search,
      unreadOnly: filters.unreadOnly,
    }),
    [filters],
  );
  const summaryQuery = useOperationalAttendanceSummary(
    workspaceId,
    summaryFilters,
    canViewAttendances,
  );
  const optionsQuery = useOperationalAttendanceOptions(
    workspaceId,
    canViewAttendances,
  );
  const attendancesQuery = useOperationalAttendances(
    workspaceId,
    filters,
    canViewAttendances,
  );
  const realtime = useOperationalRealtime({
    workspaceId,
    enabled: canViewAttendances && realtimeEnabled,
  });

  const queueOptions = useMemo(
    () => flattenQueueOptions(optionsQuery.data),
    [optionsQuery.data],
  );

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para abrir os atendimentos.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (realtime.status === "access-denied") {
    return (
      <section className="w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso operacional revogado</AlertTitle>
          <AlertDescription>
            A sessão perdeu acesso a este ambiente. A lista foi removida e será
            reconciliada quando o acesso for restabelecido.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const hasQueryError =
    attendancesQuery.isError || summaryQuery.isError || optionsQuery.isError;
  const currentPage = attendancesQuery.data?.page ?? filters.page ?? 1;
  const totalPages = attendancesQuery.data?.totalPages ?? 0;
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.areaId) ||
    Boolean(filters.queueId) ||
    Boolean(filters.assigneeUserId) ||
    Boolean(filters.channelId) ||
    filters.unreadOnly === true;
  const advancedFilterCount = [
    filters.status,
    filters.areaId,
    filters.queueId,
    filters.assigneeUserId,
    filters.channelId,
    filters.unreadOnly,
  ].filter(Boolean).length;

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = draft.search.trim();
    const nextFilters: ListAttendancesFilters = {
      page: 1,
      limit: PAGE_SIZE,
    };

    if (search.length >= 2) nextFilters.search = search;
    if (draft.status !== "ALL") nextFilters.status = draft.status;
    if (draft.areaId !== "ALL") nextFilters.areaId = draft.areaId;
    if (draft.queueId !== "ALL") nextFilters.queueId = draft.queueId;
    if (draft.assigneeUserId !== "ALL") {
      nextFilters.assigneeUserId = draft.assigneeUserId;
    }
    if (draft.channelId !== "ALL") nextFilters.channelId = draft.channelId;
    if (draft.unreadOnly) nextFilters.unreadOnly = true;

    setFilters(nextFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(createFilterDraft());
    setFilters({ page: 1, limit: PAGE_SIZE });
    setFiltersOpen(false);
  };

  const retryQueries = () => {
    void attendancesQuery.refetch();
    void summaryQuery.refetch();
    void optionsQuery.refetch();
  };

  const selectStatus = (status?: AttendanceStatus) => {
    const nextStatus = filters.status === status ? undefined : status;
    setDraft((current) => ({
      ...current,
      status: nextStatus ?? "ALL",
    }));
    setFilters((current) => {
      const nextFilters = { ...current, page: 1 };
      if (nextStatus) {
        nextFilters.status = nextStatus;
      } else {
        delete nextFilters.status;
      }
      return nextFilters;
    });
  };

  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 w-full min-w-0 flex-col gap-0 bg-card"
          : "mx-auto flex w-full max-w-[1600px] flex-col gap-6"
      }
    >
      {!embedded ? (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Operação / atendimento humano
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Atendimentos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Encontre conversas no escopo autorizado e abra o ciclo operacional
              sem sair do ambiente atual.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OperationalRealtimeStatus
              status={realtime.status}
              joinedWorkspace={realtime.joinedWorkspace}
            />
            <Link
              to="/operation"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para operação
            </Link>
          </div>
        </header>
      ) : null}

      {hasQueryError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a caixa de entrada</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalAttendanceErrorMessage(
              attendancesQuery.error || summaryQuery.error || optionsQuery.error,
              "Atualize para consultar novamente o escopo operacional.",
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={retryQueries}
              disabled={
                attendancesQuery.isFetching ||
                summaryQuery.isFetching ||
                optionsQuery.isFetching
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <StatusBuckets
        activeStatus={filters.status}
        counts={summaryQuery.data?.byStatus}
        loading={summaryQuery.isLoading}
        onSelect={selectStatus}
        embedded={embedded}
      />

      {!embedded ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric
            label="Total visível"
            value={summaryQuery.data?.total}
            loading={summaryQuery.isLoading}
          />
          <SummaryMetric
            label="Com novas mensagens"
            value={summaryQuery.data?.unreadAttendances}
            loading={summaryQuery.isLoading}
          />
          {STATUS_ORDER.map((status) => (
            <SummaryMetric
              key={status}
              label={STATUS_LABELS[status]}
              value={summaryQuery.data?.byStatus[status]}
              loading={summaryQuery.isLoading}
            />
          ))}
        </div>
      ) : null}

      <Card
        className={
          embedded
            ? "shrink-0 rounded-none border-x-0 border-t-0 shadow-none"
            : undefined
        }
      >
        <CardContent className={embedded ? "p-2" : "p-4"}>
          <div className={embedded ? "space-y-2" : "space-y-4"}>
            {!embedded ? <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Filtros da caixa de entrada</h2>
              {hasActiveFilters ? (
                <Badge variant="secondary">Aplicados</Badge>
              ) : null}
            </div> : null}
            <form onSubmit={applyFilters} className="space-y-2">
              <div>
                <label
                  htmlFor="attendance-search"
                  className={embedded ? "sr-only" : "text-sm font-medium"}
                >
                  Buscar contato
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="attendance-search"
                    value={draft.search}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    placeholder={
                      embedded
                        ? "Nome ou telefone"
                        : "Nome ou telefone (mínimo de 2 caracteres)"
                    }
                    className="h-9 pl-9 pr-10"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-7 w-7"
                    disabled={attendancesQuery.isFetching}
                    aria-label="Buscar atendimentos"
                  >
                    {attendancesQuery.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {draft.search.trim().length === 1 ? (
                  <p className="text-xs text-muted-foreground">
                    Digite pelo menos 2 caracteres para pesquisar.
                  </p>
                ) : null}
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={advancedFilterCount ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 gap-2"
                    aria-label={
                      advancedFilterCount
                        ? `Filtros, ${advancedFilterCount} ativos`
                        : "Abrir filtros"
                    }
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filtros
                    {advancedFilterCount ? (
                      <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">
                        {advancedFilterCount}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[min(24rem,calc(100vw-2rem))] p-0"
                >
                  <form onSubmit={applyFilters}>
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-semibold">Filtrar conversas</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Refine a fila sem perder a conversa atual.
                      </p>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <FilterSelect
                    id="attendance-status"
                    label="Estado"
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        status: value as FilterDraft["status"],
                      }))
                    }
                  >
                    <SelectItem value="ALL">Todos os estados</SelectItem>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    id="attendance-area"
                    label="Área"
                    value={draft.areaId}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, areaId: value }))
                    }
                  >
                    <SelectItem value="ALL">Todas as áreas</SelectItem>
                    {(optionsQuery.data?.areas ?? []).map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    id="attendance-queue"
                    label="Fila"
                    value={draft.queueId}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, queueId: value }))
                    }
                  >
                    <SelectItem value="ALL">Todas as filas</SelectItem>
                    {queueOptions.map((queue) => (
                      <SelectItem key={queue.id} value={queue.id}>
                        {queue.name} · {queue.areaName}
                      </SelectItem>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    id="attendance-assignee"
                    label="Responsável"
                    value={draft.assigneeUserId}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        assigneeUserId: value,
                      }))
                    }
                  >
                    <SelectItem value="ALL">Todos os responsáveis</SelectItem>
                    {(optionsQuery.data?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    id="attendance-channel"
                    label="Canal"
                    value={draft.channelId}
                    onValueChange={(value) =>
                      setDraft((current) => ({ ...current, channelId: value }))
                    }
                  >
                    <SelectItem value="ALL">Todos os canais</SelectItem>
                    {(optionsQuery.data?.channels ?? []).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.displayName}
                      </SelectItem>
                    ))}
                  </FilterSelect>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                      <label
                        htmlFor="attendance-unread"
                        className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Checkbox
                          id="attendance-unread"
                          checked={draft.unreadOnly}
                          onCheckedChange={(checked) =>
                            setDraft((current) => ({
                              ...current,
                              unreadOnly: checked === true,
                            }))
                          }
                        />
                        Apenas com mensagens novas
                      </label>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                          Limpar
                        </Button>
                        <Button type="submit" size="sm" disabled={attendancesQuery.isFetching}>
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className={
          embedded
            ? "flex min-h-0 flex-1 flex-col gap-0"
            : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
        }
      >
        <Card
          className={
            embedded
              ? "flex min-h-0 min-w-0 flex-1 flex-col rounded-none border-x-0 border-b-0 shadow-none"
              : "min-w-0"
          }
        >
          <CardContent
            className={embedded ? "flex min-h-0 flex-1 flex-col p-0" : "p-0"}
          >
            <div
              className={
                embedded
                  ? "flex shrink-0 items-center justify-between border-b px-3 py-3"
                  : "flex items-center justify-between border-b px-4 py-4 sm:px-6"
              }
            >
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Inbox className="h-5 w-5 text-primary" />
                  {embedded ? "Conversas" : "Caixa de entrada operacional"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {attendancesQuery.data?.total ?? 0} atendimento(s) no filtro atual
                </p>
              </div>
              {attendancesQuery.isFetching ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            <div
              className={
                embedded
                  ? "min-h-0 flex-1 overflow-y-auto divide-y"
                  : "divide-y"
              }
            >
              {attendancesQuery.isLoading ? (
                <AttendanceListLoading />
              ) : attendancesQuery.isError && !attendancesQuery.data ? (
                <AttendanceListError
                  onRetry={() => void attendancesQuery.refetch()}
                  isFetching={attendancesQuery.isFetching}
                />
              ) : attendancesQuery.data?.items.length ? (
                attendancesQuery.data.items.map((attendance) => (
                  <AttendanceCard
                    key={attendance.id}
                    attendance={attendance}
                    selected={attendance.id === attendanceId}
                    compact={embedded}
                  />
                ))
              ) : (
                <EmptyAttendanceList hasFilters={hasActiveFilters} />
              )}
            </div>

            {totalPages > 1 ? (
              <div
                className={
                  embedded
                    ? "flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3"
                    : "flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                }
              >
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || attendancesQuery.isFetching}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.max(1, currentPage - 1),
                      }))
                    }
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || attendancesQuery.isFetching}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: currentPage + 1,
                      }))
                    }
                  >
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={embedded ? "hidden" : "h-fit"}>
          <CardContent className="space-y-3 p-4 text-sm">
            <div>
              <h2 className="font-semibold">Escopo carregado</h2>
              <p className="mt-1 text-muted-foreground">
                Catálogos retornados para filtros e próximas ações permitidas.
              </p>
            </div>
            <ScopeMetric
              label="Áreas visíveis"
              value={optionsQuery.data?.areas.length}
              loading={optionsQuery.isLoading}
            />
            <ScopeMetric
              label="Filas visíveis"
              value={queueOptions.length}
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
              Os totais, cards e catálogos seguem o mesmo escopo de tenant e
              membership aplicado pela API.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onValueChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Selecione ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function StatusBuckets({
  activeStatus,
  counts,
  loading,
  onSelect,
  embedded = false,
}: {
  activeStatus?: AttendanceStatus;
  counts?: Record<AttendanceStatus, number>;
  loading: boolean;
  onSelect: (status?: AttendanceStatus) => void;
  embedded?: boolean;
}) {
  const total = counts
    ? Object.values(counts).reduce((sum, count) => sum + count, 0)
    : 0;
  const secondaryStatus = activeStatus && SECONDARY_STATUSES.includes(activeStatus)
    ? activeStatus
    : undefined;

  return (
    <nav
      aria-label="Filas por estado"
      className={
        embedded
          ? "shrink-0 border-b bg-card px-2 py-2"
          : "rounded-lg border bg-card p-2 shadow-sm"
      }
    >
      <div
        className={
          embedded
            ? "flex min-w-0 items-center gap-1"
            : "flex flex-wrap items-center gap-2"
        }
      >
        <span
          className={
            embedded
              ? "sr-only"
              : "px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          }
        >
          Filas
        </span>
        <Button
          type="button"
          size="sm"
          variant={!activeStatus ? "secondary" : "ghost"}
          className={embedded ? "h-8 shrink-0 gap-1 rounded-md px-2" : undefined}
          aria-pressed={!activeStatus}
          onClick={() => onSelect()}
        >
          <span>Todas</span>
          <BucketCount value={total} loading={loading} compact={embedded} />
        </Button>
        {PRIMARY_STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={activeStatus === status ? "secondary" : "ghost"}
            className={embedded ? "h-8 shrink-0 gap-1 rounded-md px-2" : undefined}
            aria-pressed={activeStatus === status}
            onClick={() => onSelect(status)}
          >
            <span>{status === "WAITING_QUEUE" ? "Na fila" : STATUS_LABELS[status]}</span>
            <BucketCount value={counts?.[status]} loading={loading} compact={embedded} />
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={secondaryStatus ? "secondary" : "ghost"}
              className={embedded ? "h-8 shrink-0 gap-1 rounded-md px-2" : undefined}
              aria-label={
                secondaryStatus
                  ? `Mais estados, atual: ${STATUS_LABELS[secondaryStatus]}`
                  : "Mais estados"
              }
              aria-pressed={Boolean(secondaryStatus)}
            >
              <span className="truncate">
                {secondaryStatus === "IN_PROGRESS"
                  ? "Em atend."
                  : secondaryStatus === "CLOSED"
                    ? "Histórico"
                    : secondaryStatus
                      ? STATUS_LABELS[secondaryStatus]
                      : "Mais"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup
              value={secondaryStatus ?? ""}
              onValueChange={(value) => onSelect(value as AttendanceStatus)}
            >
              {SECONDARY_STATUSES.map((status) => (
                <DropdownMenuRadioItem
                  key={status}
                  value={status}
                  className="justify-between gap-3"
                >
                  <span>{status === "CLOSED" ? "Histórico" : STATUS_LABELS[status]}</span>
                  <BucketCount value={counts?.[status]} loading={loading} compact />
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

function BucketCount({
  value,
  loading,
  compact = false,
}: {
  value?: number;
  loading: boolean;
  compact?: boolean;
}) {
  return loading ? (
    <Loader2
      className={`${compact ? "ml-0" : "ml-2"} h-3.5 w-3.5 animate-spin`}
      aria-label="Carregando"
    />
  ) : (
    <span
      className={`${compact ? "ml-0 min-w-5 text-center" : "ml-2"} rounded-full bg-background px-1.5 py-0.5 text-xs text-foreground`}
    >
      {value ?? 0}
    </span>
  );
}

function AttendanceCard({
  attendance,
  selected = false,
  compact = false,
}: {
  attendance: {
    id: string;
    status: AttendanceStatus;
    lastActivityAt: string;
    customer?: {
      name: string;
      phoneMasked?: string | null;
    };
    destination?: {
      areaName: string | null;
      queueName: string | null;
    };
    assignee?: {
      type: "USER" | "ASSISTANT";
      name: string;
    } | null;
    lastMessage?: {
      sender: "CUSTOMER" | "HUMAN" | "ASSISTANT";
      preview: string;
      createdAt: string;
    } | null;
    unreadCount?: number;
  };
  selected?: boolean;
  compact?: boolean;
}) {
  const customerName = attendance.customer?.name || "Contato sem nome";
  const lastMessage = attendance.lastMessage;
  const destination = [
    attendance.destination?.areaName,
    attendance.destination?.queueName,
  ]
    .filter(Boolean)
    .join(" · ");

  const activityAt = lastMessage?.createdAt || attendance.lastActivityAt;
  const assignee = attendance.assignee?.name || "Sem responsável";
  const operationalContext = [destination || "Destino não definido", assignee]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={`border-l-2 transition-colors hover:bg-muted/40 ${
        selected ? "border-l-primary bg-primary/[0.04]" : "border-l-transparent"
      }`}
    >
      <Link
        to={`/operation/attendances/${attendance.id}`}
        aria-current={selected ? "page" : undefined}
        className={`block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${compact ? "px-3 py-2.5" : "p-4"}`}
      >
        <div className={compact ? "flex gap-2.5" : "flex gap-3"}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"}`}
          >
            {customerName.slice(0, 1).toUpperCase()}
          </div>
          <div className={`min-w-0 flex-1 ${compact ? "space-y-1.5" : "space-y-2"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className={`${compact ? "text-sm" : ""} truncate font-semibold`}>
                  {customerName}
                </h3>
                {attendance.unreadCount ? (
                  <Badge
                    className="min-w-5 justify-center bg-primary px-1.5 text-[10px] text-primary-foreground hover:bg-primary"
                    aria-label={`${attendance.unreadCount} mensagens novas`}
                  >
                    {attendance.unreadCount}
                  </Badge>
                ) : null}
              </div>
              <time
                dateTime={activityAt}
                title={formatDateTime(activityAt)}
                className="shrink-0 text-[11px] text-muted-foreground"
              >
                {formatListTimestamp(activityAt)}
              </time>
            </div>

            <p className={`${compact ? "text-xs" : "text-sm"} truncate text-muted-foreground`}>
              {lastMessage
                ? <><span className="font-medium text-foreground">{MESSAGE_SENDER_LABELS[lastMessage.sender]}:</span>{" "}{lastMessage.preview}</>
                : "Nenhuma mensagem disponível."}
            </p>

            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] text-muted-foreground">
                {operationalContext}
              </p>
              <Badge
                variant={getStatusVariant(attendance.status)}
                className={`${getStatusClassName(attendance.status)} h-5 shrink-0 px-1.5 text-[10px]`}
              >
                {STATUS_LABELS[attendance.status]}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function EmptyAttendanceList({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">
        {hasFilters ? "Nenhum atendimento encontrado" : "Caixa de entrada sem atendimentos"}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Tente remover algum filtro ou buscar por outro contato."
          : "Quando houver atendimentos no seu escopo, eles aparecerão aqui."}
      </p>
    </div>
  );
}

function AttendanceListError({
  onRetry,
  isFetching,
}: {
  onRetry: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="font-medium">A lista de atendimentos não está disponível</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocorreu uma falha ao consultar este ambiente. Tente novamente para
        carregar a caixa de entrada.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isFetching}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

function AttendanceListLoading() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse gap-3 p-4 sm:p-6">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
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

function flattenQueueOptions(options?: AttendanceOptions) {
  return (options?.areas ?? []).flatMap((area) =>
    area.queues.map((queue) => ({
      ...queue,
      areaName: area.name,
    })),
  );
}

function getStatusVariant(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "IN_PROGRESS") return "default";
  if (status === "CLOSED") return "outline";
  if (status === "PENDING") return "secondary";
  return "outline";
}

function getStatusClassName(status: AttendanceStatus) {
  if (status === "TRIAGE") {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50";
  }
  if (status === "WAITING_QUEUE") {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50";
  }
  if (status === "IN_PROGRESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
  }
  if (status === "PENDING") {
    return "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-50";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatListTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (dayDifference === 0) {
    const elapsedMinutes = Math.max(
      0,
      Math.floor((now.getTime() - date.getTime()) / 60_000),
    );
    if (elapsedMinutes < 1) return "agora";
    if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
    return `${Math.floor(elapsedMinutes / 60)} h`;
  }
  if (dayDifference === 1) return "Ontem";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
