import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  ChevronDown,
  Loader2,
  MessageSquare,
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
import { AttendanceEvent, AttendanceMessageItem, AttendanceStatus } from "@/types/operation-attendance";
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
        <header className="flex shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-3 lg:px-5">
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
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OperationalRealtimeStatus
              status={realtime.status}
              joinedWorkspace={realtime.joinedWorkspace}
            />
            <Link
              to="/operation/attendances"
              className="hidden h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
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
              Ciclo {attendance.cycleNumber} · versão {attendance.version}
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
            ? "grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_19rem]"
            : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        }
      >
        <div className={embedded ? "min-h-0 min-w-0" : "min-w-0 space-y-6"}>
          <Card
            className={
              embedded
                ? "flex h-full min-h-0 min-w-0 flex-col rounded-none border-0 shadow-none"
                : "min-w-0"
            }
          >
            <CardHeader
              className={
                embedded ? "shrink-0 border-b p-4" : undefined
              }
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversa
              </CardTitle>
              <CardDescription className={embedded ? "text-xs" : undefined}>
                {embedded
                  ? `Ciclo ${attendance.cycleNumber} · versão ${attendance.version}`
                  : "Mensagens do chat compartilhado, em ordem cronológica."}
              </CardDescription>
            </CardHeader>
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
              ? "flex min-h-0 min-w-0 flex-col border-l bg-card"
              : "min-w-0"
          }
        >
          <div
            className={
              embedded
                ? "flex shrink-0 items-center justify-between border-b px-3 py-3"
                : "mb-3 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2"
            }
          >
            <div>
              <p className="text-sm font-semibold">Painel secundário</p>
              <p className="text-xs text-muted-foreground">
                Contexto, ações e histórico do ciclo.
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  secondaryPanelOpen
                    ? "Recolher painel secundário"
                    : "Expandir painel secundário"
                }
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${secondaryPanelOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent
            className={
              embedded
                ? "min-h-0 flex-1 space-y-4 overflow-y-auto p-3"
                : "space-y-6"
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-5 w-5 text-primary" />
                  Contato e ciclo
                </CardTitle>
                <CardDescription>
                  Informações autorizadas para o atendimento selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailField label="Contato" value={customerName} />
                <DetailField
                  label="Telefone"
                  value={attendance.customer?.phone || "Não informado"}
                />
                <DetailField
                  label="E-mail"
                  value={attendance.customer?.email || "Não informado"}
                />
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
                <DetailField
                  label="Provedor"
                  value={attendance.channel?.provider || "Não informado"}
                />
                <DetailField
                  label="Não lidas"
                  value={String(attendance.unreadCount ?? 0)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações do atendimento</CardTitle>
                <CardDescription>
                  Comandos disponíveis para o estado e a permissão atuais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
              {!canOperateAttendances ? (
                <p className="text-sm text-muted-foreground">
                  Você pode consultar este atendimento, mas não possui permissão para operá-lo.
                </p>
              ) : (
                <>
                  {optionsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Opções de operação indisponíveis</AlertTitle>
                      <AlertDescription>
                        Não foi possível carregar áreas, filas e operadores para os comandos.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {attendance.status === "WAITING_QUEUE" ? (
                      <Button
                        size="sm"
                        onClick={() => void runQuickAction("CLAIM")}
                        disabled={isActionPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Assumir
                      </Button>
                    ) : null}
                    {attendance.status === "TRIAGE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveAction("ROUTE")}
                        disabled={!options || isActionPending}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Encaminhar
                      </Button>
                    ) : null}
                    {canManageAssignments &&
                    ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(attendance.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveAction("ASSIGN")}
                        disabled={isActionPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Atribuir
                      </Button>
                    ) : null}
                    {canTransfer &&
                    ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(attendance.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveAction("TRANSFER")}
                        disabled={isActionPending}
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transferir
                      </Button>
                    ) : null}
                    {attendance.status === "IN_PROGRESS" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveAction("PENDING")}
                        disabled={isActionPending}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pendenciar
                      </Button>
                    ) : null}
                    {attendance.status === "PENDING" ? (
                      <Button
                        size="sm"
                        onClick={() => void runQuickAction("RESUME")}
                        disabled={isActionPending}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Retomar
                      </Button>
                    ) : null}
                    {attendance.assignee &&
                    ["IN_PROGRESS", "PENDING"].includes(attendance.status) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveAction("UNASSIGN")}
                        disabled={isActionPending}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Desatribuir
                      </Button>
                    ) : null}
                    {["IN_PROGRESS", "PENDING"].includes(attendance.status) ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setActiveAction("CLOSE")}
                        disabled={isActionPending}
                      >
                        Encerrar
                      </Button>
                    ) : null}
                  </div>
                  {attendance.status === "CLOSED" ? (
                    <p className="text-sm text-muted-foreground">Este ciclo já foi encerrado.</p>
                  ) : null}
                </>
              )}
              </CardContent>
            </Card>

            <AttendanceFollowUpsCard
              workspaceId={workspaceId!}
              attendanceId={attendance.id}
              expectedVersion={attendance.version}
              status={attendance.status}
              canManage={canOperateAttendances}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capacidade de resposta</CardTitle>
                <CardDescription>
                  A disponibilidade abaixo é calculada pelo canal e pelo estado do atendimento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Badge variant={getReplyStatusVariant(attendance.replyCapabilities.status)}>
                  {REPLY_STATUS_LABELS[attendance.replyCapabilities.status]}
                </Badge>
                <div className="grid grid-cols-2 gap-2">
                  <Capability label="Texto" enabled={attendance.replyCapabilities.supportsText} />
                  <Capability label="Mídia" enabled={attendance.replyCapabilities.supportsMedia} />
                  <Capability label="Template" enabled={attendance.replyCapabilities.supportsTemplate} />
                  <Capability label="Canal" enabled={Boolean(attendance.channel)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Timeline do ciclo
                </CardTitle>
                <CardDescription>
                  Eventos do Attendance atual, sem conteúdo interno de provider.
                </CardDescription>
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-medium">{value}</p>
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
            {message.dispatchStatus || "Sem dispatch"}
            {message.deliveryStatus ? ` · ${message.deliveryStatus}` : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function TimelineEvent({ event }: { event: AttendanceEvent }) {
  return (
    <div className="relative border-l pl-4">
      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
      <p className="font-medium">{EVENT_LABELS[event.action] || event.action}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDateTime(event.createdAt)} · versão {event.aggregateVersion}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ator: {formatActor(event.actorType)}
      </p>
      {event.reason ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {event.reason}
        </p>
      ) : null}
    </div>
  );
}

function Capability({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span>{label}</span>
      <span className={enabled ? "text-emerald-600" : "text-muted-foreground"}>
        {enabled ? "Disponível" : "Indisponível"}
      </span>
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
