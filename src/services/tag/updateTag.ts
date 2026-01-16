import { api } from "@/services/api";
import { Tag } from "@/types/tag";

type UpdateTagParams = {
  name: string;
  color: string;
  workspaceId: string;
};

export const updateTag = async (id: string, params: UpdateTagParams): Promise<Tag> => {
  const response = await api.put(`/tag/${id}`, params);
  return response.data;
};
