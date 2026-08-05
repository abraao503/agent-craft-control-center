import { api } from "@/services/api";
import { Conversation } from "@/types/conversation";

type ApiResponse = {
  id: string;
  lastInteraction: Date | null;
  customer: {
    id: string;
    phone: string;
    name: string;
  };
  assistant: {
    id: string;
    name: string;
  } | null;
  totalMessages: number;
  handledBy: "assistant" | "human";
  primaryDeal: Conversation["primaryDeal"];
};

export const getConversationById = async (
  chatId: string,
  workspaceId: string
): Promise<Conversation> => {
  const { data } = await api.get<ApiResponse>(`/chat/${chatId}`, {
    params: {
      workspaceId,
    },
  });

  return {
    ...data,
    agent: data.assistant,
    handledBy: data.handledBy === "assistant" ? "ai" : "human",
  };
};
