import { api } from "../api";
import { MessageQueue } from "@/types/message-queue";

export const pausePipelineQueue = async (
  pipelineId: string
): Promise<MessageQueue> => {
  const { data } = await api.post<MessageQueue>(
    `/pipeline/${pipelineId}/message-queue/pause`
  );

  // Normalize dates
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};
