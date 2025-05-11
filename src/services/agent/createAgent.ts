import { CreateAgentRequest } from "@/types/agent";
import { api } from "../api";

export const createAgent = async (
  agentData: CreateAgentRequest
): Promise<CreateAgentRequest> => {
  const selectedWorkspace = JSON.parse(
    localStorage.getItem("selectedWorkspace") || "{}"
  ) as { id: string };

  await api.post("assistant", agentData, {
    params: {
      workspaceId: selectedWorkspace.id,
    },
  });

  return agentData;
};
