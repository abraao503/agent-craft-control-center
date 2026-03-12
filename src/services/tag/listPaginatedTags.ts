import { api } from "@/services/api";
import { Tag } from "@/types/tag";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListPaginatedTagsParams {
  workspaceId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const listPaginatedTags = async ({
  workspaceId,
  page = 1,
  limit = 20,
  search,
}: ListPaginatedTagsParams): Promise<PaginatedResponse<Tag>> => {
  const response = await api.get<PaginatedResponse<Tag>>("/tag", {
    params: { workspaceId, page, limit, search },
  });
  return response.data;
};
