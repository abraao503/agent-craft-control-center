import { api } from "@/services/api";

export const deleteTag = async (id: string, workspaceId: string): Promise<void> => {
  await api.delete(`/tag/${id}`, {
    params: { workspaceId }
  });
};
