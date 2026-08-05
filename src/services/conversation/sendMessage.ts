import { api } from "@/services/api";
import { Message, SendMessageParams } from "@/types/message";

export const sendMessage = async (
  params: SendMessageParams,
): Promise<Message> => {
  const { data } = await api.post<Message>(`/chat/${params.chatId}/message`, {
    message: params.message,
    clientMessageId: crypto.randomUUID(),
    assistantId: params.agentId,
  });

  return data;
};
