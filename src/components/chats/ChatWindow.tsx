import React, { useEffect, useState, useRef, useCallback } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { listReplyChannels } from "@/services/conversation/listReplyChannels";
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { clearConversationExternalId } from "@/services/conversation/clearConversationExternalId";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "./ChatSidebar";
import { MessageSentEvent } from "@/types/websocket";
import { MessageContent } from "./media/MessageContent";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { AudioRecorder } from "./AudioRecorder";
import { formatPhone } from "@/utils/phone";
import { ConversationTimeline } from "./ConversationTimeline";
import { usePermissions } from "@/hooks/usePermissions";
import { assignUserToDeal } from "@/services/deal/assignUserToDeal";
import { listUsers } from "@/services/user/listUsers";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { ReplyChannel } from "@/types/reply-channel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MessageStatus = "pending" | "sent" | "failed";

type MessageWithStatus = Message & {
  status?: MessageStatus;
  tempId?: string;
  replyChannelId?: string;
  replyContextMessageId?: string;
};

type ChatWindowProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
  newMessageEvent?: MessageSentEvent | null;
};

type SendErrorFallback = {
  title: string;
  description: string;
};

const SEND_ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  WINDOW_CLOSED: {
    title: "Janela de atendimento encerrada",
    description:
      "A janela de 24 horas do WhatsApp expirou. Aguarde uma nova mensagem do cliente para continuar ou use um template aprovado pela Meta.",
  },
  TEMPLATE_REQUIRED: {
    title: "Template necessário",
    description:
      "A janela de atendimento expirou. Para iniciar uma nova conversa, é necessário enviar um template aprovado pela Meta.",
  },
  OPT_IN_REQUIRED: {
    title: "Consentimento necessário",
    description:
      "É necessário ter um opt-in registrado para enviar este template fora da janela de atendimento.",
  },
  TEMPLATE_INVALID: {
    title: "Template indisponível",
    description: "O template não está aprovado ou não é compatível com este número.",
  },
  MEDIA_NOT_SUPPORTED: {
    title: "Mídia não suportada",
    description: "Não foi possível enviar este tipo de mídia pelo WhatsApp.",
  },
  RATE_LIMITED: {
    title: "Limite de envio atingido",
    description: "Aguarde alguns instantes antes de tentar enviar novamente.",
  },
  TOKEN_INVALID: {
    title: "Integração indisponível",
    description:
      "A credencial da integração WhatsApp é inválida. Verifique a configuração da integração.",
  },
  FEATURE_DISABLED: {
    title: "WhatsApp Meta desativado",
    description: "O envio pela integração Meta não está habilitado para esta empresa.",
  },
  INTEGRATION_NOT_FOUND: {
    title: "Integração não encontrada",
    description: "O canal selecionado não está mais configurado para esta conversa.",
  },
  "Integration not found": {
    title: "Integração não encontrada",
    description: "O canal selecionado não está mais configurado para esta conversa.",
  },
  "Reply channel required": {
    title: "Canal de resposta necessário",
    description: "Selecione um canal de resposta antes de enviar a mensagem.",
  },
  "Reply channel unavailable": {
    title: "Canal indisponível",
    description: "O canal selecionado está desconectado ou indisponível.",
  },
  "Reply channel stale": {
    title: "Canal de resposta desatualizado",
    description: "A conversa recebeu uma atualização. Confirme o canal antes de enviar.",
  },
  Forbidden: {
    title: "Envio não autorizado",
    description: "Você não tem permissão para enviar por este canal.",
  },
  "User not found": {
    title: "Sessão expirada",
    description: "Atualize a página e entre novamente para continuar.",
  },
  "Chat has no pipeline": {
    title: "Conversa sem pipeline",
    description: "Associe a conversa a um pipeline antes de enviar mensagens.",
  },
  "Internal error": {
    title: "Erro interno",
    description: "O servidor não conseguiu concluir o envio. Tente novamente.",
  },
  "Internal Server Error": {
    title: "Falha temporária no servidor",
    description: "O envio não foi concluído. Aguarde alguns instantes e tente novamente.",
  },
  INVALID_CONSENT_TARGET: {
    title: "Consentimento indisponível",
    description: "Não foi possível validar o consentimento para este cliente e canal.",
  },
  CHAT_NOT_FOUND: {
    title: "Conversa não encontrada",
    description: "Atualize a conversa e tente novamente.",
  },
  "Chat not found": {
    title: "Conversa não encontrada",
    description: "Atualize a conversa e tente novamente.",
  },
  UNKNOWN: {
    title: "Falha no envio",
    description:
      "O provedor não confirmou o envio. Verifique o status da mensagem antes de tentar novamente.",
  },
};

