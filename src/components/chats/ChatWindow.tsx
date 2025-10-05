import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Conversation } from "@/types/conversation";
import { Message, MessageEvent } from "@/types/message";
import { listMessages } from "@/services/conversation/listMessages";
import { sendMessage } from "@/services/conversation/sendMessage";
import { updateConversationHandler } from "@/services/conversation/updateConversationHandler";
import { connectSocket, getSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "./ChatSidebar";

type ChatWindowProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onUpdateConversation,
}) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollTop = useRef(0);
  const previousMessagesLength = useRef(0);
  const previousScrollHeight = useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localConversation, setLocalConversation] = useState(conversation);
  const [alreadyScrolled, setAlreadyScrolled] = useState(false);

  // Fetch messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
  } = useQuery({
    queryKey: ["messages", conversation.id, currentPage],
    queryFn: () => listMessages({ chatId: conversation.id, page: currentPage }),
    staleTime: 0,
    refetchOnWindowFocus: false,
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

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        chatId: conversation.id,
        message: newMessage,
        agentId: conversation.agent?.id || "",
      });
      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Scroll to bottom after sending message
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle handler toggle
  const handleToggleHandler = () => {
    const newHandler = localConversation.handledBy === "ai" ? "human" : "ai";
    updateHandlerMutation.mutate({
      id: conversation.id,
      handledBy: newHandler,
    });
  };

  // Socket connection for real-time messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);

    socket.on("connect", () => {
      const room = `chat:${conversation.id}`;
      socket.emit("join", { room });
    });

    socket.on("message", (data: MessageEvent) => {
      if (data.chatId === conversation.id) {
        const newMsg: Message = {
          id: data.messageId,
          chatId: data.chatId,
          sender: data.sender,
          content: data.content,
          createdAt: data.createdAt,
        };
        setMessages((prev) => [...prev, newMsg]);

        // Scroll to bottom on new real-time message
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
              top: scrollAreaRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    });

    return () => {
      if (socket) {
        socket.off("message");
      }
    };
  }, [conversation.id]);

  // Update messages when data changes
  useEffect(() => {
    if (messagesData) {
      if (currentPage === 1) {
        setMessages(messagesData.items.reverse());
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
              !prevMessages.some((existingMsg) => existingMsg.id === msg.id)
          );
          return [...newUniqueMessages.reverse(), ...prevMessages];
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
        maxHeight
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
    if (currentScrollTop < lastScrollTop.current && currentScrollTop <= 140) {
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

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-background border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(
                  conversation.customer.identifier,
                  conversation.customer.phone
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {conversation.customer.identifier ||
                  conversation.customer.phone}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    localConversation.handledBy === "ai" ? "default" : "outline"
                  }
                  className="text-xs"
                >
                  {localConversation.handledBy === "ai" ? "IA" : "Humano"}
                </Badge>
                {conversation.agent && (
                  <span className="text-xs text-muted-foreground">
                    {conversation.agent.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="handler-toggle" className="text-sm">
                      {localConversation.handledBy === "ai"
                        ? "Transferir para Humano"
                        : "Transferir para IA"}
                    </Label>
                    <Switch
                      id="handler-toggle"
                      checked={localConversation.handledBy === "human"}
                      onCheckedChange={handleToggleHandler}
                      disabled={updateHandlerMutation.isPending}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 bg-[#efeae2] pr-2"
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
                {messages.map((message) => {
                  const isCustomer = message.sender === "customer";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isCustomer ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isCustomer
                            ? "bg-white"
                            : message.sender === "assistant"
                            ? "bg-[#d9fdd3]"
                            : "bg-[#cfe9ff]"
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
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block text-right">
                          {format(new Date(message.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="bg-background border-t p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
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
              disabled={isSending}
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSidebar
        conversation={localConversation}
        onUpdateConversation={(updatedConversation) => {
          setLocalConversation(updatedConversation);
          onUpdateConversation(updatedConversation);
        }}
      />
    </div>
  );
};
