import { api } from "@/lib/api";

export const clearConversationExternalId = async (chatId: string) => {
  const response = await api.patch(`/chat/${chatId}/external-id`);
  return response.data;
};
