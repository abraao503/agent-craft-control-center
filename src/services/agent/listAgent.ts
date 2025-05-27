import { ListAgentResponse } from "@/types/agent";
import { api } from "../api";

type ApiResponse = {
  assistants: ListAgentResponse["agents"];
};

export const listAgent = async (
  workspaceId: string
): Promise<ListAgentResponse> => {
  const response = await api.get<ApiResponse>("/assistant/list", {
    params: {
      workspaceId,
    },
  });
  return {
    agents: response.data.assistants,
  };
};
