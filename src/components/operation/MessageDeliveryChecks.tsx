import {
  formatOperationalMessageStatus,
  OPERATIONAL_PROVIDER_LABELS,
} from "@/utils/operationalMessageStatus";
import type { MessageDeliveryCheckSummary } from "@/types/operation-attendance";

function formatDeliveryCheckTime(observedAt: string): string {
  return new Date(observedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageDeliveryChecks({
  summary,
}: {
  summary?: MessageDeliveryCheckSummary;
}) {
  if (!summary) return null;

  if (!summary.statusTrackingSupported) {
    const providerLabel = summary.provider
      ? OPERATIONAL_PROVIDER_LABELS[summary.provider]
      : undefined;

    return (
      <p className="mt-2 text-xs opacity-75">
        {providerLabel
          ? `Confirmações de entrega indisponíveis no canal ${providerLabel}.`
          : "Confirmações de entrega indisponíveis neste canal."}
      </p>
    );
  }

  if (summary.checks.length === 0) {
    if (!summary.deliveryStatus) return null;

    return (
      <p className="mt-2 text-xs opacity-75">
        {formatOperationalMessageStatus(summary.deliveryStatus)}
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs opacity-75">
      {summary.checks
        .map(
          (check) =>
            `${formatOperationalMessageStatus(check.status)} ${formatDeliveryCheckTime(check.observedAt)}`,
        )
        .join(" · ")}
    </p>
  );
}
