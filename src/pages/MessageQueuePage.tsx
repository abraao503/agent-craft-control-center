import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MessageQueueTable } from "@/components/follow-up/MessageQueueTable";
import { QueuedMessagesTable } from "@/components/follow-up/QueuedMessagesTable";
import { MessageQueue, QueuedMessage } from "@/types/follow-up";
import { listMessageQueues, listQueuedMessages } from "@/services/follow-up";

export default function MessageQueuePage() {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedQueue, setSelectedQueue] = useState<MessageQueue | null>(null);
  const [queuedMessagesPage, setQueuedMessagesPage] = useState(1);

  // Query message queues
  const {
    data: messageQueuesData,
    isLoading: isLoadingQueues,
    error: queuesError,
  } = useQuery({
    queryKey: ["messageQueues", workspaceId, page, limit],
    queryFn: () => listMessageQueues({ workspaceId, page, limit }),
    enabled: !!workspaceId,
  });

  // Query queued messages for selected queue
  const {
    data: queuedMessagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["queuedMessages", selectedQueue?.id, queuedMessagesPage, limit],
    queryFn: () =>
      listQueuedMessages({
        messageQueueId: selectedQueue?.id || "",
        page: queuedMessagesPage,
        limit,
      }),
    enabled: !!selectedQueue?.id,
  });

  const handleViewQueueDetails = (queue: MessageQueue) => {
    setSelectedQueue(queue);
    setQueuedMessagesPage(1);
  };

  const handleBackToQueues = () => {
    setSelectedQueue(null);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedQueue) {
      setQueuedMessagesPage(newPage);
    } else {
      setPage(newPage);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para visualizar as filas de mensagens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedQueue ? (
        <>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToQueues}
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Detalhes da Fila</h1>
          </div>

          <div className="bg-muted/50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID da Fila
                </p>
                <p>{selectedQueue.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Workspace
                </p>
                <p>{selectedQueue.workspaceId}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-6">Mensagens Enfileiradas</h2>

          {isLoadingMessages ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : messagesError ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <p className="text-red-800">
                Erro ao carregar mensagens. Tente novamente mais tarde.
              </p>
            </div>
          ) : (
            <>
              <QueuedMessagesTable messages={queuedMessagesData?.items || []} />

              {queuedMessagesData?.totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          handlePageChange(Math.max(1, queuedMessagesPage - 1))
                        }
                        className={
                          queuedMessagesPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: queuedMessagesData.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === queuedMessagesData.totalPages ||
                          Math.abs(p - queuedMessagesPage) <= 1
                      )
                      .map((p, i, arr) => {
                        // Adicionar elipses quando necessário
                        if (i > 0 && arr[i - 1] !== p - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${p}`}>
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                              <PaginationItem key={p}>
                                <PaginationLink
                                  isActive={p === queuedMessagesPage}
                                  onClick={() => handlePageChange(p)}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </React.Fragment>
                          );
                        }
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === queuedMessagesPage}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(
                              queuedMessagesData.totalPages,
                              queuedMessagesPage + 1
                            )
                          )
                        }
                        className={
                          queuedMessagesPage === queuedMessagesData.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Filas de Mensagens</h1>

          {isLoadingQueues ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">
                Carregando filas de mensagens...
              </p>
            </div>
          ) : queuesError ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <p className="text-red-800">
                Erro ao carregar filas de mensagens. Tente novamente mais tarde.
              </p>
            </div>
          ) : (
            <>
              <MessageQueueTable
                messageQueues={messageQueuesData?.data?.items || []}
                onViewDetails={handleViewQueueDetails}
              />

              {messageQueuesData?.data?.totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        className={
                          page === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: messageQueuesData.data.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === messageQueuesData.data.totalPages ||
                          Math.abs(p - page) <= 1
                      )
                      .map((p, i, arr) => {
                        // Adicionar elipses quando necessário
                        if (i > 0 && arr[i - 1] !== p - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${p}`}>
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                              <PaginationItem key={p}>
                                <PaginationLink
                                  isActive={p === page}
                                  onClick={() => handlePageChange(p)}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </React.Fragment>
                          );
                        }
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(
                              messageQueuesData.data.totalPages,
                              page + 1
                            )
                          )
                        }
                        className={
                          page === messageQueuesData.data.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
