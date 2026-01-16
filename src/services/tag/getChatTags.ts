import { api } from "@/services/api";
import { Tag } from "@/types/tag";

export const getChatTags = async (chatId: string, workspaceId: string): Promise<Tag[]> => {
  const response = await api.get<Tag[]>(`/chat/${chatId}/tags`, {
    params: { workspaceId }
  });
  return response.data || [];
};
