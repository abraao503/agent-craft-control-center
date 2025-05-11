import { api } from "../api";

export const deleteAgent = async (assistantId: string): Promise<void> => {
  const selectedWorkspace = JSON.parse(
    localStorage.getItem("selectedWorkspace") || "{}"
  ) as { id: string };

  await api.delete(`/assistant/${assistantId}`, {
    params: {
      workspaceId: selectedWorkspace.id,
    },
  });
};
