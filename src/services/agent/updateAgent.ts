import { UpdateAgentResquest } from "@/types/agent";
import { api } from "../api";

export const updateAgent = async (
  agentId: string,
  agentData: UpdateAgentResquest,
  workspaceId: string
): Promise<void> => {
  await api.put(`/assistant/${agentId}`, agentData, {
    params: {
      workspaceId,
    },
  });
};
