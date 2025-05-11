import { GetAgentResponse } from "@/types/agent";
import { api } from "../api";

export const getAgent = async (
  assistantId: string
): Promise<GetAgentResponse> => {
  const selectedWorkspace = JSON.parse(
    localStorage.getItem("selectedWorkspace") || "{}"
  ) as { id: string };

  const response = await api.get<GetAgentResponse>(
    `/assistant/${assistantId}`,
    {
      params: {
        workspaceId: selectedWorkspace.id,
      },
    }
  );

  return response.data;
};
