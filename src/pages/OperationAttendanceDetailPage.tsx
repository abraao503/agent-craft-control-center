import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
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
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useMarkOperationalAttendanceRead,
  useOperationalAttendanceOptions,
  useOperationalAttendanceDetail,
  useOperationalAttendanceEvents,
  useOperationalAttendanceMessages,
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
} from "@/types/operation-attendance";
import {
  AttendanceAction,
  AttendanceActionDialog,
  AttendanceActionFormValues,
} from "@/components/operation/AttendanceActionDialog";
import { AttendanceFollowUpsCard } from "@/components/operation/AttendanceFollowUpsCard";
import { AttendanceComposer } from "@/components/operation/AttendanceComposer";
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

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
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
  ROUTE: "Encaminhado para destino",
  CLAIM: "Assumido por operador",
  ASSIGN: "Responsável atribuído",
  TRANSFER: "Transferido",
  UNASSIGN: "Responsável removido",
  PENDING: "Marcado como pendente",
  RESUME: "Retomado",
  CLOSE: "Encerrado",
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
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAttendances = has("view:operation-attendances");
  const canOperateAttendances = has("operate:operation-attendances");
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
    currentAttendanceVersion: detailQuery.data?.version,
    enabled: canViewAttendances && realtimeEnabled,
  });
  const messagesQuery = useOperationalAttendanceMessages(
    workspaceId,
    attendanceId,
    { limit: 50 },
    canViewAttendances,
  );
  const eventsQuery = useOperationalAttendanceEvents(
    workspaceId,
    attendanceId,
    { page: 1, limit: 50 },
    canViewAttendances,
  );
  const markReadMutation = useMarkOperationalAttendanceRead(
    workspaceId,
    attendanceId,
  );
  const markedAttendanceId = useRef<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const markRead = markReadMutation.mutate;

  useEffect(() => {
    if (!detailQuery.data || !attendanceId) return;
    if (markedAttendanceId.current === attendanceId) return;

    markedAttendanceId.current = attendanceId;
    markRead();
  }, [attendanceId, detailQuery.data, markRead]);

  useEffect(() => {
    if (!embedded || !messagesQuery.data) return;
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
  }, [embedded, messagesQuery.data, messagesQuery.dataUpdatedAt]);

  if (!attendanceId) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atendimento não informado</AlertTitle>
          <AlertDescription>
            Volte para a inbox e selecione um atendimento válido.
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
          <AlertTitle>Workspace operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para abrir este atendimento.
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
            ao workspace operacional.
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
  const messages = messagesQuery.data?.pages
    .slice()
    .reverse()
    .flatMap((page) => page.items) ?? [];
  const events = eventsQuery.data?.items ?? [];
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
                Operação / atendimento humano
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
                  Mensagens do chat compartilhado, em ordem cronológica.
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
              {messagesQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Não foi possível carregar as mensagens</AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-3">
                    {getOperationalAttendanceErrorMessage(
                      messagesQuery.error,
                      "Tente atualizar a conversa.",
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void messagesQuery.refetch()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : messagesQuery.isLoading ? (
                <ConversationLoading />
              ) : messages.length === 0 ? (
                <EmptyConversation />
              ) : (
                <>
                  {messagesQuery.hasNextPage ? (
                    <div className="mb-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void messagesQuery.fetchNextPage()}
                        disabled={messagesQuery.isFetchingNextPage}
                      >
                        {messagesQuery.isFetchingNextPage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Carregar mensagens anteriores
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
                      {messages.map((message) => (
                        <ConversationMessage key={message.id} message={message} />
                      ))}
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
                Atendimento, contato e histórico.
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
            <Card className="shadow-none">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-5 w-5 text-primary" />
                  Atendimento
                </CardTitle>
              </CardHeader>
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
                  <DetailField label="Nome" value={customerName} />
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
            </Card>

            {!embedded ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações do atendimento</CardTitle>
                  <CardDescription>
                    Comandos disponíveis para o estado e a permissão atuais.
                  </CardDescription>
                </CardHeader>
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
                    canOperate={canOperateAttendances}
                    canManageAssignments={canManageAssignments}
                    canTransfer={canTransfer}
                    optionsAvailable={Boolean(options)}
                    pending={isActionPending}
                    onQuickAction={(action) => void runQuickAction(action)}
                    onAction={setActiveAction}
                  />
                </CardContent>
              </Card>
            ) : null}

            <AttendanceFollowUpsCard
              workspaceId={workspaceId!}
              attendanceId={attendance.id}
              expectedVersion={attendance.version}
              status={attendance.status}
              canManage={canOperateAttendances}
            />

            <Card className="shadow-none">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-base">Canal e resposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3 text-sm">
                <Badge variant={getReplyStatusVariant(attendance.replyCapabilities.status)}>
                  {REPLY_STATUS_LABELS[attendance.replyCapabilities.status]}
                </Badge>
                <p className="text-xs leading-5 text-muted-foreground">
                  {formatReplyModes(attendance.replyCapabilities)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Timeline do ciclo
                </CardTitle>
                <CardDescription>
                  Eventos de estado deste ciclo, sem corpos de mensagem ou dados
                  internos do provider.
                </CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">Versão atual: {attendance.version}</Badge>
                  <Badge variant="outline">
                    {events.length} {events.length === 1 ? "evento visível" : "eventos visíveis"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {eventsQuery.isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não foi possível carregar a timeline</AlertTitle>
                    <AlertDescription>
                      {getOperationalAttendanceErrorMessage(
                        eventsQuery.error,
                        "Tente atualizar o detalhe.",
                      )}
                    </AlertDescription>
                  </Alert>
                ) : eventsQuery.isLoading ? (
                  <TimelineLoading />
                ) : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há eventos registrados neste ciclo.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {events.map((event) => (
                      <TimelineEvent key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
      {status === "PENDING" ? (
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
  if (status === "TRIAGE") return "Defina a área e a fila para encaminhar o atendimento.";
  if (status === "WAITING_QUEUE") return "Assuma a conversa ou transfira para outro destino.";
  if (status === "IN_PROGRESS") {
    return hasAssignee
      ? "Responda o cliente ou escolha como o atendimento deve avançar."
      : "Defina um responsável antes de responder o cliente.";
  }
  if (status === "PENDING") return "Retome quando houver uma nova ação ou resposta do cliente.";
  return "Consulte a conversa e o histórico deste ciclo encerrado.";
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 py-2.5 first:pt-1 last:pb-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function ConversationMessage({ message }: { message: AttendanceMessageItem }) {
  const isCustomer = message.sender === "CUSTOMER";
  const senderLabel =
    message.sender === "CUSTOMER"
      ? "Cliente"
      : message.sender === "HUMAN"
        ? message.sentByUser?.name || "Operador"
        : "Assistente";
  const content = message.content?.trim();
  const hasMedia = message.type.toLowerCase() !== "text";

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
          <span>{formatDateTime(message.createdAt)}</span>
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
        {message.dispatchStatus || message.deliveryStatus ? (
          <p className="mt-2 text-xs opacity-75">
            {formatMessageStatus(message.dispatchStatus)}
            {message.deliveryStatus
              ? ` · ${formatMessageStatus(message.deliveryStatus)}`
              : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function TimelineEvent({ event }: { event: AttendanceEvent }) {
  const metadataEntries = getSafeObservabilityEntries(event.metadata);
  const reason = sanitizeObservabilityText(event.reason, 500);

  return (
    <div className="relative border-l pl-4">
      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
      <p className="font-medium">{EVENT_LABELS[event.action] || event.action}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDateTime(event.createdAt)} · {formatActor(event.actorType)} · Versão {event.aggregateVersion}
      </p>
      {reason ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {reason}
        </p>
      ) : null}
      {metadataEntries.length > 0 ? (
        <dl className="mt-2 grid gap-1 rounded-md bg-muted/40 px-2.5 py-2 text-xs">
          {metadataEntries.map(({ key, value }) => (
            <div key={key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
              <dt className="font-medium text-muted-foreground">
                {formatMetadataKey(key)}
              </dt>
              <dd className="break-words text-right text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
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

function TimelineLoading() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-2 border-l pl-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">Nenhuma mensagem encontrada</p>
      <p className="text-sm text-muted-foreground">
        O histórico deste chat ainda não possui mensagens visíveis.
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

function formatActor(actorType: AttendanceEvent["actorType"]) {
  if (actorType === "USER") return "operador";
  if (actorType === "ASSISTANT") return "assistente";
  if (actorType === "INTEGRATION") return "integração";
  return "sistema";
}

function formatMetadataKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatMessageStatus(status?: string | null) {
  if (!status) return "Status não informado";

  const labels: Record<string, string> = {
    ACCEPTED: "Aceita",
    DELIVERED: "Entregue",
    FAILED: "Falhou",
    PENDING: "Pendente",
    PROCESSING: "Processando",
    QUEUED: "Na fila",
    READ: "Lida",
    SENT: "Enviada",
  };

  return labels[status.toUpperCase()] || status.toLowerCase().replace(/_/g, " ");
}

function formatReplyModes(capabilities: AttendanceReplyCapabilities) {
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

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}
