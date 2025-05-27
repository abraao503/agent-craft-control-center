import { api } from "../api";

export const deleteAgent = async (
  assistantId: string,
  workspaceId: string
): Promise<void> => {
  await api.delete(`/assistant/${assistantId}`, {
    params: {
      workspaceId,
    },
  });
};
