import { UpdateAgentResquest } from "@/types/agent";
import { api } from "../api";

export const updateAgent = async (
  agentId: string,
  agentData: UpdateAgentResquest
): Promise<void> => {
  const selectedWorkspace = JSON.parse(
    localStorage.getItem("selectedWorkspace") || "{}"
  ) as { id: string };

  await api.put(`/assistant/${agentId}`, agentData, {
    params: {
      workspaceId: selectedWorkspace.id,
    },
  });
};
