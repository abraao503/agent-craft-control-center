import { ListAgentResponse } from "@/types/agent";
import { api } from "../api";

type ApiResponse = {
  assistants: ListAgentResponse["agents"];
};

export const listAgent = async (): Promise<ListAgentResponse> => {
  const selectedWorkspace = JSON.parse(
    localStorage.getItem("selectedWorkspace") || "{}"
  ) as { id: string };

  const response = await api.get<ApiResponse>("/assistant/list", {
    params: {
      workspaceId: selectedWorkspace.id,
    },
  });
  return {
    agents: response.data.assistants,
  };
};
