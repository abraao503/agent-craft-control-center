import React from "react";
import {
  DollarSign,
  Calendar,
  Archive,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DealViewModal } from "@/components/deals/DealViewModal";
import { CustomerDealApiResponse } from "@/services/deal/getCustomerDeals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface DealHistoryListProps {
  deals: CustomerDealApiResponse[];
  onArchive: (dealId: string) => void;
  isArchiving?: boolean;
  canArchive?: boolean;
  workspaceId?: string;
  customerId?: string;
}

const DealHistoryListComponent: React.FC<DealHistoryListProps> = ({
  deals,
  onArchive,
  isArchiving = false,
  canArchive = true,
  workspaceId,
  customerId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dealToArchive, setDealToArchive] = React.useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] =
    React.useState<CustomerDealApiResponse | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "WON":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "LOST":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Em andamento";
      case "WON":
        return "Ganho";
      case "LOST":
        return "Perdido";
      default:
        return status;
    }
  };

  const handleArchiveConfirm = () => {
    if (dealToArchive) {
      onArchive(dealToArchive);
      setDealToArchive(null);
    }
  };

  const handleViewDeal = (deal: CustomerDealApiResponse) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Invalidate queries to refresh the deals list
      if (customerId && workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ["getCustomerDeals", customerId, workspaceId],
        });
      }
    }
  };

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Nenhum outro deal encontrado
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold truncate">
                    {deal.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  {deal.pipeline?.name || "Pipeline"}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDeal(deal)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  {canArchive && (
                    <DropdownMenuItem
                      onClick={() => setDealToArchive(deal.id)}
                      className="text-red-600"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {deal.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {deal.description}
              </p>
            )}

            {/* Stage */}
            {deal.currentStage && (
              <div className="text-xs text-muted-foreground mb-2">
                Estágio: {deal.currentStage.name}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Value */}
              {deal.value !== null && deal.value !== undefined && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-600">
                    {formatCurrency(deal.value)}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(deal.createdAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </div>
            </div>

            {/* Assigned To */}
            {deal.assignedUser && (
              <div className="mt-2 text-xs text-muted-foreground">
                Responsável: {deal.assignedUser.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {workspaceId && selectedDeal && (
        <DealViewModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          deal={{
            id: selectedDeal.id,
            stageId: selectedDeal.stageId,
            title: selectedDeal.title,
            description: selectedDeal.description,
            value: selectedDeal.value,
            createdAt: selectedDeal.createdAt,
            updatedAt: selectedDeal.updatedAt,
            assignedUser: selectedDeal.assignedUser,
          }}
          workspaceId={workspaceId}
          pipelineId={selectedDeal.pipeline.id}
        />
      )}

      <AlertDialog
        open={dealToArchive !== null}
        onOpenChange={(open) => !open && setDealToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar negócio?</AlertDialogTitle>
            <AlertDialogDescription>
              O negócio será arquivado e não aparecerá mais nas listagens
              normais. Você poderá visualizá-lo na lista de negócios arquivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
            >
              {isArchiving ? "Arquivando..." : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const DealHistoryList = React.memo(DealHistoryListComponent);
