import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Trash2, Tag as TagIcon } from "lucide-react";

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
import { Input } from "@/components/ui/input";

import { Conversation } from "@/types/conversation";
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { listMessages } from "@/services/conversation/listMessages";
import { sendMessage } from "@/services/conversation/sendMessage";
import { clearConversationExternalId } from "@/services/conversation/clearConversationExternalId";
import { Message, MessageEvent, SendMessageParams } from "@/types/message";
import { connectSocket, getSocket } from "@/lib/socket";
import { ChatTagManager } from "@/components/tags/ChatTagManager";
import { Tag } from "@/types/tag";

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
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showTagsSection, setShowTagsSection] = useState(false);

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

  const clearExternalIdMutation = useMutation({
    mutationFn: () => clearConversationExternalId(conversation.id),
    onSuccess: () => {
      toast({
        title: "Registro limpo com sucesso",
        description: "O registro externo desta conversa foi limpo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao limpar registro",
        description: "Não foi possível limpar o registro externo. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsClearing(false);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (params: SendMessageParams) => sendMessage(params),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Scroll to bottom after sending
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSending(false);
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
    const token = localStorage.getItem("token");
    const socket = connectSocket(token);

    socket.on("connect", () => {
      console.log("Conectado ao socket");
      const room = `chat:${conversation.id}`;
      socket.emit("join", { room });
    });


    return () => {
      if (socket) {
        socket.off("message");
      }
    };
  }, [conversation.id]);

  useEffect(() => {
    if (listMessagesData) {
      if (currentPage === 1) {
        setUniqueMessages(listMessagesData.items);
      } else {
        setUniqueMessages(listMessagesData.items);
      }

      // Verifica se há mais páginas para carregar
      setHasMore(currentPage < listMessagesData.totalPages);
    }
  }, [listMessagesData, currentPage]);

  const setUniqueMessages = (messages: Message[]) => {
    setMessages((prevMessages) => {
      const newUniqueMessages = messages.filter(
        (msg) => !prevMessages.some((existingMsg) => existingMsg.id === msg.id)
      );
      return [...newUniqueMessages, ...prevMessages];
    });
  };

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

  useEffect(() => {
    scrollToBottomIfNearEnd();
    console.log("messages", messages);
  }, [messages]);

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

  const formatWhatsAppMessage = (text: string) => {
    // Substitui quebras de linha por <br />
    let formattedText = text.replace(/\n/g, "<br />");

    // Processa negrito (*texto*)
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<strong>$1</strong>");

    // Processa itálico (_texto_)
    formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

    // Processa tachado (~texto~)
    formattedText = formattedText.replace(/~(.*?)~/g, "<del>$1</del>");

    return formattedText;
  };

  const scrollToBottomIfNearEnd = () => {
    const chat = scrollAreaRef.current;
    if (!chat) return;

    const threshold = 600; // distância máxima do final para considerar "no fim"
    const isNearBottom =
      chat.scrollHeight - chat.scrollTop - chat.clientHeight < threshold;

    if (isNearBottom) {
      chat.scrollTop = chat.scrollHeight; // rola para o final
    }
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
              ? "bg-yellow-100 border  text-yellow-900"
              : "bg-muted"
          }`}
        >
          <div className="text-sm font-medium">
            {isCustomer
              ? "Cliente"
              : message.sender === "human_assistant"
              ? "Atendente"
              : "Agente IA"}
            <span className="text-xs font-normal ml-2 opacity-75">
              {formatDate(message.createdAt)}
            </span>
          </div>
          <p
            className="mt-1 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: formatWhatsAppMessage(message.content),
            }}
          />
        </div>
      </div>
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    sendMessageMutation.mutate({
      agentId: localConversation.agent.id,
      chatId: localConversation.id,
      message: newMessage,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearExternalId = () => {
    setIsClearing(true);
    clearExternalIdMutation.mutate();
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
        {showTagsSection && (
          <div className="mb-4 p-4 border rounded-md">
            <ChatTagManager
              chatId={localConversation.id}
              chatTags={localConversation.tags || []}
              onTagsChange={(tags) => {
                setLocalConversation(prev => ({
                  ...prev,
                  tags
                }));
                updateConversation({
                  ...localConversation,
                  tags
                });
              }}
            />
          </div>
        )}

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

        {localConversation.handledBy === "human" && !showConfirmation && (
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              isLoading={isSending}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensagem</span>
            </Button>
          </div>
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowTagsSection(!showTagsSection)}
              className="flex gap-2"
            >
              <TagIcon className="h-4 w-4" />
              {showTagsSection ? "Ocultar tags" : "Gerenciar tags"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearExternalId} 
              disabled={isClearing}
              isLoading={isClearing}
              className="flex gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar registro
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
