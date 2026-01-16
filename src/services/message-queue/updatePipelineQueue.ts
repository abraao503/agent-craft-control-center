import { api } from "../api";
import { MessageQueue, UpdateMessageQueueParams } from "@/types/message-queue";

export const updatePipelineQueue = async (
  pipelineId: string,
  params: UpdateMessageQueueParams
): Promise<MessageQueue> => {
  const { data } = await api.patch<MessageQueue>(
    `/pipeline/${pipelineId}/message-queue`,
    params
  );

  // Normalize dates
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};
