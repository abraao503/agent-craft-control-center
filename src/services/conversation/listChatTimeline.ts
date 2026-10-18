import { api } from "@/services/api";
import { ChatTimelineResponse } from "@/types/chat-timeline";

export async function listChatTimeline(params: {
  chatId: string;
  page: number;
  limit?: number;
  aroundMessageId?: string;
  signal?: AbortSignal;
}): Promise<ChatTimelineResponse> {
  const { chatId, signal, ...queryParams } = params;
  const { data } = await api.get<ChatTimelineResponse>(
    `/chat/${chatId}/timeline`,
    { params: { ...queryParams, limit: params.limit ?? 50 }, signal },
  );

  return data;
}
