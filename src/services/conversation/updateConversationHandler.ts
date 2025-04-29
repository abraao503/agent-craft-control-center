import { api } from "@/services/api";

export const updateConversationHandler = async (
  conversationId: string,
  handledBy: "ai" | "human"
): Promise<string> => {
  await api.put(`chat/${conversationId}/handler`, {
    handler: handledBy === "ai" ? "assistant" : "human",
  });

  return handledBy;
};
