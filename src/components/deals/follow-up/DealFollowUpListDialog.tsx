import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  Pencil,
  Image,
  FileAudio,
  FileText,
  Repeat,
  History,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  listDealFollowUps,
  deleteDealFollowUp,
} from "@/services/deal/dealFollowUp";
import { DealFollowUp } from "@/types/deal-follow-up";
import { CreateDealFollowUpDialog } from "./CreateDealFollowUpDialog";
import { EditDealFollowUpDialog } from "./EditDealFollowUpDialog";
import { OccurrencesHistoryDialog } from "./OccurrencesHistoryDialog";
import { getRecurrenceDescription } from "./followUpUtils";
import { getFollowUpErrorMessage } from "./errorMessages";
import { cn } from "@/lib/utils";
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

interface DealFollowUpListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
}

export const DealFollowUpListDialog: React.FC<DealFollowUpListDialogProps> = ({
  open,
  onOpenChange,
  dealId,
  dealTitle,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [followUpToEdit, setFollowUpToEdit] = useState<DealFollowUp | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<string | null>(null);
  const [showOccurrencesDialog, setShowOccurrencesDialog] = useState(false);
  const [occurrencesFollowUp, setOccurrencesFollowUp] =
    useState<DealFollowUp | null>(null);

  // Fetch follow-ups
  const { data, isLoading } = useQuery({
    queryKey: ["dealFollowUps", dealId],
    queryFn: () => listDealFollowUps(dealId, { page: 1, limit: 100 }),
    enabled: open && !!dealId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDealFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealFollowUps", dealId] });
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso.",
      });
      setDeleteConfirmOpen(false);
      setFollowUpToDelete(null);
    },
    onError: (error: unknown) => {
      let errorMessage = "Falha ao excluir agendamento.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        const apiErrorMessage = axiosError.response?.data?.message;
        if (apiErrorMessage) {
          errorMessage = getFollowUpErrorMessage(apiErrorMessage);
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (followUpId: string) => {
    setFollowUpToDelete(followUpId);
    setDeleteConfirmOpen(true);
  };

  const handleEditClick = (followUp: DealFollowUp) => {
    setFollowUpToEdit(followUp);
    setShowEditDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (followUpToDelete) {
      deleteMutation.mutate(followUpToDelete);
    }
  };

  const handleViewOccurrences = (followUp: DealFollowUp) => {
    setOccurrencesFollowUp(followUp);
    setShowOccurrencesDialog(true);
  };

  /**
   * Verifica se o follow-up pode ser editado.
   * Follow-ups com status FAILED, CANCELLED ou SENT (avulso encerrado) não são editáveis.
   * Recorrentes com status SENT mas com nextScheduledAt (ainda ativos) são editáveis.
   */
  const isEditable = (followUp: DealFollowUp): boolean => {
    if (followUp.status === "CANCELLED" || followUp.status === "FAILED") {
      return false;
    }
    if (followUp.status === "SENT" && !followUp.isRecurring) {
      return false;
    }
    if (
      followUp.status === "SENT" &&
      followUp.isRecurring &&
      !followUp.nextScheduledAt
    ) {
      return false;
    }
    return true;
  };

  const getStatusBadge = (followUp: DealFollowUp) => {
    const { status, isRecurring, nextScheduledAt } = followUp;

    // Significados combinados de status + recorrência
    let label = "";
    let variant: "secondary" | "default" | "destructive" | "outline" =
      "secondary";
    let Icon = Calendar;

    if (status === "CANCELLED") {
      label = "Cancelado";
      variant = "outline";
      Icon = XCircle;
    } else if (status === "FAILED") {
      label = isRecurring ? "Encerrado com falha" : "Falhou";
      variant = "destructive";
      Icon = XCircle;
    } else if (status === "SENT") {
      if (isRecurring && nextScheduledAt) {
        label = "Recorrente ativo";
        variant = "default";
        Icon = CheckCircle;
      } else {
        label = isRecurring ? "Recorrência encerrada" : "Enviado";
        variant = "default";
        Icon = CheckCircle;
      }
    } else if (status === "BLOCKED_CONFIGURATION") {
      label = "Configuração pendente";
      variant = "outline";
      Icon = AlertTriangle;
    } else {
      // PENDING
      label = isRecurring ? "Aguardando 1º envio" : "Pendente";
      variant = "secondary";
      Icon = Calendar;
    }

    return (
      <Badge
        variant={variant}
        className={cn(
          "flex items-center gap-1",
          variant === "secondary" && "text-white",
        )}
      >
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Agendamento de Mensagens - {dealTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!data?.channel}
                title={!data?.channel ? "Carregando o canal do negócio" : undefined}
              >
                Criar Agendamento
              </Button>
            </div>

            <ScrollArea className="h-[calc(80vh-180px)] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      {/* Título + badge */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        {/* Botões */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                      {/* Data */}
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-48" />
                      </div>
                      {/* Badges de mídia/recorrência */}
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data && data.items.length > 0 ? (
                <div className="space-y-3">
                  {data.items.map((followUp) => (
                    <div
                      key={followUp.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{followUp.title}</h4>
                            {getStatusBadge(followUp)}
                            {followUp.configurationState ===
                              "REQUIRES_TEMPLATE" && (
                              <Badge variant="outline" className="text-xs">
                                Template Meta necessário
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {followUp.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditable(followUp) && (
                            <div title="Editar agendamento">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(followUp)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {followUp.isRecurring &&
                            followUp.totalOccurrences > 0 && (
                              <div title="Ver histórico de envios">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleViewOccurrences(followUp)
                                  }
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(followUp.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Dates section */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Agendado: {formatDateTime(followUp.scheduledAt)}
                          </span>
                        </div>
                        {followUp.nextScheduledAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Próximo envio:{" "}
                              {formatDateTime(followUp.nextScheduledAt)}
                            </span>
                          </div>
                        ) : followUp.isRecurring ? (
                          <Badge variant="outline" className="text-xs">
                            Encerrado
                          </Badge>
                        ) : null}
                      </div>

                      {/* Media, Recurrence, and Stats badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {followUp.mediaType && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            {followUp.mediaType === "image" && (
                              <Image className="h-3 w-3" />
                            )}
                            {followUp.mediaType === "audio" && (
                              <FileAudio className="h-3 w-3" />
                            )}
                            {followUp.mediaType === "document" && (
                              <FileText className="h-3 w-3" />
                            )}
                            {followUp.mediaType === "image"
                              ? "Imagem"
                              : followUp.mediaType === "audio"
                                ? "Áudio"
                                : "Documento"}
                          </Badge>
                        )}
                        {followUp.recurrence && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            <Repeat className="h-3 w-3" />
                            {getRecurrenceDescription(followUp.recurrence)}
                          </Badge>
                        )}
                        {followUp.isRecurring && (
                          <>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Enviados: {followUp.totalOccurrences}
                            </Badge>
                            {followUp.failedOccurrences > 0 && (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 text-xs"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Falhas: {followUp.failedOccurrences}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum agendamento criado ainda.</p>
                  <p className="text-sm mt-2">
                    Clique em "Criar Agendamento" para adicionar o primeiro.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <CreateDealFollowUpDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        dealId={dealId}
        dealTitle={dealTitle}
        pipelineId={data?.channel.pipelineId ?? ""}
        isMetaCloud={data?.channel.requiresTemplate ?? false}
      />

      <EditDealFollowUpDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        dealId={dealId}
        followUp={followUpToEdit}
        pipelineId={data?.channel.pipelineId ?? ""}
        isMetaCloud={data?.channel.requiresTemplate ?? false}
      />

      {occurrencesFollowUp && (
        <OccurrencesHistoryDialog
          open={showOccurrencesDialog}
          onOpenChange={setShowOccurrencesDialog}
          followUpId={occurrencesFollowUp.id}
          followUpTitle={occurrencesFollowUp.title}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento de mensagem? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
