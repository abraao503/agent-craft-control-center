import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import type { ReactNode } from "react";
import type {
  MessageDeliveryCheckSummary,
  MessageDeliveryChecksQueryState,
} from "@/types/operation-attendance";

function formatDeliveryCheckTime(observedAt?: string | null): string | null {
  if (!observedAt) return null;

  const date = new Date(observedAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeliveryStatusIcon({
  status,
  observedAt,
}: {
  status: string;
  observedAt?: string | null;
}) {
  const normalizedStatus = status.trim().toUpperCase();
  const observedTime = formatDeliveryCheckTime(observedAt);
  const isRead = ["READ", "READ_BY_ME", "PLAYED"].includes(normalizedStatus);
  const isDelivered = ["DELIVERED", "DELIVERY_ACK", "RECEIVED"].includes(
    normalizedStatus,
  );
  const isFailure = ["FAILED", "ERROR", "UNKNOWN"].includes(normalizedStatus);
  const label = isRead
    ? "Mensagem lida"
    : isDelivered
      ? "Mensagem entregue"
      : isFailure
        ? "Falha no envio"
        : normalizedStatus === "PENDING"
          ? "Mensagem pendente"
          : "Mensagem enviada";
  const title = observedTime ? `${label} · ${observedTime}` : label;
  const iconClassName = "h-4 w-4 shrink-0";
  const renderIcon = (icon: ReactNode) => (
    <span className="inline-flex" role="img" aria-label={label} title={title}>
      {icon}
    </span>
  );

  if (normalizedStatus === "PENDING") {
    return renderIcon(
      <Clock
        className={`${iconClassName} text-slate-300`}
        aria-hidden="true"
      />
    );
  }

  if (isFailure) {
    return renderIcon(
      <AlertCircle
        className={`${iconClassName} text-red-300`}
        aria-hidden="true"
      />
    );
  }

  if (isRead || isDelivered) {
    return renderIcon(
      <CheckCheck
        className={`${iconClassName} ${
          isRead ? "text-blue-300" : "text-slate-300"
        }`}
        aria-hidden="true"
      />
    );
  }

  return renderIcon(
    <Check
      className={`${iconClassName} text-slate-300`}
      aria-hidden="true"
    />
  );
}

export function MessageDeliveryChecks({
  summary,
  state = "ready",
}: {
  summary?: MessageDeliveryCheckSummary;
  state?: Exclude<MessageDeliveryChecksQueryState, "disabled">;
}) {
  if (state === "loading") {
    return (
      <p className="mt-2 text-xs opacity-75" role="status" aria-live="polite">
        Carregando confirmações de entrega...
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="mt-2 text-xs text-destructive" role="alert">
        Não foi possível carregar as confirmações de entrega.
      </p>
    );
  }

  if (!summary) return null;

  if (!summary.statusTrackingSupported) return null;

  const latestCheck = summary.checks[summary.checks.length - 1];
  const status = summary.deliveryStatus || latestCheck?.status;
  if (!status) return null;

  const observedAt = summary.deliveryUpdatedAt || latestCheck?.observedAt;
  const observedTime = formatDeliveryCheckTime(observedAt);

  return (
    <span
      className="mt-2 inline-flex items-center gap-1 text-xs opacity-75"
      aria-label="Status da mensagem"
    >
      {observedTime ? <span>{observedTime}</span> : null}
      <DeliveryStatusIcon status={status} observedAt={observedAt} />
    </span>
  );
}
