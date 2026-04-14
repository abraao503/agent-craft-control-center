import React, { useEffect, useState, useRef, useCallback } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Send,
  MoreVertical,
  Search,
  Phone,
  Video,
  Paperclip,
  Smile,
  Loader2,
  Bot,
  UserCog,
  Tag as TagIcon,
  Info,
  Trash2,
  Clock,
  AlertCircle,
  ArrowRightLeft,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";
import { listMessages } from "@/services/conversation/listMessages";
import { sendMessage } from "@/services/conversation/sendMessage";
import { sendMediaMessage } from "@/services/conversation/sendMediaMessage";
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { clearConversationExternalId } from "@/services/conversation/clearConversationExternalId";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "./ChatSidebar";
import { MessageSentEvent } from "@/types/websocket";
import { MessageContent } from "./media/MessageContent";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { AudioRecorder } from "./AudioRecorder";
import { formatPhone } from "@/utils/phone";

type MessageStatus = "pending" | "sent" | "failed";

type MessageWithStatus = Message & {
  status?: MessageStatus;
  tempId?: string;
};

type ChatWindowProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
  newMessageEvent?: MessageSentEvent | null;
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onUpdateConversation,
  newMessageEvent,
}) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollTop = useRef(0);
  const previousMessagesLength = useRef(0);
  const previousScrollHeight = useRef(0);
  const [messages, setMessages] = useState<MessageWithStatus[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [localConversation, setLocalConversation] = useState(conversation);
  const [alreadyScrolled, setAlreadyScrolled] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<MessageWithStatus[]>([]);
  const isProcessingQueue = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
  } = useQuery({
    queryKey: ["messages", conversation.id, currentPage],
    queryFn: () =>
      listMessages({ chatId: conversation.id, page: currentPage, limit: 50 }),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });

  // Update conversation handler mutation
  const updateHandlerMutation = useMutation({
    mutationFn: ({
      id,
      handledBy,
    }: {
      id: string;
      handledBy: "ai" | "human";
    }) => updateConversationHandler(id, { handledBy }),
    onSuccess: (handledBy) => {
      const newConversation = {
        ...localConversation,
        handledBy: (handledBy === "ai" ? "ai" : "human") as "ai" | "human",
      };

      setLocalConversation(newConversation);
      onUpdateConversation(newConversation);

      toast({
        title: "Atendimento alterado",
        description: `Conversa transferida para ${
          handledBy === "ai" ? "IA" : "humano"
        }`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao alterar atendimento",
        variant: "destructive",
      });
    },
  });

  // Clear conversation external ID mutation
  const clearExternalIdMutation = useMutation({
    mutationFn: () => clearConversationExternalId(conversation.id),
    onSuccess: () => {
      toast({
        title: "Registro limpo com sucesso",
        description: "O registro externo desta conversa foi limpo.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao limpar registro",
        description:
          "Não foi possível limpar o registro externo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Process message queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || pendingQueue.length === 0) return;

    isProcessingQueue.current = true;
    const messageToSend = pendingQueue[0];

    try {
      const sentMessage = await sendMessage({
        chatId: conversation.id,
        message: messageToSend.content,
        agentId: conversation.agent?.id || "",
      });

      // Update message status to sent and replace with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === messageToSend.tempId
            ? { ...sentMessage, status: "sent" }
            : msg,
        ),
      );

      // Remove from queue
      setPendingQueue((prev) => prev.slice(1));
    } catch (error) {
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === messageToSend.tempId
            ? { ...msg, status: "failed" }
            : msg,
        ),
      );

      // Remove from queue
      setPendingQueue((prev) => prev.slice(1));

      toast({
        title: "Erro ao enviar mensagem",
        description: "A mensagem não foi enviada. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      isProcessingQueue.current = false;
    }
  }, [pendingQueue, conversation.id, conversation.agent?.id, toast]);

  // Validate file type and size
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50 MB

    if (file.size > maxSize) {
      return { valid: false, error: "File size exceeds 50 MB limit" };
    }

    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const audioTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "audio/aac",
    ];
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-rar-compressed",
    ];

    const allTypes = [...imageTypes, ...audioTypes, ...documentTypes];
    if (!allTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported" };
    }

    return { valid: true };
  };

  // Get media type from file
  const getMediaTypeFromFile = (file: File): "image" | "audio" | "document" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsMediaPreviewOpen(true);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle send audio
  const handleSendAudio = async (audioBlob: Blob) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const audioFile = new File([audioBlob], `audio-${Date.now()}.ogg`, {
      type: "audio/ogg; codecs=opus",
    });

    const pendingMessage: MessageWithStatus = {
      id: tempId,
      tempId,
      chatId: conversation.id,
      sender: "human_assistant",
      content: "Audio message",
      type: "audio",
      mediaUrl: URL.createObjectURL(audioBlob),
      mediaMimetype: "audio/ogg; codecs=opus",
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // Add to messages immediately
    setMessages((prev) => [...prev, pendingMessage]);
    setIsRecordingAudio(false);

    // Scroll to bottom
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    try {
      const sentMessage = await sendMediaMessage({
        chatId: conversation.id,
        type: "audio",
        file: audioFile,
      });

      // Update message status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...sentMessage, status: "sent" } : msg,
        ),
      );

      // Revoke object URL
      URL.revokeObjectURL(pendingMessage.mediaUrl!);
    } catch (error) {
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: "failed" } : msg,
        ),
      );

      toast({
        title: "Error sending audio",
        description: "Failed to send audio message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle send media
  const handleSendMedia = async (caption?: string) => {
    if (!selectedFile) return;

    const mediaType = getMediaTypeFromFile(selectedFile);
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const pendingMessage: MessageWithStatus = {
      id: tempId,
      tempId,
      chatId: conversation.id,
      sender: "human_assistant",
      content: caption || selectedFile.name,
      type: mediaType,
      mediaUrl: URL.createObjectURL(selectedFile),
      mediaMimetype: selectedFile.type,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // Add to messages immediately
    setMessages((prev) => [...prev, pendingMessage]);
    setIsMediaPreviewOpen(false);
    setSelectedFile(null);

    // Scroll to bottom
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    try {
      const sentMessage = await sendMediaMessage({
        chatId: conversation.id,
        type: mediaType,
        file: selectedFile,
        caption,
      });

      // Update message status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...sentMessage, status: "sent" } : msg,
        ),
      );

      // Revoke object URL
      URL.revokeObjectURL(pendingMessage.mediaUrl!);
    } catch (error) {
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: "failed" } : msg,
        ),
      );

      toast({
        title: "Error sending media",
        description: "Failed to send media message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const pendingMessage: MessageWithStatus = {
      id: tempId,
      tempId,
      chatId: conversation.id,
      sender: "human_assistant",
      content: newMessage,
      type: "text",
      mediaUrl: null,
      mediaMimetype: null,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // Add to messages immediately
    setMessages((prev) => [...prev, pendingMessage]);

    // Add to queue
    setPendingQueue((prev) => [...prev, pendingMessage]);

    setNewMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Scroll to bottom after adding message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  // Handle handler toggle
  const handleToggleHandler = () => {
    const newHandler = localConversation.handledBy === "ai" ? "human" : "ai";
    updateHandlerMutation.mutate({
      id: conversation.id,
      handledBy: newHandler,
    });
  };

  // Process queue when it changes
  useEffect(() => {
    if (pendingQueue.length > 0 && !isProcessingQueue.current) {
      processQueue();
    }
  }, [pendingQueue, processQueue]);

  // Handle new message from WebSocket
  useEffect(() => {
    if (!newMessageEvent || newMessageEvent.chatId !== conversation.id) {
      return;
    }

    const newMsg: MessageWithStatus = {
      id: newMessageEvent.messageId,
      chatId: newMessageEvent.chatId,
      sender: newMessageEvent.sender,
      content: newMessageEvent.content,
      type: newMessageEvent.type || "text",
      mediaUrl: newMessageEvent.mediaUrl || null,
      mediaMimetype: newMessageEvent.mediaMimetype || null,
      createdAt:
        newMessageEvent.createdAt instanceof Date
          ? newMessageEvent.createdAt.toISOString()
          : newMessageEvent.createdAt,
      status: "sent",
    };

    setMessages((prev) => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some((msg) => msg.id === newMsg.id);
      if (exists) return prev;

      return [...prev, newMsg];
    });

    // Scroll to bottom on new real-time message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  }, [newMessageEvent, conversation.id]);

  // Update messages when data changes
  useEffect(() => {
    if (messagesData) {
      if (currentPage === 1) {
        setMessages(messagesData.items);
      } else {
        // Save current scroll height before adding new messages
        const scrollElement = scrollAreaRef.current;
        if (scrollElement) {
          previousScrollHeight.current = scrollElement.scrollHeight;
        }

        // Add unique messages to the beginning
        setMessages((prevMessages) => {
          const newUniqueMessages = messagesData.items.filter(
            (msg) =>
              !prevMessages.some((existingMsg) => existingMsg.id === msg.id),
          );
          return [...newUniqueMessages, ...prevMessages];
        });
      }
      setHasMore(messagesData.page < messagesData.totalPages);
    }
  }, [messagesData, currentPage]);

  // Restore scroll position after loading old messages
  useEffect(() => {
    if (
      currentPage > 1 &&
      scrollAreaRef.current &&
      previousScrollHeight.current > 0
    ) {
      const scrollElement = scrollAreaRef.current;
      const newScrollHeight = scrollElement.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeight.current;

      // Maintain scroll position by adjusting for new content height
      scrollElement.scrollTop = scrollDifference;
      previousScrollHeight.current = 0;
    }
  }, [messages, currentPage]);

  // Update local conversation when prop changes
  useEffect(() => {
    setLocalConversation(conversation);
  }, [conversation]);

  // Reset states when conversation changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setAlreadyScrolled(false);
    setPendingQueue([]);
    previousMessagesLength.current = 0;
    previousScrollHeight.current = 0;
    lastScrollTop.current = 0;
  }, [conversation.id]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (
      alreadyScrolled ||
      !messages.length ||
      !scrollAreaRef.current ||
      isLoadingMessages
    )
      return;

    scrollAreaRef.current.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });

    setAlreadyScrolled(true);
  }, [messages.length, isLoadingMessages, alreadyScrolled]);

  // Auto scroll to bottom only for new messages (not when loading old ones)
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const currentLength = messages.length;
    const previousLength = previousMessagesLength.current;

    // Only scroll if messages were added at the end (new messages)
    // Not when loading old messages (currentPage > 1)
    if (
      currentLength > previousLength &&
      currentPage === 1 &&
      alreadyScrolled
    ) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    previousMessagesLength.current = currentLength;
  }, [messages, currentPage, alreadyScrolled]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // max height in pixels (approx 5 lines)
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight,
      )}px`;
      textareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [newMessage]);

  // Handle scroll to load more messages
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;

    if (isFetchingMessages || !hasMore) return;

    const currentScrollTop = target.scrollTop;

    // Scroll up → load more messages
    if (currentScrollTop < lastScrollTop.current && currentScrollTop <= 600) {
      setCurrentPage((prev) => prev + 1);
    }

    // Update last scrollTop
    lastScrollTop.current = currentScrollTop;
  };

  const getInitials = (name?: string, phone?: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (phone) {
      return phone.substring(0, 2);
    }
    return "??";
  };

  const getSenderLabel = (sender: Message["sender"]) => {
    switch (sender) {
      case "customer":
        return "Cliente";
      case "assistant":
        return "IA";
      case "human_assistant":
        return "Atendente";
      default:
        return sender;
    }
  };

  const formatDateSeparator = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) {
      return "Hoje";
    } else if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return format(date, "EEEE", { locale: ptBR });
    } else {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  const shouldShowDateSeparator = (
    currentMsg: MessageWithStatus,
    previousMsg: MessageWithStatus | null,
  ) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return !isSameDay(currentDate, previousDate);
  };

  const getMessageStatusIcon = (status?: MessageStatus) => {
    if (status === "pending") {
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
    if (status === "failed") {
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-background border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(
                  conversation.customer.name,
                  conversation.customer.phone,
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {conversation.customer.name ||
                  formatPhone(conversation.customer.phone)}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {conversation.customer.name && (
                  <span>{formatPhone(conversation.customer.phone)}</span>
                )}
                {conversation.customer.name && conversation.agent && (
                  <span>•</span>
                )}
                {conversation.agent && <span>{conversation.agent.name}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 xl:gap-3">
            {/* Handler Status Badge */}
            <div
              className={`flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 rounded-lg border-2 ${
                localConversation.handledBy === "ai"
                  ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              }`}
            >
              {localConversation.handledBy === "ai" ? (
                <>
                  <Bot className="h-4 w-4" />
                  <span className="text-xs xl:text-sm font-medium xl:hidden">
                    IA
                  </span>
                  <span className="text-sm font-medium hidden xl:inline">
                    Atendimento por IA
                  </span>
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4" />
                  <span className="text-xs xl:text-sm font-medium xl:hidden">
                    Humano
                  </span>
                  <span className="text-sm font-medium hidden xl:inline">
                    Atendimento Humano
                  </span>
                </>
              )}
            </div>

            {/* Transfer Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleHandler}
              disabled={updateHandlerMutation.isPending}
              className="gap-1.5 xl:gap-2 px-2 xl:px-3"
            >
              {updateHandlerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              <span className="hidden lg:inline">
                {localConversation.handledBy === "ai"
                  ? "Transferir para Humano"
                  : "Transferir para IA"}
              </span>
            </Button>

            {/* More Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => clearExternalIdMutation.mutate()}
                  disabled={clearExternalIdMutation.isPending}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearExternalIdMutation.isPending
                    ? "Limpando..."
                    : "Limpar registro"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 bg-[#efeae2] dark:bg-[#0d1117] pr-2"
          onScroll={handleScroll}
        >
          <div className="p-4">
            {isFetchingMessages && currentPage > 1 && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {isLoadingMessages && currentPage === 1 ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                Nenhuma mensagem ainda
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isCustomer = message.sender === "customer";
                  const previousMessage =
                    index > 0 ? messages[index - 1] : null;
                  const showDateSeparator = shouldShowDateSeparator(
                    message,
                    previousMessage,
                  );

                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-white/80 dark:bg-[#182229]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatDateSeparator(new Date(message.createdAt))}
                            </span>
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex ${
                          isCustomer ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isCustomer
                              ? "bg-white dark:bg-[#202c33]"
                              : message.sender === "assistant"
                                ? "bg-[#d9fdd3] dark:bg-[#005c4b]"
                                : "bg-[#cfe9ff] dark:bg-[#1f4e7e]"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.sender === "assistant" && (
                              <Bot className="h-3 w-3 text-primary" />
                            )}
                            {message.sender === "human_assistant" && (
                              <UserCog className="h-3 w-3 text-blue-600" />
                            )}
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getSenderLabel(message.sender)}
                            </span>
                          </div>
                          <MessageContent message={message} />
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {message.status && message.status !== "sent" && (
                              <span className="flex items-center">
                                {getMessageStatusIcon(message.status)}
                              </span>
                            )}
                            {message.status !== "pending" && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), "HH:mm")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input or Audio Recorder */}
        {isRecordingAudio ? (
          <AudioRecorder
            onSend={handleSendAudio}
            onCancel={() => setIsRecordingAudio(false)}
          />
        ) : (
          <div className="bg-background border-t p-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Textarea
                ref={textareaRef}
                placeholder="Digite uma mensagem"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                rows={1}
              />
              {newMessage.trim() ? (
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  className="flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => setIsRecordingAudio(true)}
                  className="flex-shrink-0"
                  variant="ghost"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <ChatSidebar
        conversation={localConversation}
        onUpdateConversation={(updatedConversation) => {
          setLocalConversation(updatedConversation);
          onUpdateConversation(updatedConversation);
        }}
      />

      {/* Media Preview Modal */}
      <MediaPreviewModal
        open={isMediaPreviewOpen}
        onClose={() => {
          setIsMediaPreviewOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onSend={handleSendMedia}
      />
    </div>
  );
};
