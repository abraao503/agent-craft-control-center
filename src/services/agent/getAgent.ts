import { GetAgentResponse } from "@/types/agent";
import { api } from "../api";

export const getAgent = async (
  assistantId: string,
  workspaceId: string
): Promise<GetAgentResponse> => {
  const response = await api.get<GetAgentResponse>(
    `/assistant/${assistantId}`,
    {
      params: {
        workspaceId,
      },
    }
  );

  return response.data;
};
