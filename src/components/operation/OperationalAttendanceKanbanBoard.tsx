import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  defaultKeyboardCoordinateGetter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  ArrowRightLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GripVertical,
  Inbox,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Radio,
  UserMinus,
  UserPlus,
  UserRound,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Attendance,
  AttendanceKanbanColumn,
  AttendanceKanbanPage,
  AttendanceStatus,
  AttendanceWithDetails,
} from "@/types/operation-attendance";
import {
  getOperationalKanbanActionMenu,
  OperationalKanbanMoveAction,
} from "./operationalAttendanceKanbanMoves";

const STATUS_ORDER: AttendanceStatus[] = [
  "TRIAGE",
  "WAITING_QUEUE",
  "IN_PROGRESS",
  "PENDING",
  "CLOSED",
];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
  PENDING: "Pendente",
  CLOSED: "Encerrado",
};

const STATUS_CLASS_NAMES: Record<AttendanceStatus, string> = {
  TRIAGE: "border-amber-200 bg-amber-50 text-amber-700",
  WAITING_QUEUE: "border-sky-200 bg-sky-50 text-sky-700",
  IN_PROGRESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-violet-200 bg-violet-50 text-violet-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
};

const COLUMN_DROPZONE_IDS: Record<AttendanceStatus, string> = {
  TRIAGE: "operation-kanban-column-triage",
  WAITING_QUEUE: "operation-kanban-column-waiting-queue",
  IN_PROGRESS: "operation-kanban-column-in-progress",
  PENDING: "operation-kanban-column-pending",
  CLOSED: "operation-kanban-column-closed",
};

const MESSAGE_SENDER_LABELS = {
  CUSTOMER: "Cliente",
  HUMAN: "Operador",
  ASSISTANT: "Assistente",
} as const;

const ACTION_LABELS: Record<OperationalKanbanMoveAction, string> = {
  ROUTE: "Encaminhar",
  CLAIM: "Atender",
  ASSIGN: "Atribuir responsável",
  TRANSFER: "Transferir",
  PENDING: "Marcar como pendente",
  RESUME: "Retomar",
  UNASSIGN: "Remover responsável",
  CLOSE: "Encerrar atendimento",
};

const ACTION_ICONS: Record<OperationalKanbanMoveAction, LucideIcon> = {
  ROUTE: ArrowRight,
  CLAIM: CheckCircle2,
  ASSIGN: UserPlus,
  TRANSFER: ArrowRightLeft,
  PENDING: PauseCircle,
  RESUME: PlayCircle,
  UNASSIGN: UserMinus,
  CLOSE: XCircle,
};

interface OperationalAttendanceKanbanBoardProps {
  data?: AttendanceKanbanPage;
  channelNames?: Map<string, string>;
  canOperate?: boolean;
  isLoading?: boolean;
  movingAttendanceId?: string | null;
  onMoveAttendance?: (
    attendance: AttendanceWithDetails,
    targetStatus: AttendanceStatus,
  ) => void;
  onAction?: (
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
  ) => void;
}

export function OperationalAttendanceKanbanBoard({
  data,
  channelNames = new Map(),
  canOperate = false,
  isLoading = false,
  movingAttendanceId = null,
  onMoveAttendance,
  onAction,
}: OperationalAttendanceKanbanBoardProps) {
  const [activeAttendance, setActiveAttendance] =
    useState<AttendanceWithDetails | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: defaultKeyboardCoordinateGetter,
    }),
  );

  if (isLoading && !data) {
    return <KanbanBoardSkeleton />;
  }

  const columns = STATUS_ORDER.map((status) => {
    const column = data?.columns.find((item) => item.status === status);
    return (
      column ?? {
        status,
        items: [],
        total: 0,
        page: data?.page ?? 1,
        limit: data?.limit ?? 0,
        totalPages: 0,
      }
    );
  });

  const handleDragStart = ({ active }: DragStartEvent) => {
    const attendance = active.data.current?.attendance;
    setActiveAttendance(isAttendanceWithDetails(attendance) ? attendance : null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveAttendance(null);
    if (!canOperate || !over || !onMoveAttendance) return;

    const attendance = active.data.current?.attendance;
    const targetStatus = over.data.current?.status;
    if (
      !isAttendanceWithDetails(attendance) ||
      !isAttendanceStatus(targetStatus)
    ) {
      return;
    }

    onMoveAttendance(attendance, targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveAttendance(null)}
    >
      <div
        className="min-h-0 h-full overflow-x-auto p-3 sm:p-4 lg:p-5"
        role="region"
        aria-label="Quadro Kanban operacional"
      >
        <div className="flex h-full min-w-max items-stretch gap-4">
          {columns.map((column) => (
            <OperationalAttendanceKanbanColumn
              key={column.status}
              column={column}
              channelNames={channelNames}
              canOperate={canOperate}
              movingAttendanceId={movingAttendanceId}
              onAction={onAction}
            />
          ))}
        </div>
        {activeAttendance ? (
          <p className="sr-only" aria-live="assertive">
            Movendo atendimento de {activeAttendance.customer?.name || "contato"}.
            Use as setas para escolher uma coluna e pressione Espaço para soltar.
          </p>
        ) : null}
      </div>
    </DndContext>
  );
}

