import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Bot, BriefcaseBusiness, Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageContent } from "./media/MessageContent";
import { listChatTimeline } from "@/services/conversation/listChatTimeline";
import { ChatTimelineEvent } from "@/types/chat-timeline";
import { Message } from "@/types/message";
import { MessageSentEvent } from "@/types/websocket";

type Props = { chatId: string; newMessageEvent?: MessageSentEvent | null };

export function ConversationTimeline({ chatId, newMessageEvent }: Props) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["chat-timeline", chatId],
    queryFn: ({ pageParam }) =>
      listChatTimeline({ chatId, page: pageParam, limit: 50 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  useEffect(() => {
    if (newMessageEvent?.chatId === chatId) {
      void queryClient.invalidateQueries({ queryKey: ["chat-timeline", chatId] });
    }
  }, [chatId, newMessageEvent, queryClient]);

  if (query.isLoading) {
    return <Loader2 className="m-auto h-6 w-6 animate-spin text-primary" />;
  }

  const events = query.data?.pages.flatMap((page) => page.items) ?? [];
  const chronologicalEvents = [...events].reverse();

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#efeae2] p-4 dark:bg-[#0d1117]">
      {query.hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-auto mb-3"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Carregando..." : "Carregar eventos anteriores"}
        </Button>
      )}
      <div className="mt-auto space-y-3">
        {chronologicalEvents.map((event) =>
          event.type === "message" ? (
            <TimelineMessage key={`${event.type}:${event.id}`} event={event} chatId={chatId} />
          ) : (
            <TimelineDealEvent key={`${event.type}:${event.id}`} event={event} />
          ),
        )}
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento ainda</p>
        )}
      </div>
    </div>
  );
}

function TimelineMessage({ event, chatId }: { event: ChatTimelineEvent; chatId: string }) {
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
  };
  const isCustomer = sender === "customer";
  const author =
    sender === "customer"
      ? "Cliente"
      : sender === "assistant"
        ? "IA"
        : event.payload.sentByUser?.name ?? "Atendente";

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${isCustomer ? "bg-white dark:bg-[#202c33]" : sender === "assistant" ? "bg-[#d9fdd3] dark:bg-[#005c4b]" : "bg-[#cfe9ff] dark:bg-[#1f4e7e]"}`}>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {sender === "assistant" ? <Bot className="h-3 w-3" /> : sender === "human_assistant" ? <UserCog className="h-3 w-3" /> : null}
          {author}
        </div>
        <MessageContent message={message} />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}

function TimelineDealEvent({ event }: { event: ChatTimelineEvent }) {
  let description = "Evento do negócio";
  if (event.type === "deal_created") {
    description = `Negócio criado em ${event.payload.stage?.name ?? "etapa inicial"}`;
  } else if (event.type === "stage_changed") {
    description = `${event.payload.fromStage?.name ?? "Entrada"} → ${event.payload.toStage?.name ?? "nova etapa"}`;
  } else if (event.type === "assignment_changed") {
    description = event.payload.assignedUser
      ? `Responsável alterado para ${event.payload.assignedUser.name}`
      : "Responsável removido";
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
