import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  UserMinus,
  UserPlus,
  UserRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useMarkOperationalAttendanceRead,
  useOperationalAttendanceOptions,
  useOperationalAttendanceDetail,
  useOperationalAttendanceTimeline,
} from "@/hooks/useOperationalAttendances";
import { useOperationalRealtime } from "@/hooks/useOperationalRealtime";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import {
  getSafeObservabilityEntries,
  sanitizeObservabilityText,
} from "@/services/observability/sanitizeObservability";
import {
  AttendanceEvent,
  AttendanceMessageItem,
  AttendanceReplyCapabilities,
  AttendanceStatus,
  MessageDeliveryCheckSummary,
  MessageDeliveryChecksQueryState,
} from "@/types/operation-attendance";
import {
  AttendanceAction,
  AttendanceActionDialog,
  AttendanceActionFormValues,
} from "@/components/operation/AttendanceActionDialog";
import { AttendanceFollowUpsCard } from "@/components/operation/AttendanceFollowUpsCard";
import { MessageDeliveryChecks } from "@/components/operation/MessageDeliveryChecks";
import { useMessageDeliveryChecks } from "@/components/operation/useMessageDeliveryChecks";
import { OperationalTriageAgentHistory } from "@/components/operation/OperationalTriageAgentHistory";
import { AttendanceComposer } from "@/components/operation/AttendanceComposer";
import { OperationalContactNameField } from "@/components/operation/OperationalContactNameField";
import { OperationalRealtimeStatus } from "@/components/operation/OperationalRealtimeStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatOperationalMessageStatus } from "@/utils/operationalMessageStatus";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem automática",
  WAITING_QUEUE: "Fila humana",
  IN_PROGRESS: "Atendimento humano",
  PENDING: "Pendente",
  CLOSED: "Encerrado",
};

const REPLY_STATUS_LABELS = {
  SERVICE_ALLOWED: "Resposta disponível",
  TEMPLATE_REQUIRED: "Template necessário",
  CHANNEL_UNAVAILABLE: "Canal indisponível",
  NOT_ASSIGNEE: "Aguardando responsável",
  ATTENDANCE_NOT_ACTIVE: "Atendimento não ativo",
} as const;

const EVENT_LABELS: Record<string, string> = {
  INBOUND_CREATE: "Atendimento criado",
  INBOUND_RESUME: "Atendimento retomado",
  ROUTE: "Encaminhado para fila",
  CLAIM: "Assumido por operador",
  ASSIGN: "Responsável atribuído",
  TRANSFER: "Transferido para fila humana",
  UNASSIGN: "Responsável removido",
  PENDING: "Marcado como pendente",
  RESUME: "Retomado",
  CLOSE: "Encerrado",
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  INBOUND_CREATE: MessageSquare,
  INBOUND_RESUME: PlayCircle,
  ROUTE: ArrowRight,
  CLAIM: CheckCircle2,
  ASSIGN: UserPlus,
  TRANSFER: ArrowRightLeft,
  UNASSIGN: UserMinus,
  PENDING: PauseCircle,
  RESUME: PlayCircle,
  CLOSE: XCircle,
};

interface OperationAttendanceDetailPageProps {
  realtimeEnabled?: boolean;
  embedded?: boolean;
}

