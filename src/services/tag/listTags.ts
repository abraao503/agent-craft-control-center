import { api } from "@/lib/api";
import { Tag } from "@/types/tag";

export const listTags = async (workspaceId: string): Promise<Tag[]> => {
  const response = await api.get("/tag", {
    params: { workspaceId }
  });
  return response.data;
};
