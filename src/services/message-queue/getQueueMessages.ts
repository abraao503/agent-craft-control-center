import { api } from "../api";
import { Pagination } from "@/types/pagination";
import { QueuedMessage, GetQueueMessagesParams } from "@/types/message-queue";

export const getQueueMessages = async (
  messageQueueId: string,
  params: GetQueueMessagesParams = {}
): Promise<Pagination<QueuedMessage>> => {
  const { data } = await api.get<Pagination<QueuedMessage>>(
    `/pipeline/message-queue/${messageQueueId}/messages`,
    { params }
  );

  // Normalize dates
  return {
    ...data,
    items: data.items.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt),
      sendAt: message.sendAt ? new Date(message.sendAt) : null,
    })),
  };
};