function OperationalAttendanceKanbanColumn({
  column,
  channelNames,
  canOperate,
  movingAttendanceId,
  onAction,
}: {
  column: AttendanceKanbanColumn;
  channelNames: Map<string, string>;
  canOperate: boolean;
  movingAttendanceId: string | null;
  onAction?: (
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
  ) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: COLUMN_DROPZONE_IDS[column.status],
    data: { status: column.status },
    disabled: !canOperate,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[30rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden border-border/80 bg-background/80 shadow-sm transition-shadow sm:w-[22rem]",
        isOver && "ring-2 ring-primary/60 ring-offset-2",
      )}
    >
      <CardHeader className="shrink-0 border-b bg-card/90 p-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                columnStatusDotClassNames[column.status],
              )}
            />
            <span className="truncate">{STATUS_LABELS[column.status]}</span>
          </CardTitle>
          <Badge
            variant="secondary"
            className="min-w-7 justify-center rounded-full px-2"
          >
            {column.total}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {column.items.length} exibido(s) nesta página
        </p>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-2">
        <ScrollArea className="h-[calc(100vh-15rem)] min-h-[23rem] pr-2">
          {column.items.length > 0 ? (
            <div className="space-y-2">
              {column.items.map((attendance) => (
                <OperationalAttendanceKanbanCard
                  key={attendance.id}
                  attendance={attendance}
                  channelNames={channelNames}
                  canOperate={canOperate}
                  isMoving={movingAttendanceId !== null}
                  onAction={onAction}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[23rem] flex-col items-center justify-center gap-2 px-5 text-center">
              <Inbox className="h-7 w-7 text-muted-foreground/70" />
              <p className="text-sm font-medium">Nenhum atendimento</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Não há cards visíveis nesta coluna para o escopo atual.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function OperationalAttendanceKanbanCard({
  attendance,
  channelNames,
  canOperate,
  isMoving,
  onAction,
}: {
  attendance: AttendanceWithDetails;
  channelNames: Map<string, string>;
  canOperate: boolean;
  isMoving: boolean;
  onAction?: (
    attendance: AttendanceWithDetails,
    action: OperationalKanbanMoveAction,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: attendance.id,
    data: { attendance },
    disabled: !canOperate || isMoving,
  });
  const actionMenu = getOperationalKanbanActionMenu(attendance.status);
  const customerName = attendance.customer?.name || "Contato sem nome";
  const destination = [
    attendance.destination?.areaName,
    attendance.destination?.queueName,
  ]
    .filter(Boolean)
    .join(" · ");
  const assignee = attendance.assignee?.name || "Sem responsável";
  const AssigneeIcon = attendance.assignee?.type === "ASSISTANT" ? Bot : UserRound;
  const assigneeLabel = attendance.assignee
    ? `${attendance.assignee.type === "ASSISTANT" ? "IA" : "Humano"} · ${assignee}`
    : assignee;
  const channelName =
    channelNames.get(attendance.companyWhatsappIntegrationId) ||
    (attendance.companyWhatsappIntegrationId ? "Canal operacional" : null);
  const activityAt =
    attendance.status === "CLOSED"
      ? attendance.closedAt || attendance.updatedAt
      : attendance.lastActivityAt;
  const pending =
    attendance.status === "PENDING" ||
    Boolean(attendance.pendingReason || attendance.pendingDueAt);

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.03]",
        isDragging && "opacity-40",
        isMoving && !isDragging && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        <Link
          to={`/operation/attendances/${attendance.id}`}
          className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Abrir atendimento de ${customerName}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {customerName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {customerName}
                  </h3>
                  {attendance.customer?.phoneMasked ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {attendance.customer.phoneMasked}
                    </p>
                  ) : null}
                </div>
                {attendance.unreadCount ? (
                  <Badge
                    className="shrink-0 bg-primary px-1.5 text-[10px] text-primary-foreground hover:bg-primary"
                    aria-label={`${attendance.unreadCount} mensagens novas`}
                  >
                    {attendance.unreadCount}
                  </Badge>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatElapsed(activityAt, attendance.status)}
                </span>
              </div>

              {attendance.lastMessage ? (
                <p className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">
                    <span className="font-medium text-foreground">
                      {MESSAGE_SENDER_LABELS[attendance.lastMessage.sender]}:
                    </span>{" "}
                    {attendance.lastMessage.preview}
                  </span>
                </p>
              ) : null}

              <div className="space-y-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                <MetadataRow
                  icon={MapPin}
                  label="Destino"
                  value={destination || "Não definido"}
                />
                <MetadataRow
                  icon={AssigneeIcon}
                  label="Responsável"
                  value={assigneeLabel}
                />
                {channelName ? (
                  <MetadataRow icon={Radio} label="Canal" value={channelName} />
                ) : null}
                {pending ? (
                  <MetadataRow
                    icon={CalendarClock}
                    label="Pendência"
                    value={formatPending(attendance)}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        {canOperate ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
              disabled={isMoving}
              aria-label={`Arrastar atendimento de ${customerName}`}
              title="Arrastar atendimento"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            {actionMenu.length > 0 && onAction ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={isMoving}
                    aria-label={`Ações de ${customerName}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {actionMenu.map((action) => {
                    const ActionIcon = ACTION_ICONS[action];
                    return (
                      <DropdownMenuItem
                        key={action}
                        onSelect={() => onAction(attendance, action)}
                      >
                        <ActionIcon className="mr-2 h-4 w-4" />
                        {ACTION_LABELS[action]}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
      <span className="min-w-0 truncate">
        <span className="font-medium text-foreground/80">{label}:</span>{" "}
        {value}
      </span>
    </div>
  );
}

function formatElapsed(value: string | null, status: AttendanceStatus) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Tempo indisponível";

  const prefix = status === "CLOSED" ? "Encerrado" : "Espera";
  return `${prefix} ${formatDistanceToNow(date, {
    addSuffix: true,
    locale: ptBR,
  })}`;
}

function formatPending(attendance: Attendance) {
  const reason = attendance.pendingReason?.trim();
  const dueAt = attendance.pendingDueAt
    ? formatDateTime(attendance.pendingDueAt)
    : null;

  if (reason && dueAt) return `${reason} · até ${dueAt}`;
  if (reason) return reason;
  if (dueAt) return `até ${dueAt}`;
  return "Aguardando retomada";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data indisponível";
  return format(date, "dd/MM HH:mm", { locale: ptBR });
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && STATUS_ORDER.includes(value as AttendanceStatus);
}

function isAttendanceWithDetails(
  value: unknown,
): value is AttendanceWithDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "status" in value &&
    isAttendanceStatus(value.status)
  );
}

const columnStatusDotClassNames: Record<AttendanceStatus, string> = {
  TRIAGE: "bg-amber-500",
  WAITING_QUEUE: "bg-sky-500",
  IN_PROGRESS: "bg-emerald-500",
  PENDING: "bg-violet-500",
  CLOSED: "bg-slate-400",
};

function KanbanBoardSkeleton() {
  return (
    <div className="min-h-0 h-full overflow-x-auto p-3 sm:p-4 lg:p-5">
      <div className="flex h-full min-w-max gap-4">
        {STATUS_ORDER.map((status) => (
          <Card
            key={status}
            className="flex h-full min-h-[30rem] w-[min(22rem,calc(100vw-2rem))] flex-col sm:w-[22rem]"
          >
            <CardHeader className="space-y-3 border-b p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36" />
            </CardHeader>
            <CardContent className="space-y-2 p-2">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="p-3 shadow-none">
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Carregando quadro operacional</span>
    </div>
  );
}
