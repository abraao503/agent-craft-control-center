import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatList } from "@/components/chats/ChatList";
import { ChatWindow } from "@/components/chats/ChatWindow";
import { listConversations } from "@/services/conversation/listConversations";
import { getConversationById } from "@/services/conversation/getConversationById";
import { markChatAsRead } from "@/services/conversation/markChatAsRead";
import { Conversation, ConversationsFilters } from "@/types/conversation";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listAgent } from "@/services/agent/listAgent";
import { listTags } from "@/services/tag/listTags";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageSentEvent, ChatMarkedAsReadEvent } from "@/types/websocket";

const ChatsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [lastMessageEvent, setLastMessageEvent] =
    useState<MessageSentEvent | null>(null);
  const [filters, setFilters] = useState<ConversationsFilters>({
    page: 1,
    limit: 50,
    search: "",
    agentId: undefined,
    tagId: undefined,
    tagIds: [],
    initialDate: null,
    finalDate: null,
    sortBy: "updatedAt",
    sortOrder: "desc",
    handledBy: undefined,
  });

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["conversations"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const token = localStorage.getItem("token") || "";
  const { socket, connected, joinedWorkspace } = useWebSocket({
    workspaceId: workspaceId || "",
    token,
    enabled: !!workspaceId,
  });

  // Query to fetch conversations
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["conversations", filters, workspaceId],
    queryFn: () => listConversations(filters, workspaceId),
  });

  // Query to fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Query to fetch agents
  const { data: agentsData } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgent(workspaceId),
    enabled: !!workspaceId,
  });

  // Mutation to mark chat as read
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => markChatAsRead(chatId),
    onSuccess: (_, chatId) => {
      // Update local state to remove unread count
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === chatId ? { ...conv, unreadCount: 0 } : conv
        )
      );
      if (selectedConversation?.id === chatId) {
        setSelectedConversation((prev) =>
          prev ? { ...prev, unreadCount: 0 } : null
        );
      }
    },
  });

  // Update conversations when data changes
  useEffect(() => {
    if (data) {
      setConversations(data.items);
    }
  }, [data]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !joinedWorkspace) return;

    const handleMessageSent = (event: MessageSentEvent) => {
      console.log("New message received:", event);

      // Store the event to pass to ChatWindow
      setLastMessageEvent(event);

      setConversations((prev) => {
        const chatIndex = prev.findIndex((conv) => conv.id === event.chatId);

        if (chatIndex === -1) {
          // New conversation - refetch to get full data
          refetch();
          return prev;
        }

        // Update existing conversation
        const updatedConversations = [...prev];
        const chat = { ...updatedConversations[chatIndex] };

        // Update last message and timestamp
        chat.lastMessage = event.content;
        chat.lastInteraction = new Date(event.createdAt);

        // Increment unread count if:
        // 1. Message is from customer
        // 2. Chat is not currently selected
        // 3. Chat is being handled by agent (not human)
        if (
          event.sender === "customer" &&
          selectedConversation?.id !== event.chatId &&
          chat.handledBy === "ai"
        ) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }

        // Remove from current position
        updatedConversations.splice(chatIndex, 1);

        // Add to top
        updatedConversations.unshift(chat);

        return updatedConversations;
      });

      // Update selected conversation if it's the one that received the message
      if (selectedConversation?.id === event.chatId) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lastMessage: event.content,
            lastInteraction: new Date(event.createdAt),
          };
        });

        // Auto-mark as read if chat is open and handled by human
        if (
          event.sender === "customer" &&
          selectedConversation.handledBy === "human"
        ) {
          socket.emit("chat:mark-as-read", { chatId: event.chatId });
        }
      }
    };

    const handleChatMarkedAsRead = (event: ChatMarkedAsReadEvent) => {
      console.log("Chat marked as read:", event);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === event.chatId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      if (selectedConversation?.id === event.chatId) {
        setSelectedConversation((prev) =>
          prev ? { ...prev, unreadCount: 0 } : null
        );
      }
    };

    socket.on("message:sent", handleMessageSent);
    socket.on("chat:marked-as-read", handleChatMarkedAsRead);

    return () => {
      socket.off("message:sent", handleMessageSent);
      socket.off("chat:marked-as-read", handleChatMarkedAsRead);
    };
  }, [socket, joinedWorkspace, selectedConversation, refetch]);

  // Auto-select chat from URL parameter
  useEffect(() => {
    const chatId = searchParams.get("chatId");

    if (chatId && workspaceId && !selectedConversation) {
      setIsLoadingFromUrl(true);

      // Fetch the specific chat by ID
      getConversationById(chatId, workspaceId)
        .then((chat) => {
          setSelectedConversation(chat);

          // Mark chat as read if it has unread messages
          if (chat.unreadCount && chat.unreadCount > 0) {
            markAsReadMutation.mutate(chat.id);
          }
        })
        .catch((error) => {
          console.error("Failed to load chat:", error);
        })
        .finally(() => {
          setIsLoadingFromUrl(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, workspaceId]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // Handle agent filter change
  const handleAgentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      agentId: value === "all_agents" ? undefined : value,
      page: 1,
    }));
  };

  // Handle tag filter change
  const handleTagChange = (selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      tagIds: selected,
      tagId: undefined,
      page: 1,
    }));
  };

  // Handle handledBy filter change
  const handleHandledByChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      handledBy: value === "all" ? undefined : (value as "assistant" | "human"),
      page: 1,
    }));
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL with selected chat ID
    setSearchParams({ chatId: conversation.id }, { replace: true });

    // Mark chat as read if it has unread messages
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversation.id);
    }
  };

  // Handle conversation update
  const handleUpdateConversation = (updatedConversation: Conversation) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
    setSelectedConversation(updatedConversation);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>
                Ocorreu um erro ao carregar as conversas. Por favor, tente
                novamente.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Chat Layout */}
        {!isError && (
          <>
            {/* Chat List - Left Side */}
            <div className="w-[200px] md:w-[380px] flex-shrink-0">
              <ChatList
                conversations={conversations}
                selectedConversationId={selectedConversation?.id || null}
                onSelectConversation={handleSelectConversation}
                searchValue={filters.search || ""}
                onSearchChange={handleSearchChange}
                isLoading={isLoading || isChangingWorkspace}
              />
            </div>

            {/* Chat Window - Right Side */}
            <div className="flex-1 flex">
              {isLoadingFromUrl ? (
                <div className="flex-1 flex flex-col bg-white">
                  {/* Header Skeleton */}
                  <div className="border-b p-4 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  {/* Messages Skeleton */}
                  <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    <div className="flex justify-start">
                      <Skeleton className="h-16 w-64 rounded-lg" />
                    </div>
                    <div className="flex justify-end">
                      <Skeleton className="h-16 w-56 rounded-lg" />
                    </div>
                    <div className="flex justify-start">
                      <Skeleton className="h-20 w-72 rounded-lg" />
                    </div>
                    <div className="flex justify-end">
                      <Skeleton className="h-12 w-48 rounded-lg" />
                    </div>
                  </div>
                  {/* Input Skeleton */}
                  <div className="border-t p-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              ) : selectedConversation ? (
                <ChatWindow
                  conversation={selectedConversation}
                  onUpdateConversation={handleUpdateConversation}
                  newMessageEvent={lastMessageEvent}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-muted-foreground">
                  <MessageSquare className="h-24 w-24 mb-4 opacity-20" />
                  <h2 className="text-2xl font-semibold mb-2">
                    Selecione uma conversa
                  </h2>
                  <p className="text-sm">
                    Escolha uma conversa da lista para começar
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatsPage;
