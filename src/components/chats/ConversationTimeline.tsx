import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageContent } from "./media/MessageContent";
import { MessageReactions } from "./MessageReactions";
import { MessageReplyPreview } from "./MessageReplyPreview";
import { listChatTimeline } from "@/services/conversation/listChatTimeline";
import type { ChatTimelineEvent, ChatTimelineResponse } from "@/types/chat-timeline";
import type {
  Message,
  MessageReactionEvent,
  WhatsappMessageReactionSummary,
} from "@/types/message";
import { MessageSentEvent } from "@/types/websocket";
import { useTranslation } from "react-i18next";
import { connectSocket } from "@/lib/socket";
import { useQuotedMessageNavigation } from "@/hooks/useQuotedMessageNavigation";
import type { QuotedNavigationState } from "@/utils/quoted-message-navigation";

type Props = { chatId: string; newMessageEvent?: MessageSentEvent | null };

function isMessageReactionEvent(value: unknown): value is MessageReactionEvent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const event = value as Record<string, unknown>;
  return (
    typeof event.chatId === "string" &&
    event.chatId.length > 0 &&
    typeof event.messageId === "string" &&
    event.messageId.length > 0 &&
    Array.isArray(event.reactions) &&
    event.reactions.every((reaction) => {
      if (typeof reaction !== "object" || reaction === null || Array.isArray(reaction)) {
        return false;
      }
      const summary = reaction as Record<string, unknown>;
      return (
        typeof summary.emoji === "string" &&
        summary.emoji.trim().length > 0 &&
        typeof summary.count === "number" &&
        Number.isInteger(summary.count) &&
        summary.count > 0
      );
    })
  );
}

