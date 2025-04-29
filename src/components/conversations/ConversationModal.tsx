import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MessageSkeleton } from "./MessageSkeleton";

import { Conversation } from "@/types/conversation";
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { listMessages } from "@/services/conversation/listMessages";
import { Message } from "@/types/message";

type ConversationModalProps = {
  conversation: Conversation;
  updateConversation: (conversation: Conversation) => void;
  onClose: () => void;
  isOpen: boolean;
};

export const ConversationModal: React.FC<ConversationModalProps> = ({
  conversation,
  updateConversation,
  onClose,
  isOpen,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [localConversation, setLocalConversation] = useState(conversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [alreadyScrolled, setAlreadyScrolled] = useState(false);
  const lastScrollTop = useRef(0);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      id,
      handledBy,
    }: {
      id: string;
      handledBy: "ai" | "human";
    }) => updateConversationHandler(id, handledBy),
    onSuccess: (handledBy) => {
      setShowConfirmation(false);

      const newConversation = {
        ...localConversation,
        handledBy: (handledBy === "ai" ? "ai" : "human") as "ai" | "human",
      };

      setLocalConversation(newConversation);

      updateConversation(newConversation);

      toast({
        title: "Atendimento alterado com sucesso",
        description: `A conversa agora está sendo atendida por ${
          handledBy === "ai" ? "IA" : "humano"
        }.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar o atendimento",
        description:
          "Não foi possível alterar o tipo de atendimento. Tente novamente.",
        variant: "destructive",
      });
      setShowConfirmation(false);
    },
  });

  const listMessageFilters = {
    chatId: conversation.id,
    page: currentPage,
  };

  const {
    data: listMessagesData,
    isFetching: listMessagesIsFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["listMessages", listMessageFilters],
    queryFn: () => listMessages(listMessageFilters),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (listMessagesData) {
      if (currentPage === 1) {
        setMessages(listMessagesData.items);
      } else {
        setMessages((prev) => [...listMessagesData.items, ...prev]);
      }

      // Verifica se há mais páginas para carregar
      setHasMore(currentPage < listMessagesData.totalPages);
    }
  }, [listMessagesData, currentPage]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;

    if (listMessagesIsFetching || !hasMore) return;

    const currentScrollTop = target.scrollTop;

    // Scroll para cima → carrega mais
    if (currentScrollTop < lastScrollTop.current && currentScrollTop <= 140) {
      setCurrentPage((prev) => prev + 1);
    }

    // Atualiza o último scrollTop
    lastScrollTop.current = currentScrollTop;
  };

  // Scroll to bottom when modal opens
  useEffect(() => {
    if (
      !isOpen ||
      alreadyScrolled ||
      !messages.length ||
      !scrollAreaRef.current ||
      listMessagesIsFetching
    )
      return;

    const scrollToBottom = () => {
      const el = scrollAreaRef.current;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    scrollToBottom();
    setAlreadyScrolled(true);
  }, [isOpen, messages.length, listMessagesIsFetching, alreadyScrolled]);

  const handleClose = () => {
    onClose();
  };

  const handleHandlerToggle = () => {
    setShowConfirmation(true);
  };

  const confirmHandlerChange = () => {
    const newHandler = localConversation.handledBy === "ai" ? "human" : "ai";
    mutate({ id: localConversation.id, handledBy: newHandler });
  };

  const cancelHandlerChange = () => {
    setShowConfirmation(false);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const renderMessage = (message: Message) => {
    const isCustomer = message.sender === "customer";

    return (
      <div
        key={message.id}
        className={`flex mb-4 ${isCustomer ? "justify-start" : "justify-end"}`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isCustomer
              ? "bg-primary text-primary-foreground"
              : message.sender === "human_assistant"
              ? "bg-yellow-100 border border-yellow-300 text-yellow-800"
              : "bg-muted"
          }`}
        >
          <div className="text-sm font-medium">
            {isCustomer
              ? "Cliente"
              : message.sender === "human_assistant"
              ? "Atendente Humano"
              : "Agente IA"}
            <span className="text-xs font-normal ml-2 opacity-75">
              {formatDate(message.createdAt)}
            </span>
          </div>
          <p className="mt-1">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl h-[80vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            Conversa com {localConversation.customer.phone}
          </DialogTitle>
          <DialogDescription>
            Agente: {localConversation.agent.name} | Última interação:{" "}
            {/* {formatDate(localConversation.lastInteractionAt)} */}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 px-2 py-4 my-4 border rounded-md"
          onScroll={handleScroll}
        >
          {listMessagesIsFetching && currentPage > 1 && (
            <div className="py-4">
              <div className="space-y-4">
                <MessageSkeleton isCustomer={true} />
                <MessageSkeleton isCustomer={false} />
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {listMessagesIsFetching && currentPage === 1 && (
            <div className="space-y-4">
              <MessageSkeleton isCustomer={true} />
              <MessageSkeleton isCustomer={false} />
              <MessageSkeleton isCustomer={true} />
              <MessageSkeleton isCustomer={false} />
            </div>
          )}
        </ScrollArea>

        {/* Confirmation alert */}
        {showConfirmation && (
          <Alert className="mb-4">
            <AlertDescription>
              Tem certeza que deseja alterar o tipo de atendimento para
              <strong>
                {localConversation.handledBy === "ai" ? " humano" : " IA"}
              </strong>
              ?
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelHandlerChange}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={confirmHandlerChange}
                  disabled={isPending}
                  isLoading={isPending}
                >
                  Confirmar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <span>Atendimento por IA</span>
            <Switch
              checked={localConversation.handledBy === "ai"}
              onCheckedChange={handleHandlerToggle}
              disabled={isPending || showConfirmation}
            />
            <span>Atendimento humano</span>
          </div>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