const getApiErrorCode = (error: unknown): string | null => {
  const response = (
    error as {
      response?: {
        data?: { message?: unknown; error?: unknown };
      };
    }
  )?.response;
  const message = response?.data?.message;

  if (typeof message === "string") return message.trim();
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0].trim();
  }

  return typeof response?.data?.error === "string"
    ? response.data.error.trim()
    : null;
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onUpdateConversation,
  newMessageEvent,
}) => {
  const { toast } = useToast();
  const { has } = usePermissions();
  const { currentWorkspace } = useWorkspaceManager();
  const queryClient = useQueryClient();
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
  const [selectedReplyChannelId, setSelectedReplyChannelId] = useState<string | null>(null);
  const [replyContextMessageId, setReplyContextMessageId] = useState<string | null>(null);
  const [pendingReplyChannel, setPendingReplyChannel] = useState<{
    integrationId: string;
    contextMessageId: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSendPermission = has("send:message");
  const canAssign = has("assign:deal");

  const replyChannelsQuery = useQuery({
    queryKey: ["chat-reply-channels", conversation.id],
    queryFn: () => listReplyChannels(conversation.id),
    enabled: canSendPermission,
    staleTime: 0,
  });

  const replyChannels = replyChannelsQuery.data?.channels ?? [];
  const singleReplyChannel = replyChannels.length === 1 ? replyChannels[0] : null;
  const selectedReplyChannel = replyChannels.find(
    (channel) => channel.integrationId === selectedReplyChannelId,
  );
  const canSend = Boolean(
    canSendPermission &&
      selectedReplyChannelId &&
      selectedReplyChannel?.available &&
      !pendingReplyChannel,
  );

  const latestInbound = replyChannelsQuery.data?.latestInbound ?? null;
  const hasComposerDraft = Boolean(
    newMessage.trim() || selectedFile || isRecordingAudio || pendingQueue.length,
  );

  const formatReplyChannel = (channel?: ReplyChannel | null) => {
    if (!channel) return "Canal não selecionado";
    const provider = channel.provider === "meta-cloud"
      ? "Meta Cloud"
      : channel.provider;
    return `${channel.pipeline.name} · ${provider}${
      channel.metaDisplayPhoneNumber
        ? ` · ${channel.metaDisplayPhoneNumber}`
        : ""
    }`;
  };

  useEffect(() => {
    if (!replyChannelsQuery.data) return;

    const suggestedIntegrationId =
      replyChannelsQuery.data.suggestedIntegrationId;
    const nextContextMessageId = latestInbound?.messageId ?? null;
    const automaticIntegrationId =
      suggestedIntegrationId ?? singleReplyChannel?.integrationId ?? null;

    if (!selectedReplyChannelId) {
      setSelectedReplyChannelId(automaticIntegrationId);
      setReplyContextMessageId(nextContextMessageId);
      return;
    }

    if (!selectedReplyChannel) {
      setSelectedReplyChannelId(automaticIntegrationId);
      setReplyContextMessageId(nextContextMessageId);
      setPendingReplyChannel(null);
      return;
    }

    if (nextContextMessageId === replyContextMessageId) return;

    if (
      hasComposerDraft &&
      suggestedIntegrationId &&
      suggestedIntegrationId !== selectedReplyChannelId
    ) {
      setPendingReplyChannel({
        integrationId: suggestedIntegrationId,
        contextMessageId: nextContextMessageId,
      });
      return;
    }

    setSelectedReplyChannelId(automaticIntegrationId);
    setReplyContextMessageId(nextContextMessageId);
    setPendingReplyChannel(null);
  }, [
    hasComposerDraft,
    latestInbound?.messageId,
    replyChannelsQuery.data,
    replyContextMessageId,
    selectedReplyChannelId,
    selectedReplyChannel,
    singleReplyChannel?.integrationId,
  ]);

  useEffect(() => {
    if (newMessageEvent?.chatId !== conversation.id) return;

    void queryClient.invalidateQueries({
      queryKey: ["chat-reply-channels", conversation.id],
    });
  }, [conversation.id, newMessageEvent, queryClient]);

  const handleReplyChannelChange = (integrationId: string) => {
    setSelectedReplyChannelId(integrationId);
    setReplyContextMessageId(latestInbound?.messageId ?? null);
    setPendingReplyChannel(null);
  };

  const confirmPendingReplyChannel = () => {
    if (!pendingReplyChannel) return;

    setSelectedReplyChannelId(pendingReplyChannel.integrationId);
    setReplyContextMessageId(pendingReplyChannel.contextMessageId);
    setPendingReplyChannel(null);
  };

  const handleSendError = useCallback(
    (error: unknown, fallback: SendErrorFallback) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      const code = getApiErrorCode(error);
      const hasResponse = Boolean(
        (error as { response?: unknown })?.response,
      );

      if (status === 409) {
        void queryClient.invalidateQueries({
          queryKey: ["chat-reply-channels", conversation.id],
        });

        const channelMessage =
          (code && SEND_ERROR_MESSAGES[code]) ?? {
            title: "Canal de resposta indisponível",
            description: "Atualize os canais da conversa e tente novamente.",
          };
        toast({
          ...channelMessage,
          variant: "destructive",
        });
        return;
      }

      if (!hasResponse && (error as { request?: unknown })?.request) {
        toast({
          title: "Sem conexão com o servidor",
          description: "Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const message = code ? SEND_ERROR_MESSAGES[code] : undefined;
      toast({
        ...(message ?? fallback),
        variant: "destructive",
      });
    },
    [conversation.id, queryClient, toast],
  );

  const { data: workspaceUsers } = useQuery({
    queryKey: ["chat-assignment-users", currentWorkspace?.id],
    queryFn: () => listUsers({ workspaceId: currentWorkspace!.id, limit: 100 }),
    enabled: canAssign && Boolean(currentWorkspace?.id),
  });

  const assignmentMutation = useMutation({
    mutationFn: (userId: string | null) =>
      assignUserToDeal(conversation.primaryDeal.id, {
        workspaceId: currentWorkspace!.id,
        userId,
      }),
    onSuccess: (_, userId) => {
      const assignedUser = workspaceUsers?.items.find((user) => user.id === userId) ?? null;
      const updatedConversation = {
        ...localConversation,
        primaryDeal: { ...localConversation.primaryDeal, assignedUser },
      };
      setLocalConversation(updatedConversation);
      onUpdateConversation(updatedConversation);
      toast({ title: assignedUser ? `Responsável: ${assignedUser.name}` : "Responsável removido" });
    },
    onError: () => toast({ title: "Não foi possível alterar o responsável", variant: "destructive" }),
  });

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
        companyWhatsappIntegrationId: messageToSend.replyChannelId,
        replyContextMessageId: messageToSend.replyContextMessageId,
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

      handleSendError(error, {
        title: "Erro ao enviar mensagem",
        description: "A mensagem não foi enviada. Tente novamente.",
      });
    } finally {
      isProcessingQueue.current = false;
    }
  }, [
    pendingQueue,
    conversation.id,
    conversation.agent?.id,
    handleSendError,
  ]);

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
    if (!canSend || !selectedReplyChannelId) return;

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
      replyChannelId: selectedReplyChannelId,
      replyContextMessageId: replyContextMessageId ?? undefined,
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
        companyWhatsappIntegrationId: selectedReplyChannelId,
        replyContextMessageId: replyContextMessageId ?? undefined,
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

      handleSendError(error, {
        title: "Erro ao enviar áudio",
        description: "Não foi possível enviar o áudio. Tente novamente.",
      });
    }
  };

  // Handle send media
  const handleSendMedia = async (caption?: string) => {
    if (!selectedFile || !canSend || !selectedReplyChannelId) return;

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
      replyChannelId: selectedReplyChannelId,
      replyContextMessageId: replyContextMessageId ?? undefined,
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
        companyWhatsappIntegrationId: selectedReplyChannelId,
        replyContextMessageId: replyContextMessageId ?? undefined,
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

      handleSendError(error, {
        title: "Erro ao enviar mídia",
        description: "Não foi possível enviar a mídia. Tente novamente.",
      });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !canSend || !selectedReplyChannelId) return;

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
      replyChannelId: selectedReplyChannelId,
      replyContextMessageId: replyContextMessageId ?? undefined,
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
      replyChannelId: newMessageEvent.companyWhatsappIntegrationId ?? undefined,
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
    setSelectedReplyChannelId(null);
    setReplyContextMessageId(null);
    setPendingReplyChannel(null);
    setNewMessage("");
    setSelectedFile(null);
    setIsMediaPreviewOpen(false);
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

  const replyChannelControls = canSendPermission ? (
    <div className="space-y-2 border-t bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Canal de resposta</span>
        {singleReplyChannel ? (
          <div className="flex h-8 min-w-0 flex-1 items-center rounded-md border bg-muted/40 px-3 text-xs">
            <span className="truncate">
              {formatReplyChannel(singleReplyChannel)}
              {!singleReplyChannel.available ? " · indisponível" : ""}
            </span>
          </div>
        ) : (
          <Select
            value={selectedReplyChannelId ?? ""}
            onValueChange={handleReplyChannelChange}
            disabled={
              replyChannelsQuery.isLoading || replyChannels.length === 0
            }
          >
            <SelectTrigger className="h-8 max-w-[420px] flex-1 text-xs">
              <SelectValue placeholder="Selecione um canal" />
            </SelectTrigger>
            <SelectContent>
              {replyChannels.map((channel) => (
                <SelectItem
                  key={channel.integrationId}
                  value={channel.integrationId}
                  disabled={!channel.available}
                >
                  {formatReplyChannel(channel)}
                  {!channel.available ? " · indisponível" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {pendingReplyChannel && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <span>Chegou uma nova mensagem por outro canal. Confirme o canal antes de enviar.</span>
          <Button size="sm" className="h-7" onClick={confirmPendingReplyChannel}>
            Usar novo canal
          </Button>
        </div>
      )}
      {!pendingReplyChannel &&
        latestInbound?.integrationId &&
        !replyChannels.some(
          (channel) => channel.integrationId === latestInbound.integrationId,
        ) && (
          <p className="text-xs text-amber-700">
            A última mensagem chegou por um canal que não está atribuído a você.
          </p>
        )}
      {!pendingReplyChannel &&
        !selectedReplyChannelId &&
        !singleReplyChannel &&
        !replyChannelsQuery.isLoading && (
          <p className="text-xs text-muted-foreground">
            Selecione um canal para habilitar o envio.
          </p>
        )}
    </div>
  ) : null;

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
            {canAssign && (
              <Select
                value={localConversation.primaryDeal.assignedUser?.id ?? "unassigned"}
                onValueChange={(value) => assignmentMutation.mutate(value === "unassigned" ? null : value)}
                disabled={assignmentMutation.isPending}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {workspaceUsers?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

        {/* Timeline */}
        <div className="min-h-0 flex-1">
          <ConversationTimeline
            chatId={conversation.id}
            newMessageEvent={newMessageEvent}
          />
        </div>

        {/* Input or Audio Recorder */}
        {isRecordingAudio ? (
          <>
            {replyChannelControls}
            <AudioRecorder
              onSend={handleSendAudio}
              onCancel={() => setIsRecordingAudio(false)}
            />
          </>
        ) : (
          <div className="bg-background">
            {replyChannelControls}
            <div className="border-t p-3">
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
                disabled={!canSend}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Textarea
                ref={textareaRef}
                placeholder="Digite uma mensagem"
                disabled={!canSend}
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
                  disabled={!canSend}
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => setIsRecordingAudio(true)}
                  className="flex-shrink-0"
                  variant="ghost"
                  disabled={!canSend}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
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
