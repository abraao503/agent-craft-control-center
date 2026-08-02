import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatInboxFilters } from "@/components/chats/ChatInboxFilters";
import { ChatList } from "@/components/chats/ChatList";
import { ChatWindow } from "@/components/chats/ChatWindow";
import { useAuth } from "@/contexts/auth/hooks";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { getConversationById } from "@/services/conversation/getConversationById";
import { listConversations } from "@/services/conversation/listConversations";
import { markChatAsRead } from "@/services/conversation/markChatAsRead";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listTags } from "@/services/tag/listTags";
import { listUsers } from "@/services/user/listUsers";
import { Conversation, ConversationsFilters } from "@/types/conversation";
import { MessageSentEvent } from "@/types/websocket";

const PAGE_SIZE = 30;

export default function ChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const isSalesRep = userProfile?.role === "SALES_REP";
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [lastMessageEvent, setLastMessageEvent] = useState<MessageSentEvent | null>(null);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [filters, setFilters] = useState<ConversationsFilters>({
    page: 1,
    limit: PAGE_SIZE,
    search: "",
    tagIds: [],
    sortBy: "lastMessageAt",
    sortOrder: "desc",
    assignmentScope: isSalesRep ? "mine" : "all",
  });
  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["conversations"],
    autoRefetch: true,
    trackLoadingState: true,
  });
  const { socket, joinedWorkspace } = useWebSocket({
    workspaceId: workspaceId ?? "",
    token: localStorage.getItem("token") ?? "",
    enabled: Boolean(workspaceId),
  });

  useEffect(() => {
    if (isSalesRep) {
      setFilters((current) => ({ ...current, assignmentScope: "mine", assignedUserId: undefined }));
    }
  }, [isSalesRep]);

  const conversationsQuery = useInfiniteQuery({
    queryKey: ["conversations", workspaceId, filters],
    queryFn: ({ pageParam }) =>
      listConversations({ ...filters, page: pageParam }, workspaceId!),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(workspaceId),
  });
  const conversations = useMemo(
    () => conversationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [conversationsQuery.data],
  );

  const { data: tags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId!),
    enabled: Boolean(workspaceId),
  });
  const { data: pipelines = [] } = useQuery({
    queryKey: ["chat-pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: Boolean(workspaceId),
  });
  const { data: stages = [] } = useQuery({
    queryKey: ["chat-pipeline-stages", filters.pipelineId, workspaceId],
    queryFn: () => listPipelineStages(filters.pipelineId!, workspaceId!),
    enabled: Boolean(filters.pipelineId && workspaceId),
  });
  const { data: usersData } = useQuery({
    queryKey: ["chat-users", workspaceId],
    queryFn: () => listUsers({ workspaceId: workspaceId!, limit: 100 }),
    enabled: Boolean(workspaceId && !isSalesRep),
  });

  const markAsRead = useMutation({
    mutationFn: async (chatId: string) => {
      await markChatAsRead(chatId);
      if (socket?.connected && workspaceId) {
        socket.emit("chat:mark-as-read", { chatId, workspaceId });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });

  useEffect(() => {
    if (!socket || !joinedWorkspace) return;

    const onMessage = (event: MessageSentEvent) => {
      setLastMessageEvent(event);
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });

      if (selectedConversation?.id === event.chatId && event.sender === "customer") {
        markAsRead.mutate(event.chatId);
      }
    };
    const onRead = () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    };
    const onAssignment = () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      if (selectedConversation) {
        void queryClient.invalidateQueries({ queryKey: ["chat-timeline", selectedConversation.id] });
      }
    };
    const onHandler = (event: { chatId: string; handledBy: "assistant" | "human" }) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      if (selectedConversation?.id === event.chatId) {
        setSelectedConversation((current) => current ? { ...current, handledBy: event.handledBy === "assistant" ? "ai" : "human" } : null);
      }
    };
    const onStage = () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      if (selectedConversation) void queryClient.invalidateQueries({ queryKey: ["chat-timeline", selectedConversation.id] });
    };

    socket.on("message:sent", onMessage);
    socket.on("chat:marked-as-read", onRead);
    socket.on("deal:assignment-changed", onAssignment);
    socket.on("chat:handler-changed", onHandler);
    socket.on("deal:stage-changed", onStage);
    return () => {
      socket.off("message:sent", onMessage);
      socket.off("chat:marked-as-read", onRead);
      socket.off("deal:assignment-changed", onAssignment);
      socket.off("chat:handler-changed", onHandler);
      socket.off("deal:stage-changed", onStage);
    };
  }, [joinedWorkspace, markAsRead, queryClient, selectedConversation, socket, workspaceId]);

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (!chatId || !workspaceId || selectedConversation || isLoadingFromUrl) return;

    setIsLoadingFromUrl(true);
    getConversationById(chatId, workspaceId)
      .then((chat) => {
        setSelectedConversation(chat);
        markAsRead.mutate(chat.id);
      })
      .finally(() => setIsLoadingFromUrl(false));
  }, [isLoadingFromUrl, markAsRead, searchParams, selectedConversation, workspaceId]);

  const updateFilters = (patch: Partial<ConversationsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  };
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSearchParams({ chatId: conversation.id }, { replace: true });
    markAsRead.mutate(conversation.id);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {conversationsQuery.isError ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md"><AlertDescription>Não foi possível carregar as conversas.</AlertDescription></Alert>
        </div>
      ) : (
        <>
          <div className="w-[360px] flex-shrink-0">
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id ?? null}
              onSelectConversation={selectConversation}
              searchValue={filters.search ?? ""}
              onSearchChange={(search) => updateFilters({ search })}
              isLoading={conversationsQuery.isLoading || isChangingWorkspace}
              hasMore={conversationsQuery.hasNextPage}
              isLoadingMore={conversationsQuery.isFetchingNextPage}
              onLoadMore={() => conversationsQuery.fetchNextPage()}
              filters={
                <ChatInboxFilters
                  filters={filters}
                  onChange={updateFilters}
                  isSalesRep={isSalesRep}
                  users={usersData?.items ?? []}
                  pipelines={pipelines}
                  stages={stages}
                  tags={tags}
                />
              }
            />
          </div>
          <div className="flex flex-1">
            {isLoadingFromUrl ? (
              <div className="flex flex-1 flex-col gap-4 p-4"><Skeleton className="h-16 w-full" /><Skeleton className="flex-1 w-full" /></div>
            ) : selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                onUpdateConversation={setSelectedConversation}
                newMessageEvent={lastMessageEvent}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                <MessageSquare className="mb-4 h-24 w-24 opacity-20" />
                <h2 className="text-2xl font-semibold">Selecione uma conversa</h2>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
