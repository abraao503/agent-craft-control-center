import { api } from "../api";

export interface DashboardIndicators {
  assistants: {
    total: number;
    active: number;
  };
  conversations: {
    total: number;
    todayNew: number;
  };
  messages: {
    total: number;
    todayNew: number;
  };
}

export interface GetIndicatorsParams {
  workspaceId: string;
  timezone?: string;
}

export const getIndicators = async ({
  workspaceId,
  timezone = "UTC"
}: GetIndicatorsParams): Promise<DashboardIndicators> => {
  const response = await api.get<DashboardIndicators>("/dashboard/indicators", {
    params: {
      workspaceId,
      timezone
    }
  });
  
  return response.data;
};
