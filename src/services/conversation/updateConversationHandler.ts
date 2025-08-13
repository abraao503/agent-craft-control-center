import { api } from "@/services/api";

interface UpdateHandlerParams {
  handledBy: "ai" | "human";
}

export const updateConversationHandler = async (
  conversationId: string,
  params: UpdateHandlerParams,
  workspaceId?: string
): Promise<string> => {
  const { handledBy } = params;

  await api.put(`chat/${conversationId}/handler`, {
    handler: handledBy === "ai" ? "assistant" : "human",
    workspaceId,
  });

  return handledBy;
};
