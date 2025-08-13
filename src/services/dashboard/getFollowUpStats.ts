import { api } from "../api";

export interface FollowUpStatsResponse {
  total: number;
  active: number;
  messagesThisWeek: number;
  messagesWithResponse: number;
}

export interface GetFollowUpStatsParams {
  workspaceId: string;
  timezone?: string;
}

export const getFollowUpStats = async ({
  workspaceId,
  timezone = "America/Sao_Paulo"
}: GetFollowUpStatsParams): Promise<FollowUpStatsResponse> => {
  const response = await api.get<FollowUpStatsResponse>("/dashboard/followup-stats", {
    params: {
      workspaceId,
      timezone
    }
  });
  
  return response.data;
};
