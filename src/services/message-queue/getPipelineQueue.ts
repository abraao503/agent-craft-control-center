import { api } from "../api";
import { GetMessageQueueResponse } from "@/types/message-queue";

export const getPipelineQueue = async (
  pipelineId: string
): Promise<GetMessageQueueResponse> => {
  const { data } = await api.get<GetMessageQueueResponse>(
    `/pipeline/${pipelineId}/message-queue`
  );

  // Normalize dates
  return {
    queue: {
      ...data.queue,
      createdAt: new Date(data.queue.createdAt),
      updatedAt: new Date(data.queue.updatedAt),
    },
    pipeline: data.pipeline,
    totalMessages: data.totalMessages,
  };
};
