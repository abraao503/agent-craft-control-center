import { ListContentResponse } from "@/types/content";
import { api } from "../api";

export const listContent = async (
  workspaceId: string
): Promise<ListContentResponse> => {
  const response = await api.get<ListContentResponse>("/content/list", {
    params: {
      workspaceId,
    },
  });
  return response.data;
};
