import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { usePermissions } from "@/hooks/usePermissions";
import { getPipelineQueue } from "@/services/message-queue/getPipelineQueue";
import { getQueueMessages } from "@/services/message-queue/getQueueMessages";
import { QueueHeader } from "@/components/message-queue/QueueHeader";
import { QueueSettingsDialog } from "@/components/message-queue/QueueSettingsDialog";
import { SmartPagination } from "@/components/common/SmartPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageQueueWithPipeline,
  QueuedMessageStatus,
} from "@/types/message-queue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isColorDark } from "@/lib/utils";

export default function MessageQueuePage() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { has } = usePermissions();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["pipelineQueue", "queueMessages"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const limit = 10;

  const canUpdatePipeline = has("update:pipeline");
  const canViewPipeline = has("view:pipeline");

  // Fetch queue info
  const queueQuery = useQuery({
    queryKey: ["pipelineQueue", pipelineId],
    queryFn: () => getPipelineQueue(pipelineId!),
    enabled: !!pipelineId && !!workspaceId && canViewPipeline,
  });

  // Fetch queue messages
  const messagesQuery = useQuery({
    queryKey: ["queueMessages", queueQuery.data?.queue.id, currentPage],
    queryFn: () =>
      getQueueMessages(queueQuery.data!.queue.id, {
        page: currentPage + 1, // API uses 1-indexed pages
        limit,
      }),
    enabled: !!queueQuery.data?.queue.id && canViewPipeline,
    placeholderData: (previousData) => previousData,
  });

  const isLoading =
    isChangingWorkspace || queueQuery.isLoading || messagesQuery.isLoading;
  const error = queueQuery.error || messagesQuery.error;

  if (!canViewPipeline) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Você não tem permissão para visualizar filas de mensagens.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/deals")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Negócios
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar fila de mensagens. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!queueQuery.data) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/deals")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Negócios
        </Button>
        <Alert>
          <AlertDescription>Fila de mensagens não encontrada.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Merge queue data with pipeline and totalMessages for component usage
  const queueData: MessageQueueWithPipeline = {
    ...queueQuery.data.queue,
    pipeline: queueQuery.data.pipeline,
    totalMessages: queueQuery.data.totalMessages,
  };

  const messages = messagesQuery.data?.items || [];
  const totalPages = messagesQuery.data
    ? Math.ceil(messagesQuery.data.total / limit)
    : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/deals/pipeline/${pipelineId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Pipeline
      </Button>

      <QueueHeader
        queue={queueData}
        pipelineId={pipelineId!}
        onOpenSettings={() => setSettingsOpen(true)}
        canUpdate={canUpdatePipeline}
      />

      <div>
        <h2 className="text-xl font-semibold mb-4">Mensagens na Fila</h2>

        {messages.length === 0 ? (
          <Alert>
            <AlertDescription>Não há mensagens nesta fila.</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Envio agendado</TableHead>
                    <TableHead className="text-center">Tentativas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => {
                    const normalizedStatus =
                      message.status.toUpperCase() as QueuedMessageStatus;
                    const statusConfig = {
                      [QueuedMessageStatus.PENDING]: {
                        label: "Pendente",
                        bgColor: "#fef3c7",
                        textColor: "#92400e",
                      },
                      [QueuedMessageStatus.SENT]: {
                        label: "Enviada",
                        bgColor: "#d1fae5",
                        textColor: "#065f46",
                      },
                      [QueuedMessageStatus.FAILED]: {
                        label: "Falhou",
                        bgColor: "#fee2e2",
                        textColor: "#991b1b",
                      },
                      [QueuedMessageStatus.SCHEDULED]: {
                        label: "Agendada",
                        bgColor: "#e0e7ff",
                        textColor: "#3730a3",
                      },
                    };

                    const status = statusConfig[normalizedStatus] || {
                      label: message.status,
                      bgColor: "#f3f4f6",
                      textColor: "#374151",
                    };

                    return (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div className="font-medium">
                            {message.customer.name || "Sem nome"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {message.customer.phone}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="line-clamp-2 text-sm">
                            {message.content}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {message.deal?.title || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: status.bgColor,
                              color: isColorDark(status.bgColor)
                                ? "white"
                                : status.textColor,
                            }}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(
                            new Date(message.createdAt),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {message.sendAt
                            ? format(
                                new Date(message.sendAt),
                                "dd/MM/yyyy 'às' HH:mm",
                                { locale: ptBR }
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {message.attemptNumber || 1}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showItemCount
                  itemsPerPage={limit}
                  totalItems={messagesQuery.data?.total || 0}
                  itemLabel="mensagens"
                />
              </div>
            )}
          </>
        )}
      </div>

      {canUpdatePipeline && (
        <QueueSettingsDialog
          queue={queueData}
          pipelineId={pipelineId!}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </div>
  );
}
