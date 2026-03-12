import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";
import { listFollowUpOccurrences } from "@/services/deal/dealFollowUp";
import { DealFollowUpStatus, FollowUpOccurrence } from "@/types/deal-follow-up";

interface OccurrencesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUpId: string;
  followUpTitle: string;
}

export const OccurrencesHistoryDialog: React.FC<
  OccurrencesHistoryDialogProps
> = ({ open, onOpenChange, followUpId, followUpTitle }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["followUpOccurrences", followUpId, currentPage],
    queryFn: () =>
      listFollowUpOccurrences(followUpId, {
        page: currentPage + 1,
        limit,
      }),
    enabled: open && !!followUpId,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const getStatusBadge = (status: DealFollowUpStatus) => {
    const statusConfig = {
      PENDING: {
        label: "Pendente",
        variant: "secondary" as const,
        icon: Clock,
      },
      SENT: {
        label: "Enviado",
        variant: "default" as const,
        icon: CheckCircle,
      },
      FAILED: {
        label: "Falhou",
        variant: "destructive" as const,
        icon: XCircle,
      },
      CANCELLED: {
        label: "Cancelado",
        variant: "outline" as const,
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const renderOccurrence = (occurrence: FollowUpOccurrence) => (
    <div
      key={occurrence.id}
      className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Agendado: {formatDateTime(occurrence.scheduledAt)}</span>
        </div>
        {getStatusBadge(occurrence.status)}
      </div>

      {occurrence.sentAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Enviado em: {formatDateTime(occurrence.sentAt)}</span>
        </div>
      )}

      {occurrence.lastAttemptAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Última tentativa: {formatDateTime(occurrence.lastAttemptAt)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Tentativas: {occurrence.attempts}/{occurrence.maxAttempts}
        </span>
      </div>

      {occurrence.error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded p-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{occurrence.error}</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5" />
            Histórico de Envios - {followUpTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-180px)] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Erro ao carregar histórico de envios.</p>
              <p className="text-sm mt-2">Tente novamente mais tarde.</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="space-y-3">{data.items.map(renderOccurrence)}</div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum envio realizado ainda.</p>
              <p className="text-sm mt-2">
                O histórico aparecerá aqui após o primeiro envio.
              </p>
            </div>
          )}
        </ScrollArea>

        {totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showItemCount
            itemsPerPage={limit}
            totalItems={data?.total || 0}
            itemLabel="envios"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
