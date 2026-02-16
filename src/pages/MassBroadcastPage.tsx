import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Megaphone,
  Trash2,
  Eye,
  Play,
  Pause,
  XCircle,
  Loader2,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  listMassBroadcasts,
  deleteMassBroadcast,
} from "@/services/mass-broadcast";
import { MassBroadcast, MassBroadcastStatus } from "@/types/mass-broadcast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ITEMS_PER_PAGE = 9;

const STATUS_LABELS: Record<MassBroadcastStatus, string> = {
  DRAFT: "Rascunho",
  PROCESSING: "Processando",
  READY: "Pronta",
  SENDING: "Enviando",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  FAILED: "Falhou",
};

const STATUS_COLORS: Record<MassBroadcastStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  SENDING: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function MassBroadcastPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] =
    useState<MassBroadcast | null>(null);

  const {
    data: broadcastsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mass-broadcasts", workspaceId, currentPage, statusFilter],
    queryFn: () =>
      listMassBroadcasts({
        workspaceId,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status:
          statusFilter !== "ALL"
            ? (statusFilter as MassBroadcastStatus)
            : undefined,
      }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMassBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcasts", workspaceId],
      });
      setIsDeleteDialogOpen(false);
      setSelectedBroadcast(null);
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir campanha",
        description: "Ocorreu um erro ao excluir a campanha. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, broadcast: MassBroadcast) => {
    e.stopPropagation();
    setSelectedBroadcast(broadcast);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBroadcast) {
      deleteMutation.mutate(selectedBroadcast.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getProgressPercent = (broadcast: MassBroadcast) => {
    if (broadcast.totalRecipients === 0) return 0;
    return Math.round(
      ((broadcast.sentCount + broadcast.failedCount) /
        broadcast.totalRecipients) *
        100,
    );
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para visualizar os disparos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disparos em Massa</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie campanhas de envio de mensagens via WhatsApp
          </p>
        </div>
        <Button onClick={() => navigate("/broadcasts/create")}>
          <Plus className="mr-2 h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="READY">Pronta</SelectItem>
              <SelectItem value="SENDING">Enviando</SelectItem>
              <SelectItem value="PAUSED">Pausada</SelectItem>
              <SelectItem value="COMPLETED">Concluída</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
              <SelectItem value="FAILED">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full ml-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            Erro ao carregar campanhas. Tente novamente mais tarde.
          </p>
        </div>
      ) : broadcastsData && broadcastsData.items.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {broadcastsData.items.map((broadcast) => {
              const progress = getProgressPercent(broadcast);

              return (
                <Card
                  key={broadcast.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/broadcasts/${broadcast.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {broadcast.name}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[broadcast.status]}
                      >
                        {STATUS_LABELS[broadcast.status]}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm mt-2">
                      {broadcast.messageVariations.length} variação(ões) de
                      mensagem • {broadcast.totalRecipients} destinatário(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Progress bar */}
                    {broadcast.status === "SENDING" ||
                    broadcast.status === "PAUSED" ||
                    broadcast.status === "COMPLETED" ? (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>
                            {broadcast.sentCount} enviado(s)
                            {broadcast.failedCount > 0 && (
                              <span className="text-red-600">
                                {" "}
                                • {broadcast.failedCount} falha(s)
                              </span>
                            )}
                          </span>
                          <span>de {broadcast.totalRecipients}</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Criado em: {formatDate(broadcast.createdAt)}</p>
                      {broadcast.startedAt && (
                        <p>Iniciado em: {formatDate(broadcast.startedAt)}</p>
                      )}
                      {broadcast.completedAt && (
                        <p>Concluído em: {formatDate(broadcast.completedAt)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/broadcasts/${broadcast.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                      {broadcast.status !== "SENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, broadcast)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {broadcastsData.totalPages > 1 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={broadcastsData.totalPages}
              onPageChange={handlePageChange}
              showItemCount
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={broadcastsData.total}
              itemLabel="campanhas"
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie uma campanha para enviar mensagens em massa via WhatsApp para
              seus clientes.
            </p>
            <Button onClick={() => navigate("/broadcasts/create")}>
              <Plus className="mr-2 h-4 w-4" /> Criar primeira campanha
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha "
              {selectedBroadcast?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
