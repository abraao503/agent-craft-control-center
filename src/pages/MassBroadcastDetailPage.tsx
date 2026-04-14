import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { TemplateTextDisplay } from "@/components/message-template";
import { formatPhone } from "@/utils/phone";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Megaphone,
  Loader2,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  getMassBroadcast,
  listMassBroadcastRecipients,
  startMassBroadcast,
  pauseMassBroadcast,
  cancelMassBroadcast,
  retryFailedRecipients,
  deleteMassBroadcast,
} from "@/services/mass-broadcast";
import {
  MassBroadcastStatus,
  MassBroadcastRecipientStatus,
} from "@/types/mass-broadcast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const RECIPIENT_STATUS_LABELS: Record<MassBroadcastRecipientStatus, string> = {
  PENDING: "Pendente",
  QUEUED: "Na fila",
  SENT: "Enviado",
  FAILED: "Falhou",
  SKIPPED: "Ignorado",
};

const RECIPIENT_STATUS_COLORS: Record<MassBroadcastRecipientStatus, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  QUEUED: "bg-blue-100 text-blue-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-yellow-100 text-yellow-800",
};

const ITEMS_PER_PAGE = 10;

export default function MassBroadcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientStatusFilter, setRecipientStatusFilter] =
    useState<string>("ALL");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Fetch broadcast details
  const {
    data: broadcast,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mass-broadcast", id],
    queryFn: () => getMassBroadcast(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh when sending
      const status = query.state.data?.status;
      if (status === "SENDING" || status === "PROCESSING") {
        return 5000;
      }
      return false;
    },
  });

  // Fetch recipients
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: [
      "mass-broadcast-recipients",
      id,
      recipientsPage,
      recipientStatusFilter,
    ],
    queryFn: () =>
      listMassBroadcastRecipients(id!, {
        page: recipientsPage,
        limit: ITEMS_PER_PAGE,
        status:
          recipientStatusFilter !== "ALL"
            ? (recipientStatusFilter as MassBroadcastRecipientStatus)
            : undefined,
      }),
    enabled: !!id,
    refetchInterval: (query) => {
      if (
        broadcast?.status === "SENDING" ||
        broadcast?.status === "PROCESSING"
      ) {
        return 5000;
      }
      return false;
    },
  });

  // Actions mutations
  const startMutation = useMutation({
    mutationFn: () => startMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: "Campanha iniciada",
        description: "O envio das mensagens foi iniciado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar campanha",
        description: error?.message || "Não foi possível iniciar a campanha.",
        variant: "destructive",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: "Campanha pausada",
        description: "O envio foi pausado. Pode ser retomado depois.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao pausar campanha",
        description: error?.message || "Não foi possível pausar a campanha.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelMassBroadcast(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      setIsCancelDialogOpen(false);
      toast({
        title: "Campanha cancelada",
        description: "A campanha foi cancelada permanentemente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar campanha",
        description: error?.message || "Não foi possível cancelar a campanha.",
        variant: "destructive",
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryFailedRecipients(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mass-broadcast", id] });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcast-recipients", id],
      });
      toast({
        title: "Reprocessamento iniciado",
        description: `${data.retriedCount} destinatário(s) serão reprocessados.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reprocessar",
        description:
          error?.message || "Não foi possível reprocessar os falhados.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMassBroadcast(id!),
    onSuccess: () => {
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
      navigate("/broadcasts");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir a campanha.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getProgressPercent = () => {
    if (!broadcast || broadcast.totalRecipients === 0) return 0;
    return Math.round(
      ((broadcast.sentCount + broadcast.failedCount) /
        broadcast.totalRecipients) *
        100,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !broadcast) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/broadcasts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Campanha não encontrada</h1>
        </div>
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            Não foi possível carregar os detalhes da campanha.
          </p>
        </div>
      </div>
    );
  }

  const progress = getProgressPercent();
  const canStart = ["DRAFT", "READY", "PAUSED"].includes(broadcast.status);
  const canPause = broadcast.status === "SENDING";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(broadcast.status);
  const canRetry =
    broadcast.recipientsSummary.failed > 0 &&
    !["SENDING", "CANCELLED"].includes(broadcast.status);
  const canDelete = broadcast.status !== "SENDING";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/broadcasts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{broadcast.name}</h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[broadcast.status]}
              >
                {STATUS_LABELS[broadcast.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criada em {formatDate(broadcast.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {broadcast.status === "PAUSED" ? "Retomar" : "Iniciar"}
            </Button>
          )}
          {canPause && (
            <Button
              variant="outline"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
            >
              {pauseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pausar
            </Button>
          )}
          {canRetry && (
            <Button
              variant="outline"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Retentar Falhas
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Progress + Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{broadcast.totalRecipients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Enviados</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {broadcast.recipientsSummary.sent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Falhas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {broadcast.recipientsSummary.failed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {broadcast.recipientsSummary.pending +
                broadcast.recipientsSummary.queued}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {(broadcast.status === "SENDING" ||
        broadcast.status === "PAUSED" ||
        broadcast.status === "COMPLETED") && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progresso do envio</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Details & Recipients */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="recipients">
            Destinatários ({broadcast.totalRecipients})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Informações da Campanha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{broadcast.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[broadcast.status]}
                    >
                      {STATUS_LABELS[broadcast.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Intervalo entre mensagens
                  </Label>
                  <p className="font-medium">
                    {broadcast.messageDelaySeconds}s
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Variações de mensagem
                  </Label>
                  <p className="font-medium">
                    {broadcast.messageVariations.length}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Mensagens</Label>
                <div className="space-y-2 mt-2">
                  {broadcast.messageVariations.map((msg, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-md p-3 text-sm"
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        Variação {index + 1}:
                      </span>
                      <p className="mt-1 whitespace-pre-wrap">
                        <TemplateTextDisplay text={msg} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    Janela de envio (início)
                  </Label>
                  <p className="font-medium">
                    {formatDate(broadcast.startTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Janela de envio (fim)
                  </Label>
                  <p className="font-medium">{formatDate(broadcast.endTime)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Iniciada em</Label>
                  <p className="font-medium">
                    {formatDate(broadcast.startedAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Concluída em</Label>
                  <p className="font-medium">
                    {formatDate(broadcast.completedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumo de Destinatários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {(
                  Object.entries(broadcast.recipientsSummary) as [
                    string,
                    number,
                  ][]
                )
                  .filter(([key]) => key !== "total")
                  .map(([key, value]) => (
                    <div key={key} className="text-center">
                      <Badge
                        variant="secondary"
                        className={
                          RECIPIENT_STATUS_COLORS[
                            key.toUpperCase() as MassBroadcastRecipientStatus
                          ] || ""
                        }
                      >
                        {RECIPIENT_STATUS_LABELS[
                          key.toUpperCase() as MassBroadcastRecipientStatus
                        ] || key}
                      </Badge>
                      <p className="text-xl font-bold mt-1">{value}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Destinatários</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select
                    value={recipientStatusFilter}
                    onValueChange={(value) => {
                      setRecipientStatusFilter(value);
                      setRecipientsPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="QUEUED">Na fila</SelectItem>
                      <SelectItem value="SENT">Enviado</SelectItem>
                      <SelectItem value="FAILED">Falhou</SelectItem>
                      <SelectItem value="SKIPPED">Ignorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecipients ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recipientsData && recipientsData.items.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente ID</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipientsData.items.map((recipient) => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-mono text-xs">
                            {recipient.customerId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatPhone(recipient.customerPhone)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                RECIPIENT_STATUS_COLORS[recipient.status]
                              }
                            >
                              {RECIPIENT_STATUS_LABELS[recipient.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">
                            {recipient.messageContent}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(recipient.sentAt)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs text-red-600">
                            {recipient.errorMessage || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {recipientsData.totalPages > 1 && (
                    <div className="mt-4">
                      <SmartPagination
                        currentPage={recipientsPage}
                        totalPages={recipientsData.totalPages}
                        onPageChange={setRecipientsPage}
                        showItemCount
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={recipientsData.total}
                        itemLabel="destinatários"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum destinatário encontrado
                    {recipientStatusFilter !== "ALL" &&
                      " com o filtro selecionado"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a campanha "{broadcast.name}"?
              Esta ação é permanente e a campanha não poderá ser retomada.
              Mensagens já enviadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancelar Campanha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha "{broadcast.name}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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
