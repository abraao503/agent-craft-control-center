import { Pagination } from "@/types/pagination";
import { api } from "../api";
import { FollowUp, QueuedMessage } from "@/types/follow-up";

// Follow-Up Services
export type FollowUpData = {
  name: string;
  messages: string[];
  inactiveChatTime: number;
  maxMessages?: number;
  workspaceId: string;
  assistantId: string;
  inclusiveTags?: string[];
  exclusiveTags?: string[];
  responseTags?: string[];
};

export const createFollowUp = async (data: FollowUpData) => {
  const response = await api.post("/follow-up", data);
  return response.data;
};

export const getFollowUpById = async (id: string) => {
  const response = await api.get<FollowUp>(`/follow-up/${id}`);
  return response.data;
};

export const listFollowUps = async (params: {
  workspaceId: string;
  assistantId?: string;
}) => {
  const response = await api.get("/follow-up", { params });
  return response.data;
};

export type FollowUpUpdateData = Partial<Omit<FollowUpData, 'workspaceId'>>;

export const updateFollowUp = async (
  id: string,
  data: FollowUpUpdateData
) => {
  const response = await api.put(`/follow-up/${id}`, data);
  return response.data;
};

export const deleteFollowUp = async (id: string) => {
  const response = await api.delete(`/follow-up/${id}`);
  return response.data;
};

// Message Queue Services
export const getMessageQueueById = async (id: string) => {
  const response = await api.get(`/message-queue/${id}`);
  return response.data;
};

export const updateMessageQueue = async (
  id: string,
  data: { isActive: boolean; delaySeconds: number }
) => {
  const response = await api.put(`/message-queue/${id}`, data);
  return response.data;
};

export const listMessageQueues = async (params: {
  companyId?: string;
  workspaceId: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/message-queue", { params });
  return response.data;
};

// Queued Message Services
export const listQueuedMessages = async (params: {
  messageQueueId: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<Pagination<QueuedMessage>>("/queued-message", {
    params,
  });

  return response.data;
};
