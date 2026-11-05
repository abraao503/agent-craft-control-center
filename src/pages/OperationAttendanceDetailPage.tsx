import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Clock,
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
  Webhook as WebhookIcon,
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
import { AttendanceChecklistPanel } from "@/components/operation/AttendanceChecklistPanel";
import { AttendanceInternalNote } from "@/components/operation/AttendanceInternalNote";
import { AttendanceMessageMedia } from "@/components/operation/AttendanceMessageMedia";
import { AudioMessage } from "@/components/chats/media/AudioMessage";
import { DocumentMessage } from "@/components/chats/media/DocumentMessage";
import { MessageReactions } from "@/components/chats/MessageReactions";
import { MessageReplyPreview } from "@/components/chats/MessageReplyPreview";
import { useQuotedMessageNavigation } from "@/hooks/useQuotedMessageNavigation";
import type { QuotedNavigationState } from "@/utils/quoted-message-navigation";
import { MessageDeliveryChecks } from "@/components/operation/MessageDeliveryChecks";
import { TemplateMessage } from "@/components/chats/media/TemplateMessage";
import { useMessageDeliveryChecks } from "@/components/operation/useMessageDeliveryChecks";
import { OperationalTriageAgentHistory } from "@/components/operation/OperationalTriageAgentHistory";
import { AttendanceComposer } from "@/components/operation/AttendanceComposer";
import { MigrateAttendanceChannelDialog } from "@/components/operation/MigrateAttendanceChannelDialog";
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
  WAITING_CUSTOMER_REPLY: "Aguardando resposta do cliente",
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
  MANUAL_CREATE: "Novo atendimento criado",
  INBOUND_RESUME: "Atendimento retomado",
  MIGRATE_CHANNEL: "Canal da conversa migrado",
  ROUTE: "Encaminhado para fila",
  CLAIM: "Assumido por operador",
  ASSIGN: "Responsável atribuído",
  TRANSFER: "Transferido para fila humana",
  UNASSIGN: "Responsável removido",
  PENDING: "Marcado como pendente",
  RESUME: "Retomado",
  CLOSE: "Encerrado",
  WEBHOOK_AUTOMATION_STARTED: "Automação iniciada via webhook",
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  INBOUND_CREATE: MessageSquare,
  INBOUND_RESUME: PlayCircle,
  MIGRATE_CHANNEL: ArrowRightLeft,
  ROUTE: ArrowRight,
  CLAIM: CheckCircle2,
  ASSIGN: UserPlus,
  TRANSFER: ArrowRightLeft,
  UNASSIGN: UserMinus,
  PENDING: PauseCircle,
  RESUME: PlayCircle,
  CLOSE: XCircle,
  WEBHOOK_AUTOMATION_STARTED: WebhookIcon,
};

const SECONDARY_PANEL_OPEN_STORAGE_KEY =
  "operation-attendance-detail-secondary-panel-open";

function getStoredSecondaryPanelOpen(): boolean {
  try {
    const storedValue = localStorage.getItem(SECONDARY_PANEL_OPEN_STORAGE_KEY);

    if (storedValue === "true") return true;
    if (storedValue === "false") return false;
  } catch {
    // Ignore storage errors and keep the default state.
  }

  return true;
}

interface OperationAttendanceDetailPageProps {
  realtimeEnabled?: boolean;
  embedded?: boolean;
}

interface OptimisticAudioMessage {
  id: string;
  createdAt: string;
  durationSeconds: number;
  mediaUrl?: string;
  mediaMimetype?: string;
  serverMessageId?: string;
  status: "preparing" | "sending" | "accepted" | "failed";
}

interface OptimisticFileMessage {
  id: string;
  createdAt: string;
  filename: string;
  mimetype: string;
  size: number;
  mediaUrl: string;
  serverMessageId?: string;
  status: "sending" | "accepted" | "failed";
}

interface OptimisticTextMessage {
  id: string;
  createdAt: string;
  text: string;
  serverMessageId?: string;
  status: "sending" | "accepted" | "failed";
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
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [secondaryPanelOpen, setSecondaryPanelOpen] = useState(
    getStoredSecondaryPanelOpen,
  );
  const [optimisticAudioMessages, setOptimisticAudioMessages] = useState<
    OptimisticAudioMessage[]
  >([]);
  const optimisticAudioUrlsRef = useRef(new Set<string>());
  const [optimisticFileMessages, setOptimisticFileMessages] = useState<
    OptimisticFileMessage[]
  >([]);
  const optimisticFileUrlsRef = useRef(new Set<string>());
  const [optimisticTextMessages, setOptimisticTextMessages] = useState<
    OptimisticTextMessage[]
  >([]);

