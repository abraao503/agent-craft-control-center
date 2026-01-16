import { api } from "../api";
import { MessageQueue } from "@/types/message-queue";

export const resumePipelineQueue = async (
  pipelineId: string
): Promise<MessageQueue> => {
  const { data } = await api.post<MessageQueue>(
    `/pipeline/${pipelineId}/message-queue/resume`
  );

  // Normalize dates
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};
