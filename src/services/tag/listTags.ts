import { api } from "@/services/api";
import { Tag } from "@/types/tag";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const listTags = async (workspaceId: string, search?: string): Promise<Tag[]> => {
  const response = await api.get<PaginatedResponse<Tag>>("/tag", {
    params: { workspaceId, search, limit: 100 }
  });
  return response.data.items || [];
};
