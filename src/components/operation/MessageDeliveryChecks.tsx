import {
  formatOperationalMessageStatus,
} from "@/utils/operationalMessageStatus";
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

  if (summary.checks.length === 0) {
    if (!summary.deliveryStatus) return null;

    const observedAt = formatDeliveryCheckTime(summary.deliveryUpdatedAt);

    return (
      <p className="mt-2 text-xs opacity-75">
        {formatOperationalMessageStatus(summary.deliveryStatus)}
        {observedAt ? ` · ${observedAt}` : ""}
      </p>
    );
  }

  return (
    <p className="mt-2 break-words text-xs opacity-75" aria-label="Histórico de entrega">
      {summary.checks
        .map(
          (check) => {
            const observedAt = formatDeliveryCheckTime(check.observedAt);
            return `${formatOperationalMessageStatus(check.status)}${observedAt ? ` ${observedAt}` : ""}`;
          },
        )
        .join(" · ")}
    </p>
  );
}