export function ConversationTimeline({ chatId, newMessageEvent }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const returnToRecentRef = useRef(false);
  const [remoteAnchorId, setRemoteAnchorId] = useState<string | null>(null);
  const initialScrollChatId = useRef<string | null>(null);
  const lastScrolledEventKey = useRef<string | null>(null);
  const timelineQueryKey = useMemo(() => ["chat-timeline", chatId] as const, [chatId]);
  const query = useInfiniteQuery({
    queryKey: timelineQueryKey,
    queryFn: ({ pageParam }) =>
      listChatTimeline({ chatId, page: pageParam, limit: 50 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
  const remoteQuery = useInfiniteQuery({
    queryKey: ["chat-timeline", chatId, "around", remoteAnchorId],
    queryFn: ({ pageParam, signal }) =>
      listChatTimeline({
        chatId,
        page: pageParam,
        limit: 50,
        ...(pageParam === 1 && remoteAnchorId
          ? { aroundMessageId: remoteAnchorId }
          : {}),
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(remoteAnchorId),
  });
  const remoteEvents = useMemo(() => {
    const seen = new Set<string>();
    return (remoteQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
      (event) => {
        const key = `${event.type}:${event.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      },
    );
  }, [remoteQuery.data]);
  const remoteFound = Boolean(
    remoteAnchorId && remoteEvents.some((event) => event.type === "message" && event.id === remoteAnchorId),
  );
  const remoteStatus = remoteAnchorId
    ? remoteQuery.isError
      ? "error"
      : remoteQuery.isLoading
        ? "loading"
        : remoteQuery.data
          ? "success"
          : "idle"
    : "idle";
  const navigation = useQuotedMessageNavigation({
    scopeKey: chatId,
    containerRef: scrollAreaRef,
    requestRemoteMessage: setRemoteAnchorId,
    remoteMessageState: {
      targetMessageId: remoteAnchorId,
      status: remoteStatus,
      found: remoteFound,
    },
  });

  useEffect(() => {
    setRemoteAnchorId(null);
    returnToRecentRef.current = false;
  }, [chatId]);

  useEffect(() => {
    if (newMessageEvent?.chatId === chatId) {
      void queryClient.invalidateQueries({ queryKey: ["chat-timeline", chatId] });
    }
  }, [chatId, newMessageEvent, queryClient]);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    if (!token) return;

    const socket = connectSocket(token);
    const handleReaction = (rawEvent: unknown) => {
      if (!isMessageReactionEvent(rawEvent) || rawEvent.chatId !== chatId) return;

      const cached = queryClient.getQueryData<InfiniteData<ChatTimelineResponse>>(
        timelineQueryKey,
      );
      const messageIsLoaded = cached?.pages.some((page) =>
        page.items.some(
          (item) => item.type === "message" && item.id === rawEvent.messageId,
        ),
      );

      if (!cached || !messageIsLoaded) {
        void queryClient.invalidateQueries({ queryKey: timelineQueryKey });
        return;
      }

      queryClient.setQueryData<InfiniteData<ChatTimelineResponse>>(
        timelineQueryKey,
        {
          ...cached,
          pages: cached.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.type === "message" && item.id === rawEvent.messageId
                ? {
                    ...item,
                    payload: { ...item.payload, reactions: rawEvent.reactions },
                  }
                : item,
            ),
          })),
        },
      );
    };

    socket.on("message:reaction", handleReaction);
    return () => {
      socket.off("message:reaction", handleReaction);
    };
  }, [chatId, queryClient, timelineQueryKey]);

  useEffect(() => {
    if (!remoteAnchorId || !remoteQuery.isError) return;
    setRemoteAnchorId(null);
  }, [remoteAnchorId, remoteQuery.isError]);

  useEffect(() => {
    if (!remoteAnchorId || !remoteQuery.data || remoteFound) return;
    setRemoteAnchorId(null);
  }, [remoteAnchorId, remoteFound, remoteQuery.data]);

  const events = query.data?.pages.flatMap((page) => page.items) ?? [];
  const displayEvents = remoteAnchorId && remoteQuery.data ? remoteEvents : events;

  const returnToRecent = useCallback(() => {
    returnToRecentRef.current = true;
    setRemoteAnchorId(null);
    navigation.reset();
  }, [navigation]);

  useLayoutEffect(() => {
    if (!query.data || query.isLoading || !scrollAreaRef.current) return;
    if (remoteAnchorId || navigation.isNavigating) return;

    if (returnToRecentRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      returnToRecentRef.current = false;
      initialScrollChatId.current = chatId;
      return;
    }

    const eventKey =
      newMessageEvent?.chatId === chatId
        ? `${chatId}:${newMessageEvent.messageId}`
        : null;
    const isOpeningChat = initialScrollChatId.current !== chatId;
    const isNewMessageLoaded =
      eventKey !== null &&
      eventKey !== lastScrolledEventKey.current &&
      query.data.pages.some((page) =>
        page.items.some((event) => event.id === newMessageEvent?.messageId),
      );

    if (!isOpeningChat && !isNewMessageLoaded) return;

    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    initialScrollChatId.current = chatId;

    if (isNewMessageLoaded) {
      lastScrolledEventKey.current = eventKey;
    }
  }, [chatId, navigation.isNavigating, newMessageEvent, query.data, query.isLoading, remoteAnchorId]);

  if (query.isLoading) {
    return <Loader2 className="m-auto h-6 w-6 animate-spin text-primary" />;
  }

  return (
    <div
      ref={scrollAreaRef}
      className="flex h-full flex-col overflow-auto bg-[#efeae2] p-4 dark:bg-[#0d1117]"
    >
      {remoteAnchorId ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
          <span>
            {remoteQuery.data
              ? "Exibindo outro trecho da conversa."
              : "Carregando outro trecho da conversa…"}
          </span>
          <Button variant="outline" size="sm" onClick={returnToRecent}>
            Voltar às recentes
          </Button>
        </div>
      ) : null}
      {(remoteAnchorId ? remoteQuery.hasNextPage : query.hasNextPage) && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-auto mb-3"
          disabled={remoteAnchorId ? remoteQuery.isFetchingNextPage : query.isFetchingNextPage}
          onClick={() => void (remoteAnchorId ? remoteQuery.fetchNextPage() : query.fetchNextPage())}
        >
          {(remoteAnchorId ? remoteQuery.isFetchingNextPage : query.isFetchingNextPage)
            ? t("common.loading")
            : t("chats.loadEarlier")}
        </Button>
      )}
      <div className="mt-auto space-y-3">
        {([...displayEvents].reverse()).map((event) =>
          event.type === "message" ? (
            <TimelineMessage
              key={`${event.type}:${event.id}`}
              event={event}
              chatId={chatId}
              highlighted={navigation.highlightedMessageId === event.id}
              onNavigate={navigation.navigateToMessage}
              navigationState={navigation.getPreviewState(event.id)}
            />
          ) : (
            <TimelineDealEvent key={`${event.type}:${event.id}`} event={event} />
          ),
        )}
        {displayEvents.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento ainda</p>
        )}
      </div>
    </div>
  );
}

function TimelineMessage({
  event,
  chatId,
  highlighted,
  onNavigate,
  navigationState,
}: {
  event: ChatTimelineEvent;
  chatId: string;
  highlighted: boolean;
  onNavigate: (targetMessageId: string, sourceMessageId: string) => void;
  navigationState: QuotedNavigationState;
}) {
  const sender = event.payload.sender ?? "assistant";
  const message: Message = {
    id: event.id,
    chatId,
    sender,
    content: event.payload.content ?? "",
    type: event.payload.messageType ?? "text",
    mediaUrl: event.payload.mediaUrl ?? null,
    mediaMimetype: event.payload.mediaMimetype ?? null,
    createdAt: event.createdAt,
    sentByUser: event.payload.sentByUser,
    deliveryStatus: event.payload.deliveryStatus,
    externalMessageId: event.payload.externalMessageId,
    deliveryUpdatedAt: event.payload.deliveryUpdatedAt,
    deliveryErrorCode: event.payload.deliveryErrorCode,
    deliveryErrorMessage: event.payload.deliveryErrorMessage,
    templateId: event.payload.templateId,
    templateName: event.payload.templateName,
    templateLanguage: event.payload.templateLanguage,
    templateParameters: event.payload.templateParameters,
    templateSnapshot: event.payload.templateSnapshot,
    reactions: event.payload.reactions,
    replyContext: event.payload.replyContext,
  };
  const isCustomer = sender === "customer";
  const author =
    sender === "customer"
      ? "Cliente"
      : sender === "assistant"
        ? "IA"
        : event.payload.sentByUser?.name ?? "Atendente";

  return (
    <div
      className={`flex rounded-lg transition-shadow ${highlighted ? "ring-2 ring-primary ring-offset-2" : ""} ${isCustomer ? "justify-start" : "justify-end"}`}
      data-message-id={event.id}
      tabIndex={-1}
    >
      <div className="flex max-w-[70%] flex-col">
        <div className={`w-fit max-w-full rounded-lg p-3 ${isCustomer ? "bg-white dark:bg-[#202c33]" : sender === "assistant" ? "bg-[#d9fdd3] dark:bg-[#005c4b]" : "bg-[#cfe9ff] dark:bg-[#1f4e7e]"}`}>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {sender === "assistant" ? <Bot className="h-3 w-3" /> : sender === "human_assistant" ? <UserCog className="h-3 w-3" /> : null}
            {author}
          </div>
          <MessageReplyPreview
            replyContext={message.replyContext}
            onNavigate={(targetMessageId) => onNavigate(targetMessageId, event.id)}
            navigationState={navigationState}
          />
          <MessageContent message={message} />
          {event.payload.channel && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Canal: {event.payload.channel.pipeline.name} · {event.payload.channel.provider}
            </div>
          )}
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm")}
            {message.deliveryStatus && message.sender !== "customer" && (
              <span className="ml-2" title={message.deliveryErrorMessage ?? undefined}>
                <DeliveryStatusIcon status={message.deliveryStatus} />
              </span>
            )}
          </div>
        </div>
        <MessageReactions
          reactions={message.reactions}
          align={isCustomer ? "start" : "end"}
        />
      </div>
    </div>
  );
}

function DeliveryStatusIcon({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "PENDING") {
    return <Clock className="inline h-3.5 w-3.5" aria-label="Mensagem pendente" />;
  }

  if (normalizedStatus === "FAILED" || normalizedStatus === "UNKNOWN") {
    return (
      <AlertCircle
        className="inline h-3.5 w-3.5 text-destructive"
        aria-label="Falha no envio"
      />
    );
  }

  if (["DELIVERED", "READ", "PLAYED"].includes(normalizedStatus)) {
    return (
      <CheckCheck
        className={`inline h-3.5 w-3.5 ${
          ["READ", "PLAYED"].includes(normalizedStatus)
            ? "text-blue-500"
            : ""
        }`}
        aria-label={
          ["READ", "PLAYED"].includes(normalizedStatus)
            ? "Mensagem lida"
            : "Mensagem entregue"
        }
      />
    );
  }

  return <Check className="inline h-3.5 w-3.5" aria-label="Mensagem enviada" />;
}

function TimelineDealEvent({ event }: { event: ChatTimelineEvent }) {
  const { t } = useTranslation();
  let description: string = t("chats.eventDefault");
  if (event.type === "deal_created") {
    description = t("chats.dealCreated", {
      stage: event.payload.stage?.name ?? t("chats.eventInitialStage"),
    });
  } else if (event.type === "stage_changed") {
    description = t("chats.stageChanged", {
      from: event.payload.fromStage?.name ?? t("chats.eventEntry"),
      to: event.payload.toStage?.name ?? t("chats.eventNewStage"),
    });
  } else if (event.type === "assignment_changed") {
    description = event.payload.assignedUser
      ? t("chats.assignmentChanged", { name: event.payload.assignedUser.name })
      : t("chats.assignmentRemoved");
  }

  return (
    <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
      <BriefcaseBusiness className="h-3.5 w-3.5" />
      <span className="font-medium text-foreground">{event.deal?.title}</span>
      <ArrowRight className="h-3 w-3" />
      <span>{description}</span>
      {event.pipeline && <span>• {event.pipeline.name}</span>}
      <span>• {format(new Date(event.createdAt), "dd/MM HH:mm")}</span>
    </div>
  );
}
