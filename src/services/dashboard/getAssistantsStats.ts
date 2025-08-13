import { api } from "../api";

export interface AssistantStats {
  id: string;
  name: string;
  totalConversations: number;
  isActive: boolean;
}

export interface AssistantsStatsResponse {
  assistants: AssistantStats[];
}

export interface GetAssistantsStatsParams {
  workspaceId: string;
}

export const getAssistantsStats = async ({
  workspaceId
}: GetAssistantsStatsParams): Promise<AssistantsStatsResponse> => {
  const response = await api.get<AssistantsStatsResponse>("/dashboard/assistants-stats", {
    params: {
      workspaceId
    }
  });
  
  return response.data;
};
