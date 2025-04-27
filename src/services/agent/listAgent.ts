import { ListAgentResponse } from "@/types/agent";
import { api } from "../api";

type ApiResponse = {
  assistants: ListAgentResponse["agents"];
};

export const listAgent = async (): Promise<ListAgentResponse> => {
  const response = await api.get<ApiResponse>("/assistant/list");
  return {
    agents: response.data.assistants,
  };
};
