import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AttendanceStatus, OperationalConversation } from "@/types/operation-attendance";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
  PENDING: "Pendente",
  CLOSED: "Encerrado",
};

const MESSAGE_SENDER_LABELS = {
  CUSTOMER: "Cliente",
  HUMAN: "Operador",
  ASSISTANT: "Agente",
} as const;

export function OperationalConversationCard({
  conversation,
  selected = false,
  compact = false,
}: {
  conversation: OperationalConversation;
  selected?: boolean;
  compact?: boolean;
}) {
  const attendance = conversation.attendance;
  const customerName = attendance.customer?.name || "Contato sem nome";
  const lastMessage = attendance.lastMessage;
  const destination = [
    attendance.destination?.areaName,
    attendance.destination?.queueName,
  ]
    .filter(Boolean)
    .join(" · ");
  const activityAt = lastMessage?.createdAt || conversation.lastActivityAt;
  const assignee = attendance.assignee?.name || "Sem responsável";
  const operationalContext = [destination || "Destino não definido", assignee]
    .filter(Boolean)
    .join(" · ");
  const cycleLabel =
    conversation.attendanceCount === 1
      ? "1 atendimento"
      : `${conversation.attendanceCount} atendimentos`;

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
          <div
            className={`min-w-0 flex-1 ${compact ? "space-y-1.5" : "space-y-2"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className={`${compact ? "text-sm" : ""} truncate font-semibold`}>
                  {customerName}
                </h3>
                {conversation.unreadCount ? (
                  <Badge
                    className="min-w-5 justify-center bg-primary px-1.5 text-[10px] text-primary-foreground hover:bg-primary"
                    aria-label={`${conversation.unreadCount} mensagens novas`}
                  >
                    {conversation.unreadCount}
                  </Badge>
                ) : null}
              </div>
              <time
                dateTime={activityAt}
                title={new Date(activityAt).toLocaleString("pt-BR")}
                className="shrink-0 text-[11px] text-muted-foreground"
              >
                {formatListTimestamp(activityAt)}
              </time>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate" title={cycleLabel}>
                {cycleLabel}
              </span>
              {attendance.cycleNumber > 1 ? (
                <span className="shrink-0">· ciclo atual {attendance.cycleNumber}</span>
              ) : null}
            </div>

            <p
              className={`${compact ? "text-xs" : "text-sm"} truncate text-muted-foreground`}
            >
              {lastMessage ? (
                <>
                  <span className="font-medium text-foreground">
                    {MESSAGE_SENDER_LABELS[lastMessage.sender]}:
                  </span>{" "}
                  {lastMessage.preview}
                </>
              ) : (
                "Nenhuma mensagem disponível."
              )}
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

function formatListTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  if (status === "IN_PROGRESS") {
    return "bg-emerald-600 text-white hover:bg-emerald-600";
  }
  if (status === "WAITING_QUEUE") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (status === "TRIAGE") {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }
  if (status === "PENDING") {
    return "border-violet-300 bg-violet-50 text-violet-800";
  }
  return "";
}
