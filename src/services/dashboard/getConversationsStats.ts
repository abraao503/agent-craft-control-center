import { api } from "../api";

export interface ConversationsStatsResponse {
  total: number;
  handledByAssistant: number;
  handledByHuman: number;
}

export interface GetConversationsStatsParams {
  workspaceId: string;
}

export const getConversationsStats = async ({
  workspaceId
}: GetConversationsStatsParams): Promise<ConversationsStatsResponse> => {
  const response = await api.get<ConversationsStatsResponse>("/dashboard/conversations-stats", {
    params: {
      workspaceId
    }
  });
  
  return response.data;
};