  const startOptimisticText = (id: string, text: string) => {
    setOptimisticTextMessages((current) => [
      ...current.filter((message) => message.id !== id),
      { id, createdAt: new Date().toISOString(), text, status: "sending" },
    ]);
  };

  const markOptimisticTextAccepted = (id: string, serverMessageId: string) => {
    setOptimisticTextMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, serverMessageId, status: "accepted" }
          : message,
      ),
    );
  };

  const markOptimisticTextFailed = (id: string) => {
    setOptimisticTextMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, status: "failed" } : message,
      ),
    );
  };

  const startOptimisticFile = (id: string, file: File) => {
    const mediaUrl = URL.createObjectURL(file);
    optimisticFileUrlsRef.current.add(mediaUrl);
    setOptimisticFileMessages((current) => [
      ...current.filter((message) => message.id !== id),
      {
        id,
        createdAt: new Date().toISOString(),
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        mediaUrl,
        status: "sending",
      },
    ]);
  };

  const markOptimisticFileAccepted = (id: string, serverMessageId: string) => {
    setOptimisticFileMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, serverMessageId, status: "accepted" }
          : message,
      ),
    );
  };

  const markOptimisticFileFailed = (id: string) => {
    setOptimisticFileMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, status: "failed" } : message,
      ),
    );
  };

  const startOptimisticAudio = (id: string, durationSeconds: number) => {
    setOptimisticAudioMessages((current) => [
      ...current.filter((message) => message.id !== id),
      { id, durationSeconds, createdAt: new Date().toISOString(), status: "preparing" },
    ]);
  };

  const attachOptimisticAudio = (id: string, audioBlob: Blob) => {
    const mediaUrl = URL.createObjectURL(audioBlob);
    optimisticAudioUrlsRef.current.add(mediaUrl);
    setOptimisticAudioMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, mediaUrl, mediaMimetype: audioBlob.type, status: "sending" }
          : message,
      ),
    );
  };

  const markOptimisticAudioAccepted = (id: string, serverMessageId: string) => {
    setOptimisticAudioMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, serverMessageId, status: "accepted" }
          : message,
      ),
    );
  };

  const markOptimisticAudioFailed = (id: string) => {
    setOptimisticAudioMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, status: "failed" } : message,
      ),
    );
  };

  useEffect(
    () => () => {
      optimisticAudioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      optimisticAudioUrlsRef.current.clear();
      optimisticFileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      optimisticFileUrlsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        SECONDARY_PANEL_OPEN_STORAGE_KEY,
        String(secondaryPanelOpen),
      );
    } catch {
      // Ignore storage errors and keep the in-memory state.
    }
  }, [secondaryPanelOpen]);

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
  const timelineMessageIds = useMemo(
    () =>
      new Set(
        (timelineQuery.data?.pages.flatMap((page) => page.items) ?? [])
          .filter((item) => item.kind === "message")
          .map((item) => item.id),
      ),
    [timelineQuery.data],
  );
  useEffect(() => {
    const confirmed = optimisticAudioMessages.filter(
      (message) =>
        message.serverMessageId && timelineMessageIds.has(message.serverMessageId),
    );
    if (confirmed.length === 0) return;

    const confirmedIds = new Set(confirmed.map((message) => message.id));
    confirmed.forEach((message) => {
      if (message.mediaUrl) {
        URL.revokeObjectURL(message.mediaUrl);
        optimisticAudioUrlsRef.current.delete(message.mediaUrl);
      }
    });
    setOptimisticAudioMessages((current) =>
      current.filter((message) => !confirmedIds.has(message.id)),
    );
  }, [optimisticAudioMessages, timelineMessageIds]);
  useEffect(() => {
    const confirmed = optimisticFileMessages.filter(
      (message) =>
        message.serverMessageId && timelineMessageIds.has(message.serverMessageId),
    );
    if (confirmed.length === 0) return;

    const confirmedIds = new Set(confirmed.map((message) => message.id));
    confirmed.forEach((message) => {
      URL.revokeObjectURL(message.mediaUrl);
      optimisticFileUrlsRef.current.delete(message.mediaUrl);
    });
    setOptimisticFileMessages((current) =>
      current.filter((message) => !confirmedIds.has(message.id)),
    );
  }, [optimisticFileMessages, timelineMessageIds]);
  useEffect(() => {
    const confirmed = optimisticTextMessages.filter(
      (message) =>
        message.serverMessageId && timelineMessageIds.has(message.serverMessageId),
    );
    if (confirmed.length === 0) return;

    const confirmedIds = new Set(confirmed.map((message) => message.id));
    setOptimisticTextMessages((current) =>
      current.filter((message) => !confirmedIds.has(message.id)),
    );
  }, [optimisticTextMessages, timelineMessageIds]);
  const [remoteAnchorId, setRemoteAnchorId] = useState<string | null>(null);
  const remoteTimelineQuery = useOperationalAttendanceTimeline(
    workspaceId,
    attendanceId,
    {
      limit: 50,
      ...(remoteAnchorId ? { aroundMessageId: remoteAnchorId } : {}),
    },
    canViewAttendances && Boolean(remoteAnchorId),
  );
  const remoteTimelineItems = useMemo(() => {
    const seen = new Set<string>();
    return (remoteTimelineQuery.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? []).filter((item) => {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [remoteTimelineQuery.data]);
  const remoteFound = Boolean(
    remoteAnchorId &&
      remoteTimelineItems.some(
        (item) => item.kind === "message" && item.id === remoteAnchorId,
      ),
  );
  const remoteStatus = remoteAnchorId
    ? remoteTimelineQuery.isError
      ? "error"
      : remoteTimelineQuery.isLoading
        ? "loading"
        : remoteTimelineQuery.data
          ? "success"
          : "idle"
    : "idle";
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const handleMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    shouldStickToBottomRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 80;
  };
  const navigation = useQuotedMessageNavigation({
    scopeKey: `${workspaceId ?? ""}:${attendanceId ?? ""}`,
    containerRef: messagesViewportRef,
    requestRemoteMessage: setRemoteAnchorId,
    remoteMessageState: {
      targetMessageId: remoteAnchorId,
      status: remoteStatus,
      found: remoteFound,
    },
  });
  useEffect(() => {
    if (
      optimisticAudioMessages.length === 0 &&
      optimisticFileMessages.length === 0 &&
      optimisticTextMessages.length === 0
    ) {
      return;
    }
    requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
        shouldStickToBottomRef.current = true;
      }
    });
  }, [
    optimisticAudioMessages.length,
    optimisticFileMessages.length,
    optimisticTextMessages.length,
  ]);
  const returnToRecentRef = useRef(false);
  const showRemoteTimeline = Boolean(remoteAnchorId && remoteTimelineQuery.data);
  const activeTimelineQuery = showRemoteTimeline ? remoteTimelineQuery : timelineQuery;
  const outboundMessageIds = useMemo(
    () =>
      [
        ...(timelineQuery.data?.pages ?? []),
        ...(remoteTimelineQuery.data?.pages ?? []),
      ]
        .flatMap((page) => page.items)
        .filter(
          (item) => item.kind === "message" && item.sender !== "CUSTOMER",
        )
        .map((item) => item.id),
    [remoteTimelineQuery.data, timelineQuery.data],
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
  const timelineScrollSnapshotRef = useRef<{
    height: number;
    top: number;
  } | null>(null);
  const timelinePageCountRef = useRef(0);
  const markRead = markReadMutation.mutate;

  useEffect(() => {
    setRemoteAnchorId(null);
    returnToRecentRef.current = false;
    shouldStickToBottomRef.current = true;
    timelinePageCountRef.current = 0;
    timelineScrollSnapshotRef.current = null;
  }, [attendanceId, workspaceId]);

  useEffect(() => {
    if (!detailQuery.data || !attendanceId) return;
    if (markedAttendanceId.current === attendanceId) return;

    markedAttendanceId.current = attendanceId;
    markRead();
  }, [attendanceId, detailQuery.data, markRead]);

  useEffect(() => {
    if (!remoteAnchorId || !remoteTimelineQuery.isError) return;
    setRemoteAnchorId(null);
  }, [remoteAnchorId, remoteTimelineQuery.isError]);

  useEffect(() => {
    if (!remoteAnchorId || !remoteTimelineQuery.data || remoteFound) return;
    setRemoteAnchorId(null);
  }, [remoteAnchorId, remoteFound, remoteTimelineQuery.data]);

  useEffect(() => {
    if (!timelineQuery.data) return;
    if (remoteAnchorId || navigation.isNavigating) return;
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const previousPosition = timelineScrollSnapshotRef.current;
    const pageCount = timelineQuery.data.pages.length;

    if (returnToRecentRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      shouldStickToBottomRef.current = true;
      returnToRecentRef.current = false;
      timelineScrollSnapshotRef.current = null;
    } else if (previousPosition && pageCount > timelinePageCountRef.current) {
      viewport.scrollTop =
        viewport.scrollHeight - previousPosition.height + previousPosition.top;
      shouldStickToBottomRef.current =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 80;
      timelineScrollSnapshotRef.current = null;
    } else if (
      timelinePageCountRef.current === 0 ||
      shouldStickToBottomRef.current
    ) {
      viewport.scrollTop = viewport.scrollHeight;
      shouldStickToBottomRef.current = true;
    }

    timelinePageCountRef.current = pageCount;
  }, [navigation.isNavigating, remoteAnchorId, timelineQuery.data, timelineQuery.dataUpdatedAt]);

  const returnToRecent = () => {
    returnToRecentRef.current = true;
    setRemoteAnchorId(null);
    navigation.reset();
  };

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
  const timelineItems = activeTimelineQuery.data?.pages
    .slice()
    .reverse()
    .flatMap((page) => page.items) ?? [];
  const timelineDisplayItems = [
    ...timelineItems.map((item) => ({
      type: "timeline" as const,
      key: `${item.kind}:${item.id}`,
      createdAt: item.createdAt,
      item,
    })),
    ...optimisticAudioMessages
      .filter(
        (message) =>
          !message.serverMessageId ||
          !timelineItems.some(
            (item) =>
              item.kind === "message" && item.id === message.serverMessageId,
          ),
      )
      .map((message) => ({
        type: "audio" as const,
        key: `optimistic-audio:${message.id}`,
        createdAt: message.createdAt,
        message,
      })),
    ...optimisticFileMessages
      .filter(
        (message) =>
          !message.serverMessageId ||
          !timelineItems.some(
            (item) =>
              item.kind === "message" && item.id === message.serverMessageId,
          ),
      )
      .map((message) => ({
        type: "file" as const,
        key: `optimistic-file:${message.id}`,
        createdAt: message.createdAt,
        message,
      })),
    ...optimisticTextMessages
      .filter(
        (message) =>
          !message.serverMessageId ||
          !timelineItems.some(
            (item) =>
              item.kind === "message" && item.id === message.serverMessageId,
          ),
      )
      .map((message) => ({
        type: "text" as const,
        key: `optimistic-text:${message.id}`,
        createdAt: message.createdAt,
        message,
      })),
  ].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
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
    attendanceMutations.migrateChannel.isPending ||
    attendanceMutations.unassign.isPending ||
    attendanceMutations.pending.isPending ||
    attendanceMutations.resume.isPending ||
    attendanceMutations.close.isPending;
  const canManageAssignments = Boolean(
    canOperateAttendances && options?.capabilities.canAssign,
  );
  const canTransfer = Boolean(canOperateAttendances && options);
  const canMigrateChannel =
    canOperateAttendances && attendance.actionCapabilities?.canMigrateChannel === true;

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

  const runChannelMigration = async (targetChannelId: string) => {
    try {
      await attendanceMutations.migrateChannel.mutateAsync({
        attendanceId: attendance.id,
        expectedVersion: attendance.version,
        targetChannelId,
        reason: "Migração manual pelo detalhe do atendimento",
      });
      toast({
        title: "Conversa migrada",
        description: "O histórico, a equipe e o destino foram preservados.",
      });
      setMigrationDialogOpen(false);
    } catch (error) {
      toast({
        title: "Não foi possível migrar a conversa",
        description: getOperationalAttendanceErrorMessage(
          error,
          "O atendimento pode ter sido alterado em outra sessão. Atualize e tente novamente.",
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
  const channelUnavailable = Boolean(
    attendance.channel &&
      (!attendance.channel.active || attendance.channel.deletedAt),
  );

  return (
    <section
      className={
        embedded
          ? "[container-type:inline-size] flex h-full min-h-0 w-full min-w-0 flex-col bg-background"
          : "mx-auto flex w-full max-w-[1600px] flex-col gap-6"
      }
    >
      {embedded ? (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-2 [@container(min-width:64rem)]:py-2.5 lg:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              to="/operation/attendances"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Voltar para atendimentos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary [@container(min-width:32rem)]:flex">
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
            <AttendanceActionControls
              responsiveCompact
              status={attendance.status}
              hasAssignee={Boolean(attendance.assignee)}
              canResume={attendance.actionCapabilities?.canResume === true}
              canOperate={canOperateAttendances}
              canManageAssignments={canManageAssignments}
              canTransfer={canTransfer}
              canMigrateChannel={canMigrateChannel}
              optionsAvailable={Boolean(options)}
              pending={isActionPending}
              onQuickAction={(action) => void runQuickAction(action)}
              onAction={setActiveAction}
              onMigrateChannel={() => setMigrationDialogOpen(true)}
              viewControl={
                <Button
                  type="button"
                  variant={secondaryPanelOpen ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 shrink-0 px-2 [@container(min-width:40rem)]:px-3 [@container(min-width:64rem)]:hidden"
                  aria-label={secondaryPanelOpen ? "Ocultar detalhes" : "Mostrar detalhes"}
                  aria-expanded={secondaryPanelOpen}
                  aria-controls="attendance-details-panel"
                  title={secondaryPanelOpen ? "Ocultar detalhes" : "Mostrar detalhes"}
                  onClick={() => setSecondaryPanelOpen((open) => !open)}
                >
                  <PanelRightOpen className="h-4 w-4 [@container(min-width:40rem)]:mr-1.5" />
                  <span className="hidden [@container(min-width:40rem)]:inline">Detalhes</span>
                </Button>
              }
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

      {channelUnavailable ? (
        <Alert>
          <PauseCircle className="h-4 w-4" />
          <AlertTitle>O canal desta conversa está pausado ou arquivado</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            O histórico continua disponível, mas novas respostas ficam bloqueadas
            até a conversa ser migrada para um canal conectado.
            {canMigrateChannel ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMigrationDialogOpen(true)}
                disabled={isActionPending}
              >
                Migrar conversa
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={
          embedded
            ? secondaryPanelOpen
              ? "relative flex min-h-0 flex-1 overflow-hidden [@container(min-width:64rem)]:grid [@container(min-width:64rem)]:grid-cols-[minmax(0,1fr)_19rem]"
              : "relative flex min-h-0 flex-1 overflow-hidden [@container(min-width:64rem)]:grid [@container(min-width:64rem)]:grid-cols-[minmax(0,1fr)_3.25rem]"
            : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        }
      >
        {embedded && secondaryPanelOpen ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar painel de detalhes"
            onClick={() => setSecondaryPanelOpen(false)}
            className="absolute inset-0 z-20 cursor-default border-0 bg-black/20 p-0 [@container(min-width:64rem)]:hidden"
          />
        ) : null}
        <div
          className={
            embedded
              ? "min-h-0 min-w-0 flex-1"
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
              {remoteAnchorId ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  <span>
                    {showRemoteTimeline
                      ? "Exibindo outro trecho da conversa."
                      : "Carregando outro trecho da conversa…"}
                  </span>
                  <Button variant="outline" size="sm" onClick={returnToRecent}>
                    Voltar às recentes
                  </Button>
                </div>
              ) : null}
              {activeTimelineQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Não foi possível carregar a conversa
                  </AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-3">
                    {getOperationalAttendanceErrorMessage(
                      activeTimelineQuery.error,
                      "Tente atualizar a conversa.",
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void activeTimelineQuery.refetch()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : activeTimelineQuery.isLoading ? (
                <ConversationLoading />
              ) :
                timelineItems.length === 0 &&
                optimisticAudioMessages.length === 0 &&
                optimisticFileMessages.length === 0 &&
                optimisticTextMessages.length === 0 ? (
                <EmptyConversation />
              ) : (
                <>
                  <ScrollArea
                    ref={messagesViewportRef}
                    onScroll={handleMessagesScroll}
                    className={
                      embedded
                        ? "min-h-0 flex-1 bg-slate-50/70 px-4 py-4 dark:bg-slate-950/30"
                        : "h-[min(62vh,42rem)] pr-3"
                    }
                  >
                    <div className="space-y-3 pb-24">
                      {activeTimelineQuery.hasNextPage ? (
                        <div className="flex justify-center">
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
                              void activeTimelineQuery.fetchNextPage();
                            }}
                            disabled={activeTimelineQuery.isFetchingNextPage}
                          >
                            {activeTimelineQuery.isFetchingNextPage ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Carregar itens anteriores
                          </Button>
                        </div>
                      ) : null}
                      {timelineDisplayItems.map((entry) => {
                        if (entry.type === "audio") {
                          return (
                            <OptimisticAudioTimelineMessage
                              key={entry.key}
                              message={entry.message}
                            />
                          );
                        }
                        if (entry.type === "file") {
                          return (
                            <OptimisticFileTimelineMessage
                              key={entry.key}
                              message={entry.message}
                            />
                          );
                        }
                        if (entry.type === "text") {
                          return (
                            <OptimisticTextTimelineMessage
                              key={entry.key}
                              message={entry.message}
                            />
                          );
                        }

                        const item = entry.item;
                        if (item.kind === "message") {
                          return (
                            <ConversationMessage
                              key={entry.key}
                              message={item}
                              workspaceId={workspaceId}
                              attendanceId={attendanceId}
                              deliveryChecks={checksByMessageId.get(item.id)}
                              deliveryChecksState={deliveryChecksState}
                              highlighted={navigation.highlightedMessageId === item.id}
                              onNavigate={navigation.navigateToMessage}
                              navigationState={navigation.getPreviewState(item.id)}
                            />
                          );
                        }
                        if (item.kind === "internal_note") {
                          return (
                            <AttendanceInternalNote
                              key={entry.key}
                              note={item}
                            />
                          );
                        }
                        return <TimelineEvent key={entry.key} event={item} />;
                      })}
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
                onAudioSendStart={startOptimisticAudio}
                onAudioReady={attachOptimisticAudio}
                onAudioSendSuccess={markOptimisticAudioAccepted}
                onAudioSendError={markOptimisticAudioFailed}
                onMediaSendStart={startOptimisticFile}
                onMediaSendSuccess={markOptimisticFileAccepted}
                onMediaSendError={markOptimisticFileFailed}
                onTextSendStart={startOptimisticText}
                onTextSendSuccess={markOptimisticTextAccepted}
                onTextSendError={markOptimisticTextFailed}
              />
            </CardContent>
          </Card>
        </div>

        <Collapsible
          id="attendance-details-panel"
          open={secondaryPanelOpen}
          onOpenChange={setSecondaryPanelOpen}
          className={
            embedded
              ? secondaryPanelOpen
                ? "absolute inset-y-0 right-0 z-30 flex w-[min(19rem,100%)] min-w-0 flex-col border-l bg-card shadow-xl [@container(min-width:64rem)]:static [@container(min-width:64rem)]:z-auto [@container(min-width:64rem)]:w-auto [@container(min-width:64rem)]:shadow-none"
                : "hidden [@container(min-width:64rem)]:static [@container(min-width:64rem)]:flex [@container(min-width:64rem)]:min-h-0 [@container(min-width:64rem)]:flex-col [@container(min-width:64rem)]:border-l [@container(min-width:64rem)]:bg-card"
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
                ? "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3"
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
                        canMigrateChannel={canMigrateChannel}
                        optionsAvailable={Boolean(options)}
                        pending={isActionPending}
                        onQuickAction={(action) => void runQuickAction(action)}
                        onAction={setActiveAction}
                        onMigrateChannel={() => setMigrationDialogOpen(true)}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ) : null}

            <AttendanceChecklistPanel
              workspaceId={workspaceId!}
              attendanceId={attendance.id}
              canOperate={canOperateAttendances}
            />

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

      <MigrateAttendanceChannelDialog
        open={migrationDialogOpen}
        workspaceId={attendance.workspaceId}
        currentChannelId={attendance.channel?.id ?? attendance.companyWhatsappIntegrationId}
        currentChannelName={attendance.channel?.displayName}
        isSubmitting={attendanceMutations.migrateChannel.isPending}
        onOpenChange={setMigrationDialogOpen}
        onSubmit={runChannelMigration}
      />
    </section>
  );
}

function AttendanceActionControls({
  compact: fixedCompact = false,
  responsiveCompact = false,
  viewControl,
  status,
  hasAssignee,
  canResume,
  canOperate,
  canManageAssignments,
  canTransfer,
  canMigrateChannel,
  optionsAvailable,
  pending,
  onQuickAction,
  onAction,
  onMigrateChannel,
}: {
  compact?: boolean;
  responsiveCompact?: boolean;
  viewControl?: ReactNode;
  status: AttendanceStatus;
  hasAssignee: boolean;
  canResume: boolean;
  canOperate: boolean;
  canManageAssignments: boolean;
  canTransfer: boolean;
  canMigrateChannel: boolean;
  optionsAvailable: boolean;
  pending: boolean;
  onQuickAction: (action: "CLAIM" | "RESUME") => void;
  onAction: (action: AttendanceAction) => void;
  onMigrateChannel: () => void;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [narrowHeader, setNarrowHeader] = useState(true);

  useEffect(() => {
    if (!responsiveCompact) return;
    const header = toolbarRef.current?.closest("header");
    if (!header) return;

    const updateLayout = () => setNarrowHeader(header.clientWidth < 1024);
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(header);
    return () => observer.disconnect();
  }, [responsiveCompact]);

  const compact = responsiveCompact ? narrowHeader : fixedCompact;

  if (!canOperate) {
    return (
      <div ref={toolbarRef} className="flex items-center gap-2">
        <p className="shrink-0 text-xs text-muted-foreground">Visualização somente</p>
        {viewControl}
      </div>
    );
  }

  const canAssign =
    canManageAssignments &&
    ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(status);
  const canUnassign =
    hasAssignee && ["IN_PROGRESS", "PENDING"].includes(status);
  const canClose = ["IN_PROGRESS", "PENDING"].includes(status);
  const canTransferAttendance =
    canTransfer && ["WAITING_QUEUE", "IN_PROGRESS", "PENDING"].includes(status);
  const hasSecondaryActions =
    canTransferAttendance || status === "IN_PROGRESS" || canMigrateChannel;
  const hasManagementActions = canAssign || canUnassign;
  const hasMoreActions =
    canAssign || canUnassign || canClose || (compact && hasSecondaryActions);

  return (
    <div ref={toolbarRef} className={compact ? "flex shrink-0 items-center gap-1.5" : "flex min-w-0 flex-wrap items-center justify-end gap-1.5"} role="toolbar" aria-label="Ações do atendimento">
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
      {!compact && canTransferAttendance ? (
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction("TRANSFER")} disabled={pending}>
          <ArrowRightLeft className="mr-1.5 h-4 w-4" />
          Transferir
        </Button>
      ) : null}
      {!compact && status === "IN_PROGRESS" ? (
        <Button size="sm" variant="outline" className="h-8" onClick={() => onAction("PENDING")} disabled={pending}>
          <PauseCircle className="mr-1.5 h-4 w-4" />
          Aguardar
        </Button>
      ) : null}
      {!compact && canMigrateChannel ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={onMigrateChannel}
          disabled={pending}
        >
          <ArrowRightLeft className="mr-1.5 h-4 w-4" />
          Migrar canal
        </Button>
      ) : null}
      {viewControl}
      {hasMoreActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={compact ? "h-8 px-2 [@container(min-width:40rem)]:px-3" : "h-8 px-2 sm:px-3"}
                disabled={pending}
                aria-label={compact ? "Ações do atendimento" : "Mais ações"}
                title={compact ? "Ações do atendimento" : "Mais ações"}
              >
                <MoreHorizontal className={compact ? "h-4 w-4 [@container(min-width:40rem)]:mr-1.5" : "h-4 w-4 sm:mr-1.5"} />
                <span className={compact ? "hidden [@container(min-width:40rem)]:inline" : "hidden sm:inline"}>{compact ? "Ações" : "Mais ações"}</span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {compact && canTransferAttendance ? (
              <DropdownMenuItem onSelect={() => onAction("TRANSFER")}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transferir
              </DropdownMenuItem>
            ) : null}
            {compact && status === "IN_PROGRESS" ? (
              <DropdownMenuItem onSelect={() => onAction("PENDING")}>
                <PauseCircle className="mr-2 h-4 w-4" />
                Aguardar
              </DropdownMenuItem>
            ) : null}
            {compact && canMigrateChannel ? (
              <DropdownMenuItem onSelect={onMigrateChannel}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Migrar canal
              </DropdownMenuItem>
            ) : null}
            {compact && hasSecondaryActions && (hasManagementActions || canClose) ? <DropdownMenuSeparator /> : null}
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

function OptimisticAudioTimelineMessage({
  message,
}: {
  message: OptimisticAudioMessage;
}) {
  const duration = Number.isFinite(message.durationSeconds)
    ? Math.max(0, Math.floor(message.durationSeconds))
    : 0;
  const durationLabel = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;
  const statusLabel =
    message.status === "preparing"
      ? "Preparando áudio"
      : message.status === "sending"
        ? "Enviando"
        : message.status === "failed"
          ? "Falha no envio"
          : "Enviado";

  return (
    <article
      className="flex justify-end"
      data-message-id={message.id}
      aria-live="polite"
    >
      <div className="flex max-w-[min(90%,42rem)] flex-col">
        <div className="w-fit max-w-full rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
          {message.mediaUrl ? (
            <AudioMessage
              url={message.mediaUrl}
              mimetype={message.mediaMimetype}
            />
          ) : (
            <div className="flex min-h-10 min-w-56 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current/15">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium">Preparando áudio…</span>
                <span className="text-xs opacity-75">{durationLabel}</span>
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-end gap-1.5 text-xs opacity-75">
            <span>{formatDateTime(message.createdAt)}</span>
            {message.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" aria-label={statusLabel} />
            ) : message.status === "accepted" ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-label={statusLabel} />
            ) : (
              <Clock className="h-3.5 w-3.5" aria-label={statusLabel} />
            )}
            <span className="sr-only">{statusLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function OptimisticFileTimelineMessage({
  message,
}: {
  message: OptimisticFileMessage;
}) {
  const statusLabel =
    message.status === "sending"
      ? "Enviando arquivo"
      : message.status === "failed"
        ? "Falha no envio"
        : "Enviado";

  return (
    <article
      className="flex justify-end"
      data-message-id={message.id}
      aria-live="polite"
    >
      <div className="flex max-w-[min(90%,42rem)] flex-col">
        <div className="w-fit max-w-full rounded-2xl rounded-tr-sm bg-primary px-3 py-3 text-sm text-primary-foreground shadow-sm">
          <DocumentMessage
            url={message.mediaUrl}
            filename={message.filename}
            mimetype={message.mimetype}
          />
          <div className="mt-2 flex items-center justify-end gap-1.5 text-xs opacity-80">
            <span>{formatDateTime(message.createdAt)}</span>
            {message.status === "sending" ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-label={statusLabel}
              />
            ) : message.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" aria-label={statusLabel} />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-label={statusLabel} />
            )}
            <span>{statusLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{(message.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function OptimisticTextTimelineMessage({
  message,
}: {
  message: OptimisticTextMessage;
}) {
  const statusLabel =
    message.status === "sending"
      ? "Enviando mensagem"
      : message.status === "failed"
        ? "Falha no envio"
        : "Enviado";

  return (
    <article
      className="flex justify-end"
      data-message-id={message.id}
      aria-live="polite"
    >
      <div className="flex max-w-[min(90%,42rem)] flex-col">
        <div className="w-fit max-w-full rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <div className="mt-2 flex items-center justify-end gap-1.5 text-xs opacity-75">
            <span>{formatDateTime(message.createdAt)}</span>
            {message.status === "sending" ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-label={statusLabel}
              />
            ) : message.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" aria-label={statusLabel} />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-label={statusLabel} />
            )}
            <span className="sr-only">{statusLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ConversationMessage({
  message,
  workspaceId,
  attendanceId,
  deliveryChecks,
  deliveryChecksState,
  highlighted,
  onNavigate,
  navigationState,
}: {
  message: AttendanceMessageItem;
  workspaceId?: string;
  attendanceId?: string;
  deliveryChecks?: MessageDeliveryCheckSummary;
  deliveryChecksState: MessageDeliveryChecksQueryState;
  highlighted: boolean;
  onNavigate: (targetMessageId: string, sourceMessageId: string) => void;
  navigationState: QuotedNavigationState;
}) {
  const isCustomer = message.sender === "CUSTOMER";
  const senderLabel =
    message.sender === "CUSTOMER"
      ? "Cliente"
      : message.sender === "HUMAN"
        ? message.sentByUser?.name || "Operador"
        : "Agente";
  const content = message.content?.trim();
  const normalizedType = message.type.toLowerCase();
  const isTemplate = normalizedType === "template";
  const hasMedia = ["image", "audio", "video", "document"].includes(normalizedType);
  const hasDeliveryChecks =
    !isCustomer && deliveryChecksState !== "disabled";
  const messageStatuses = [message.dispatchStatus, message.deliveryStatus]
    .filter((status): status is string => Boolean(status))
    .map((status) => formatOperationalMessageStatus(status));

  return (
    <article
      className={`flex rounded-lg transition-shadow ${highlighted ? "ring-2 ring-primary ring-offset-2" : ""} ${isCustomer ? "justify-start" : "justify-end"}`}
      data-message-id={message.id}
      tabIndex={-1}
    >
      <div className="flex max-w-[min(90%,42rem)] flex-col">
        <div
          className={`w-fit max-w-full rounded-2xl px-4 py-3 text-sm ${
          isCustomer
            ? "rounded-tl-sm bg-muted text-foreground shadow-sm"
            : "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
        }`}
        >
          <MessageReplyPreview
            replyContext={message.replyContext}
            onNavigate={(targetMessageId) => onNavigate(targetMessageId, message.id)}
            navigationState={navigationState}
          />
          {hasMedia ? (
            <AttendanceMessageMedia
              workspaceId={workspaceId}
              attendanceId={attendanceId}
              message={message}
            />
          ) : null}
          {message.templateName ? (
            <p className="mb-1 font-medium">Template: {message.templateName}</p>
          ) : null}
          {isTemplate ? (
            <TemplateMessage
              snapshot={message.templateSnapshot}
              fallbackBody={content || message.templateName || "Template Meta"}
            />
          ) : !hasMedia && content ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1 text-xs opacity-75">
            <span>{formatDateTime(message.createdAt)}</span>
            {hasDeliveryChecks && (
              <MessageDeliveryChecks
                summary={deliveryChecks}
                state={deliveryChecksState}
              />
            )}
          </div>
        </div>
        <MessageReactions
          reactions={message.reactions}
          align={isCustomer ? "start" : "end"}
        />
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
    formatDateTime(event.createdAt),
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
