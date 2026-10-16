import { Badge } from "@/components/ui/badge";
import type {
  OperationalWebhookExecutionStatus,
  OperationalWebhookStatus,
} from "@/types/operational-webhook";

export function OperationWebhookStatusBadge({
  status,
}: {
  status: OperationalWebhookStatus | OperationalWebhookExecutionStatus;
}) {
  const labels: Record<typeof status, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    PENDING: "Aguardando",
    PROCESSING: "Processando",
    ACCEPTED: "Aceito",
    FAILED: "Falhou",
    UNKNOWN: "Indefinido",
  };
  const destructive = status === "FAILED" || status === "INACTIVE";
  return (
    <Badge variant={destructive ? "destructive" : status === "ACTIVE" ? "default" : "secondary"}>
      {labels[status]}
    </Badge>
  );
}
