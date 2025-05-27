import { api } from "@/services/api";
import {
  ConversationsFilters,
  ConversationsResponse,
} from "@/types/conversation";
import { Pagination } from "@/types/pagination";

type ApiResponse = Pagination<{
  id: string;
  lastInteraction: Date | null;
  customer: {
    id: string;
    phone: string;
  };
  assistant: {
    id: string;
    name: string;
  };
  totalMessages: number;
  handledBy: "assistant" | "human";
}>;

export const listConversations = async (
  filters: ConversationsFilters,
  workspaceId: string
): Promise<ConversationsResponse> => {
  const { data } = await api.get<ApiResponse>("/chat/list", {
    params: {
      ...filters,
      assistantId: filters.agentId,
      workspaceId,
    },
  });

  return {
    items: data.items.map((conversation) => ({
      ...conversation,
      agent: conversation.assistant,
      handledBy: conversation.handledBy === "assistant" ? "ai" : "human",
    })),
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
};
