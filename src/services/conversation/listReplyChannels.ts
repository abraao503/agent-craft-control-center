import { api } from "@/services/api";
import { ReplyChannelsResponse } from "@/types/reply-channel";

export async function listReplyChannels(
  chatId: string,
): Promise<ReplyChannelsResponse> {
  const { data } = await api.get<ReplyChannelsResponse>(
    `/chat/${chatId}/reply-channels`,
  );

  return data;
}
