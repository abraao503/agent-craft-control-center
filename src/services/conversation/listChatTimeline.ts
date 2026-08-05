import { api } from "@/services/api";
import { ChatTimelineResponse } from "@/types/chat-timeline";

export async function listChatTimeline(params: {
  chatId: string;
  page: number;
  limit?: number;
}): Promise<ChatTimelineResponse> {
  const { data } = await api.get<ChatTimelineResponse>(
    `/chat/${params.chatId}/timeline`,
    { params: { page: params.page, limit: params.limit ?? 50 } },
  );

  return data;
}
