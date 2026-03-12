import { api } from "@/services/api";
import { Tag } from "@/types/tag";

export interface PaginatedTagsResponse {
  items: Tag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListTagsPaginatedParams {
  workspaceId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const listTagsPaginated = async ({
  workspaceId,
  search,
  page = 1,
  limit = 10,
}: ListTagsPaginatedParams): Promise<PaginatedTagsResponse> => {
  const response = await api.get<PaginatedTagsResponse>("/tag", {
    params: { workspaceId, search, page, limit },
  });
  return response.data;
};