export default function OperationAttendanceDetailPage({
  realtimeEnabled = true,
  embedded = false,
}: OperationAttendanceDetailPageProps = {}) {
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const navigate = useNavigate();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");
  const canOperateAttendances = has("operate:operation-attendances");
  const canEditCustomerName = has("view:chat");
  const { toast } = useToast();
  const optionsQuery = useOperationalAttendanceOptions(
    workspaceId,
    canViewAttendances && canOperateAttendances,
  );
  const attendanceMutations = useOperationalAttendanceMutations(workspaceId);
  const [activeAction, setActiveAction] = useState<AttendanceAction | null>(null);
  const [secondaryPanelOpen, setSecondaryPanelOpen] = useState(true);
  const detailQuery = useOperationalAttendanceDetail(
    workspaceId,
    attendanceId,
    canViewAttendances,
  );
  const realtime = useOperationalRealtime({
    workspaceId,
    attendanceId,
    chatId: detailQuery.data?.chatId,
    currentAttendanceVersion: detailQuery.data?.version,
    enabled: canViewAttendances && realtimeEnabled,
  });
  const timelineQuery = useOperationalAttendanceTimeline(
    workspaceId,
    attendanceId,
    { limit: 50 },
    canViewAttendances,
  );
  const outboundMessageIds = useMemo(
    () =>
      (timelineQuery.data?.pages ?? [])
        .flatMap((page) => page.items)
        .filter(
          (item) => item.kind === "message" && item.sender !== "CUSTOMER",
        )
        .map((item) => item.id),
    [timelineQuery.data],
  );
  const { checksByMessageId, state: deliveryChecksState } =
    useMessageDeliveryChecks({
      workspaceId,
      attendanceId,
      messageIds: outboundMessageIds,
      enabled: canViewAttendances,
    });
  const markReadMutation = useMarkOperationalAttendanceRead(
    workspaceId,
    attendanceId,
  );
  const markedAttendanceId = useRef<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const timelineScrollSnapshotRef = useRef<{
    height: number;
    top: number;
  } | null>(null);
  const timelinePageCountRef = useRef(0);
  const markRead = markReadMutation.mutate;

  useEffect(() => {
    if (!detailQuery.data || !attendanceId) return;
    if (markedAttendanceId.current === attendanceId) return;

    markedAttendanceId.current = attendanceId;
    markRead();
  }, [attendanceId, detailQuery.data, markRead]);

  useEffect(() => {
    if (!embedded || !timelineQuery.data) return;
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const previousPosition = timelineScrollSnapshotRef.current;
    const pageCount = timelineQuery.data.pages.length;

    if (previousPosition && pageCount > timelinePageCountRef.current) {
      viewport.scrollTop =
        viewport.scrollHeight - previousPosition.height + previousPosition.top;
      timelineScrollSnapshotRef.current = null;
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }

    timelinePageCountRef.current = pageCount;
  }, [embedded, timelineQuery.data, timelineQuery.dataUpdatedAt]);

  if (!attendanceId) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atendimento não informado</AlertTitle>
          <AlertDescription>
            Volte para a caixa de entrada e selecione um atendimento válido.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ambiente operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para abrir este atendimento.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (realtime.status === "access-denied") {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Link
          to="/operation/attendances"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para atendimentos
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso operacional revogado</AlertTitle>
          <AlertDescription>
            Este atendimento foi removido da tela porque a sessão perdeu acesso
            ao ambiente operacional.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (detailQuery.isLoading) {
    return <DetailLoading embedded={embedded} />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Link
          to="/operation/attendances"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para atendimentos
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível abrir o atendimento</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalAttendanceErrorMessage(
              detailQuery.error,
              "O atendimento não está disponível no escopo atual.",
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void detailQuery.refetch()}
              disabled={detailQuery.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const attendance = detailQuery.data;
  const timelineItems = timelineQuery.data?.pages
    .slice()
    .reverse()
    .flatMap((page) => page.items) ?? [];
  const hasExternalHandoff = timelineItems.some(
    (item) =>
      item.kind === "event" &&
      (item.action === "ROUTE" || item.action === "TRANSFER") &&
      item.actorType === "INTEGRATION",
  );
  const customerName = attendance.customer?.name || "Contato sem nome";
  const options = optionsQuery.data;
  const isActionPending =
    attendanceMutations.route.isPending ||
    attendanceMutations.claim.isPending ||
    attendanceMutations.assign.isPending ||
    attendanceMutations.transfer.isPending ||
    attendanceMutations.unassign.isPending ||
    attendanceMutations.pending.isPending ||
    attendanceMutations.resume.isPending ||
    attendanceMutations.close.isPending;
  const canManageAssignments = Boolean(
    canOperateAttendances && options?.capabilities.canAssign,
  );
  const canTransfer = Boolean(canOperateAttendances && options);

  const runQuickAction = async (action: "CLAIM" | "RESUME") => {
    try {
      if (action === "CLAIM") {
        await attendanceMutations.claim.mutateAsync({
          attendanceId: attendance.id,
          expectedVersion: attendance.version,
        });
      } else {
        await attendanceMutations.resume.mutateAsync({
          attendanceId: attendance.id,
          expectedVersion: attendance.version,
        });
      }
      toast({
        title: action === "CLAIM" ? "Atendimento assumido" : "Atendimento retomado",
        description: "O detalhe foi atualizado com a nova versão do ciclo.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível executar a ação",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize o atendimento e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const submitAction = async (values: AttendanceActionFormValues) => {
    if (!activeAction) return;

    try {
      const common = {
        attendanceId: attendance.id,
        expectedVersion: attendance.version,
      };

      if (activeAction === "ROUTE") {
        if (!values.targetAreaId || !values.targetQueueId) return;
        await attendanceMutations.route.mutateAsync({
          ...common,
          targetAreaId: values.targetAreaId,
          targetQueueId: values.targetQueueId,
          reason: values.reason?.trim() || undefined,
        });
      }
      if (activeAction === "ASSIGN") {
        if (!values.targetUserId) return;
        await attendanceMutations.assign.mutateAsync({
          ...common,
          targetUserId: values.targetUserId,
          reason: values.reason?.trim() || undefined,
        });
      }
      if (activeAction === "TRANSFER") {
        if (!values.targetAreaId || !values.targetQueueId) return;
        await attendanceMutations.transfer.mutateAsync({
          ...common,
          targetAreaId: values.targetAreaId,
          targetQueueId: values.targetQueueId,
          targetUserId: values.targetUserId || undefined,
          reason: values.reason?.trim() || undefined,
        });
      }
      if (activeAction === "PENDING") {
        if (!values.reason?.trim()) return;
        const followUp =
          values.includeFollowUp &&
          values.followUpTitle?.trim() &&
          values.followUpAt &&
          values.followUpText?.trim()
            ? {
                title: values.followUpTitle.trim(),
                timezone: getTimeZone(),
                schedule: {
                  kind: "ONCE" as const,
                  firstRunAt: toIsoDateTime(values.followUpAt),
                },
                content: {
                  kind: "TEXT" as const,
                  text: values.followUpText.trim(),
                },
              }
            : undefined;
        await attendanceMutations.pending.mutateAsync({
          ...common,
          reason: values.reason.trim(),
          pendingDueAt: values.pendingDueAt
            ? toIsoDateTime(values.pendingDueAt)
            : undefined,
          followUp,
        });
      }
      if (activeAction === "RESUME") {
        await attendanceMutations.resume.mutateAsync({
          ...common,
          reason: values.reason?.trim() || undefined,
        });
      }
      if (activeAction === "UNASSIGN") {
        await attendanceMutations.unassign.mutateAsync({
          ...common,
          reason: values.reason?.trim() || undefined,
        });
      }
      if (activeAction === "CLOSE") {
        if (!values.closeSummary?.trim()) return;
        await attendanceMutations.close.mutateAsync({
          ...common,
          closeSummary: values.closeSummary.trim(),
        });
      }

      toast({
        title: "Ação concluída",
        description: "O atendimento, a timeline e os follow-ups foram atualizados.",
      });
      setActiveAction(null);
      if (activeAction === "CLOSE") {
        navigate("/operation/attendances", { replace: true });
      }
    } catch (error) {
      toast({
        title: "Não foi possível concluir a ação",
        description: getOperationalAttendanceErrorMessage(
          error,
          "O atendimento pode ter sido alterado em outra sessão. Atualize e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };
  const destination = [
    attendance.destination?.areaName,
    attendance.destination?.queueName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 w-full min-w-0 flex-col bg-background"
          : "mx-auto flex w-full max-w-[1600px] flex-col gap-6"
      }
    >
      {embedded ? (
        <header className="flex shrink-0 flex-col gap-2 border-b bg-card px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/operation/attendances"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Voltar para atendimentos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {customerName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {customerName}
                </h1>
                <Badge
                  variant={getStatusVariant(attendance.status)}
                  className={getStatusClassName(attendance.status)}
                >
                  {STATUS_LABELS[attendance.status]}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {attendance.customer?.phone || "Telefone não informado"}
                {destination ? ` · ${destination}` : ""}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {getNextStepGuidance(attendance.status, Boolean(attendance.assignee))}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 sm:pl-0">
            <OperationalRealtimeStatus
              status={realtime.status}
              joinedWorkspace={realtime.joinedWorkspace}
            />
          <AttendanceActionControls
            status={attendance.status}
            hasAssignee={Boolean(attendance.assignee)}
            canResume={attendance.actionCapabilities?.canResume === true}
            canOperate={canOperateAttendances}
            canManageAssignments={canManageAssignments}
            canTransfer={canTransfer}
              optionsAvailable={Boolean(options)}
              pending={isActionPending}
              onQuickAction={(action) => void runQuickAction(action)}
              onAction={setActiveAction}
            />
          </div>
        </header>
      ) : (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/operation/attendances"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para atendimentos
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                {getAttendanceContextLabel(attendance.status)}
              </p>
              <Badge
                variant={getStatusVariant(attendance.status)}
                className={getStatusClassName(attendance.status)}
              >
                {STATUS_LABELS[attendance.status]}
              </Badge>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {customerName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ciclo {attendance.cycleNumber} · {destination || "Destino não definido"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OperationalRealtimeStatus
              status={realtime.status}
              joinedWorkspace={realtime.joinedWorkspace}
            />
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-right text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Última atividade</p>
              <p className="mt-1">{formatDateTime(attendance.lastActivityAt)}</p>
            </div>
          </div>
        </header>
      )}

      {markReadMutation.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível atualizar a leitura</AlertTitle>
          <AlertDescription>
            A conversa continua disponível, mas o contador pode permanecer até a
            próxima atualização.
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={
          embedded
            ? secondaryPanelOpen
              ? "min-h-0 flex-1 overflow-y-auto xl:grid xl:overflow-hidden xl:grid-cols-[minmax(0,1fr)_19rem]"
              : "min-h-0 flex-1 overflow-y-auto xl:grid xl:overflow-hidden xl:grid-cols-[minmax(0,1fr)_3.25rem]"
            : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        }
      >
        <div
          className={
            embedded
              ? "min-h-[42rem] min-w-0 xl:min-h-0"
              : "min-w-0 space-y-6"
          }
        >
          <Card
            className={
              embedded
                ? "flex h-full min-h-0 min-w-0 flex-col rounded-none border-0 shadow-none"
                : "min-w-0"
            }
          >
            {embedded ? (
              <h2 className="sr-only">Conversa</h2>
            ) : (
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversa
                </CardTitle>
                <CardDescription>
                  Mensagens e alterações de todos os ciclos, em ordem cronológica.
                </CardDescription>
              </CardHeader>
            )}
            <CardContent
              className={
                embedded
                  ? "flex min-h-0 flex-1 flex-col p-0"
                  : undefined
              }
            >
              {timelineQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Não foi possível carregar a conversa
                  </AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-3">
                    {getOperationalAttendanceErrorMessage(
                      timelineQuery.error,
                      "Tente atualizar a conversa.",
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void timelineQuery.refetch()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : timelineQuery.isLoading ? (
                <ConversationLoading />
              ) : timelineItems.length === 0 ? (
                <EmptyConversation />
              ) : (
                <>
                  {timelineQuery.hasNextPage ? (
                    <div className="mb-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const viewport = messagesViewportRef.current;
                          if (viewport) {
                            timelineScrollSnapshotRef.current = {
                              height: viewport.scrollHeight,
                              top: viewport.scrollTop,
                            };
                          }
                          void timelineQuery.fetchNextPage();
                        }}
                        disabled={timelineQuery.isFetchingNextPage}
                      >
                        {timelineQuery.isFetchingNextPage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Carregar itens anteriores
                      </Button>
                    </div>
                  ) : null}
                  <ScrollArea
                    ref={messagesViewportRef}
                    className={
                      embedded
                        ? "min-h-0 flex-1 bg-slate-50/70 px-4 py-4 dark:bg-slate-950/30"
                        : "h-[min(62vh,42rem)] pr-3"
                    }
                  >
                    <div className="space-y-3">
                      {timelineItems.map((item) =>
                        item.kind === "message" ? (
                          <ConversationMessage
                            key={`message:${item.id}`}
                            message={item}
                            deliveryChecks={checksByMessageId.get(item.id)}
                            deliveryChecksState={deliveryChecksState}
                          />
                        ) : (
                          <TimelineEvent
                            key={`event:${item.id}`}
                            event={item}
                          />
                        ),
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
              <AttendanceComposer
                workspaceId={workspaceId!}
                attendance={attendance}
                canOperate={canOperateAttendances}
                onClaim={
                  attendance.status === "WAITING_QUEUE" && canOperateAttendances
                    ? () => void runQuickAction("CLAIM")
                    : undefined
                }
                claimPending={attendanceMutations.claim.isPending}
                sticky
                embedded={embedded}
              />
            </CardContent>
          </Card>
        </div>

        <Collapsible
          open={secondaryPanelOpen}
          onOpenChange={setSecondaryPanelOpen}
          className={
            embedded
              ? "min-w-0 border-t bg-card xl:flex xl:min-h-0 xl:flex-col xl:border-l xl:border-t-0"
              : "min-w-0"
          }
        >
          <div
            className={
              embedded
                ? secondaryPanelOpen
                  ? "flex shrink-0 items-center justify-between border-b px-3 py-3"
                  : "flex shrink-0 items-center justify-center border-b p-2"
                : "mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2"
            }
          >
            {secondaryPanelOpen ? <div>
              <p className="text-sm font-semibold">Detalhes</p>
              <p className="text-xs text-muted-foreground">
                Atendimento, contato e etapa da triagem.
              </p>
            </div> : null}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  secondaryPanelOpen
                    ? "Ocultar detalhes"
                    : "Mostrar detalhes"
                }
              >
                {secondaryPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent
            className={
              embedded
                ? "space-y-4 p-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto"
                : "space-y-6"
            }
          >
            <Collapsible defaultOpen={false}>
              <Card className="shadow-none">
                <CardHeader className="p-3 pb-2">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="group flex w-full items-start justify-between gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-base font-semibold">
                          <UserRound className="h-5 w-5 shrink-0 text-primary" />
                          Atendimento
                        </span>
                        <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">
                          Destino, responsável, canal e contato deste atendimento.
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 text-sm">
                    <div className="divide-y">
                      <DetailField
                        label="Destino"
                        value={destination || "Não definido"}
                      />
                      <DetailField
                        label="Responsável"
                        value={attendance.assignee?.name || "Sem responsável"}
                      />
                      <DetailField
                        label="Canal"
                        value={attendance.channel?.displayName || "Não informado"}
                      />
                    </div>
                    <p className="mt-3 border-t pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Contato
                    </p>
                    <div className="divide-y">
                      <OperationalContactNameField
                        customerId={attendance.customer?.id}
                        name={attendance.customer?.name}
                        canEdit={canEditCustomerName}
                        onUpdated={() => {
                          void detailQuery.refetch();
                        }}
                      />
                      <DetailField
                        label="Telefone"
                        value={attendance.customer?.phone || "Não informado"}
                      />
                      <DetailField
                        label="E-mail"
                        value={attendance.customer?.email || "Não informado"}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {!embedded ? (
              <Collapsible defaultOpen={false}>
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="group flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block text-base font-semibold">
                            Ações do atendimento
                          </span>
                          <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">
                            Comandos disponíveis para o estado e a permissão atuais.
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {optionsQuery.isError ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Opções de operação indisponíveis</AlertTitle>
                          <AlertDescription>
                            Não foi possível carregar as opções dos comandos.
                          </AlertDescription>
                        </Alert>
                      ) : null}
        <AttendanceActionControls
          status={attendance.status}
          hasAssignee={Boolean(attendance.assignee)}
          canResume={attendance.actionCapabilities?.canResume === true}
          canOperate={canOperateAttendances}
          canManageAssignments={canManageAssignments}
          canTransfer={canTransfer}
                        optionsAvailable={Boolean(options)}
                        pending={isActionPending}
                        onQuickAction={(action) => void runQuickAction(action)}
                        onAction={setActiveAction}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ) : null}

            <AttendanceFollowUpsCard
              workspaceId={workspaceId!}
              attendanceId={attendance.id}
              expectedVersion={attendance.version}
              status={attendance.status}
              canManage={canOperateAttendances}
            />

            <OperationalTriageAgentHistory
              workspaceId={workspaceId!}
              attendanceId={attendance.id}
              attendanceStatus={attendance.status}
              destination={attendance.destination}
              hasExternalHandoff={hasExternalHandoff}
              enabled={canViewAttendances}
            />

            <Collapsible defaultOpen={false}>
              <Card className="shadow-none">
                <CardHeader className="p-3 pb-2">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="group flex w-full items-start justify-between gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-base font-semibold">
                          Canal e resposta
                        </span>
                        <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">
                          Formatos disponíveis para responder este atendimento.
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-2 px-3 pb-3 text-sm">
                    <Badge variant={getReplyStatusVariant(attendance.replyCapabilities.status)}>
                      {getReplyStatusLabel(
                        attendance.replyCapabilities.status,
                        Boolean(attendance.assignee),
                      )}
                    </Badge>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {formatReplyModes(
                        attendance.replyCapabilities,
                        Boolean(attendance.assignee),
                      )}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

          </CollapsibleContent>
        </Collapsible>
      </div>

      <AttendanceActionDialog
        open={Boolean(activeAction)}
        action={activeAction}
        attendance={attendance}
        options={options}
        isSubmitting={isActionPending}
        onOpenChange={(open) => !open && setActiveAction(null)}
        onSubmit={(values) => void submitAction(values)}
      />
    </section>
  );
}

function AttendanceActionControls({
  status,
  hasAssignee,
  canResume,
  canOperate,
  canManageAssignments,
  canTransfer,
  optionsAvailable,
  pending,
  onQuickAction,
  onAction,
}: {
  status: AttendanceStatus;
  hasAssignee: boolean;
  canResume: boolean;
  canOperate: boolean;
  canManageAssignments: boolean;
  canTransfer: boolean;
  optionsAvailable: boolean;
  pending: boolean;
  onQuickAction: (action: "CLAIM" | "RESUME") => void;
  onAction: (action: AttendanceAction) => void;
}) {
  if (!canOperate) {
    return (
      <p className="shrink-0 text-xs text-muted-foreground">
        Visualização somente
      </p>
    );
  }

  const canAssign =
    canManageAssignments &&
    ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(status);
  const canUnassign =
    hasAssignee && ["IN_PROGRESS", "PENDING"].includes(status);
  const canClose = ["IN_PROGRESS", "PENDING"].includes(status);
  const hasManagementActions = canAssign || canUnassign;
  const hasMoreActions = canAssign || canUnassign || canClose;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5" role="toolbar" aria-label="Ações do atendimento">
      {status === "WAITING_QUEUE" ? (
        <Button size="sm" className="h-8" onClick={() => onQuickAction("CLAIM")} disabled={pending}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Atender
        </Button>
      ) : null}
      {status === "TRIAGE" ? (
        <Button size="sm" className="h-8" onClick={() => onAction("ROUTE")} disabled={!optionsAvailable || pending}>
          <ArrowRight className="mr-1.5 h-4 w-4" />
          Encaminhar
        </Button>
      ) : null}
      {status === "PENDING" && canResume ? (
        <Button size="sm" className="h-8" onClick={() => onQuickAction("RESUME")} disabled={pending}>
          <PlayCircle className="mr-1.5 h-4 w-4" />
          Retomar
        </Button>
      ) : null}
      {canTransfer && ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(status) ? (
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction("TRANSFER")} disabled={pending}>
          <ArrowRightLeft className="mr-1.5 h-4 w-4" />
          Transferir
        </Button>
      ) : null}
      {status === "IN_PROGRESS" ? (
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction("PENDING")} disabled={pending}>
          <PauseCircle className="mr-1.5 h-4 w-4" />
          Aguardar
        </Button>
      ) : null}
      {hasMoreActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 sm:px-3"
                disabled={pending}
                aria-label="Mais ações"
              >
                <MoreHorizontal className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Mais ações</span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {canAssign ? (
              <DropdownMenuItem onSelect={() => onAction("ASSIGN")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Atribuir responsável
              </DropdownMenuItem>
            ) : null}
            {canUnassign ? (
              <DropdownMenuItem onSelect={() => onAction("UNASSIGN")}>
                <UserMinus className="mr-2 h-4 w-4" />
                Remover responsável
              </DropdownMenuItem>
            ) : null}
            {canClose && hasManagementActions ? <DropdownMenuSeparator /> : null}
            {canClose ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onAction("CLOSE")}
              >
                Encerrar atendimento
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {status === "CLOSED" ? (
        <Badge variant="outline">Ciclo encerrado</Badge>
      ) : null}
    </div>
  );
}

function getNextStepGuidance(status: AttendanceStatus, hasAssignee: boolean) {
  if (status === "TRIAGE") {
    return "O MENU de entrada aguarda a escolha do cliente e a conversa com o agente externo.";
  }
  if (status === "WAITING_QUEUE") {
    return "O atendimento está na fila humana; assuma a conversa ou transfira para outro destino.";
  }
  if (status === "IN_PROGRESS") {
    return hasAssignee
      ? "A conversa está com a equipe humana; responda o cliente ou escolha como o atendimento deve avançar."
      : "Defina um responsável antes de responder o cliente.";
  }
  if (status === "PENDING") return "Retome quando houver uma nova ação ou resposta do cliente.";
  return "Consulte a conversa e o histórico deste ciclo encerrado.";
}

function getAttendanceContextLabel(status: AttendanceStatus) {
  return status === "TRIAGE"
    ? "Operação / triagem conversacional"
    : "Operação / atendimento humano";
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 grid gap-0.5 py-2.5 first:pt-1 last:pb-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function ConversationMessage({
  message,
  deliveryChecks,
  deliveryChecksState,
}: {
  message: AttendanceMessageItem;
  deliveryChecks?: MessageDeliveryCheckSummary;
  deliveryChecksState: MessageDeliveryChecksQueryState;
}) {
  const isCustomer = message.sender === "CUSTOMER";
  const senderLabel =
    message.sender === "CUSTOMER"
      ? "Cliente"
      : message.sender === "HUMAN"
        ? message.sentByUser?.name || "Operador"
        : "Agente";
  const content = message.content?.trim();
  const hasMedia = message.type.toLowerCase() !== "text";
  const hasDeliveryChecks =
    !isCustomer && deliveryChecksState !== "disabled";
  const messageStatuses = [message.dispatchStatus, message.deliveryStatus]
    .filter((status): status is string => Boolean(status))
    .map((status) => formatOperationalMessageStatus(status));

  return (
    <article className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[min(90%,42rem)] rounded-2xl px-4 py-3 text-sm ${
          isCustomer
            ? "rounded-tl-sm bg-muted text-foreground shadow-sm"
            : "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
        }`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-75">
          <span className="font-semibold">{senderLabel}</span>
        </div>
        {hasMedia ? (
          <p className="mb-1 font-medium">
            Mídia: {message.mediaMimetype || message.type}
          </p>
        ) : null}
        {message.templateName ? (
          <p className="mb-1 font-medium">Template: {message.templateName}</p>
        ) : null}
        {content ? <p className="whitespace-pre-wrap break-words">{content}</p> : null}
        <div className="mt-2 flex flex-wrap items-center justify-end gap-1 text-xs opacity-75">
          <span>{formatDateTime(message.createdAt)}</span>
          {hasDeliveryChecks ? (
            <MessageDeliveryChecks
              summary={deliveryChecks}
              state={deliveryChecksState}
            />
          ) : messageStatuses.length > 0 ? (
            <span>{messageStatuses.join(" · ")}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TimelineEvent({ event }: { event: AttendanceEvent }) {
  const metadataEntries = getSafeObservabilityEntries(event.metadata);
  const reason = sanitizeObservabilityText(event.reason, 500);
  const label = EVENT_LABELS[event.action] || event.action;
  const details = [
    reason ? `Motivo: ${reason}` : null,
    ...metadataEntries.map(
      ({ key, value }) => `${formatMetadataKey(key)}: ${value}`,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  const accessibleLabel = [
    label,
    event.cycleNumber ? `Ciclo ${event.cycleNumber}` : null,
    formatDateTime(event.createdAt),
    formatActor(event.actorType),
    `Versão ${event.aggregateVersion}`,
    details,
  ]
    .filter(Boolean)
    .join(" · ");
  const EventIcon = EVENT_ICONS[event.action] || ArrowRightLeft;

  return (
    <article
      aria-label={accessibleLabel}
      title={details || undefined}
      className="mx-auto flex w-fit max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
    >
      <EventIcon
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      />
      <span className="min-w-0 truncate font-medium text-foreground">
        {label}
      </span>
      {event.cycleNumber ? (
        <span className="shrink-0">· C{event.cycleNumber}</span>
      ) : null}
      <span className="shrink-0">· {formatActor(event.actorType)}</span>
      <span className="shrink-0">· V{event.aggregateVersion}</span>
      <span className="shrink-0">· {formatCompactDateTime(event.createdAt)}</span>
    </article>
  );
}

function DetailLoading({ embedded = false }: { embedded?: boolean }) {
  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 w-full flex-col gap-4 p-5"
          : "mx-auto flex w-full max-w-5xl flex-col gap-6"
      }
    >
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="h-12 w-2/3 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    </section>
  );
}

function ConversationLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className={`h-16 animate-pulse rounded-2xl bg-muted ${
            item % 2 ? "w-3/4" : "ml-auto w-2/3"
          }`}
        />
      ))}
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">Nenhum item encontrado</p>
      <p className="text-sm text-muted-foreground">
        O histórico deste chat ainda não possui mensagens ou eventos visíveis.
      </p>
    </div>
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

function getReplyStatusVariant(
  status: keyof typeof REPLY_STATUS_LABELS,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "SERVICE_ALLOWED") return "default";
  if (status === "CHANNEL_UNAVAILABLE") return "destructive";
  return "secondary";
}

function getReplyStatusLabel(
  status: keyof typeof REPLY_STATUS_LABELS,
  hasAssignee: boolean,
) {
  if (status === "NOT_ASSIGNEE") {
    return hasAssignee ? "Outro responsável" : "Sem responsável";
  }

  return REPLY_STATUS_LABELS[status];
}

function formatActor(actorType: AttendanceEvent["actorType"]) {
  if (actorType === "USER") return "operador";
  if (actorType === "ASSISTANT") return "agente";
  if (actorType === "INTEGRATION") return "agente externo";
  return "sistema";
}

function formatMetadataKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatReplyModes(
  capabilities: AttendanceReplyCapabilities,
  hasAssignee: boolean,
) {
  if (capabilities.status === "NOT_ASSIGNEE") {
    return hasAssignee
      ? "Este atendimento está atribuído a outro responsável. Somente o responsável atual pode responder."
      : "Este atendimento não tem responsável definido. Atribua um responsável para habilitar a resposta.";
  }

  const modes = [
    capabilities.supportsText ? "mensagens" : null,
    capabilities.supportsMedia ? "anexos" : null,
    capabilities.supportsTemplate ? "templates" : null,
  ].filter(Boolean);

  if (modes.length === 0) return "Nenhum formato de resposta está disponível neste momento.";
  if (modes.length === 1) return `Disponível para ${modes[0]}.`;

  const lastMode = modes[modes.length - 1];
  return `Disponível para ${modes.slice(0, -1).join(", ")} e ${lastMode}.`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatCompactDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(", ", " ");
}

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}
