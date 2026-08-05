import { Badge } from "@/components/ui/badge";
import type { DealWebhookExecutionStatus } from "@/types/deal-webhook";

interface DealWebhookStatusBadgeProps {
  status: DealWebhookExecutionStatus;
}

export function DealWebhookStatusBadge({
  status,
}: DealWebhookStatusBadgeProps) {
  const config = {
    pending: { label: "Pendente", variant: "secondary" as const },
    processing: { label: "Processando", variant: "default" as const },
    success: { label: "Sucesso", variant: "default" as const },
    success_with_warnings: {
      label: "Sucesso com Avisos",
      variant: "secondary" as const,
    },
    failed: { label: "Falhou", variant: "destructive" as const },
  }[status];

  return (
    <Badge
      variant={config.variant}
      className={
        status === "success"
          ? "bg-green-100 text-green-800 hover:bg-green-100"
          : status === "success_with_warnings"
            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            : ""
      }
    >
      {config.label}
    </Badge>
  );
}
