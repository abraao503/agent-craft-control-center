import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueuedMessage, QueuedMessageStatus } from "@/types/message-queue";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatPhone } from "@/utils/phone";

interface QueuedMessageCardProps {
  message: QueuedMessage;
}

const statusConfig = {
  [QueuedMessageStatus.PENDING]: {
    label: "Pendente",
    variant: "secondary" as const,
    icon: Clock,
  },
  [QueuedMessageStatus.SENT]: {
    label: "Enviada",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [QueuedMessageStatus.FAILED]: {
    label: "Falhou",
    variant: "destructive" as const,
    icon: XCircle,
  },
  [QueuedMessageStatus.SCHEDULED]: {
    label: "Agendada",
    variant: "outline" as const,
    icon: AlertCircle,
  },
};

export function QueuedMessageCard({ message }: QueuedMessageCardProps) {
  // Normalize status to uppercase to match enum
  const normalizedStatus = message.status.toUpperCase() as QueuedMessageStatus;
  const status = statusConfig[normalizedStatus];

  // Fallback if status is not recognized
  if (!status) {
    console.warn(`Unknown message status: ${message.status}`);
    return null;
  }

  const StatusIcon = status.icon;

  const formatDate = (date: string | Date | null) => {
    if (!date) return null;
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {message.customer.name || formatPhone(message.customer.phone)}
            </CardTitle>
            {message.customer.name && (
              <p className="text-sm text-muted-foreground">
                {formatPhone(message.customer.phone)}
              </p>
            )}
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Mensagem:</p>
          <p className="text-sm line-clamp-3">{message.content}</p>
        </div>

        {message.deal && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Negócio:</p>
            <p className="text-sm font-medium">{message.deal.title}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Criada {formatDate(message.createdAt)}</span>
          {message.sendAt && <span>Envio em {formatDate(message.sendAt)}</span>}
          {message.attemptNumber && message.attemptNumber > 1 && (
            <span>Tentativa {message.attemptNumber}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
