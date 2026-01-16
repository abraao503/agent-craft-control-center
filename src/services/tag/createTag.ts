import { api } from "@/services/api";
import { Tag } from "@/types/tag";

type CreateTagParams = {
  name: string;
  color: string;
  workspaceId: string;
};

export const createTag = async (params: CreateTagParams): Promise<Tag> => {
  const response = await api.post("/tag", params);
  return response.data;
};
