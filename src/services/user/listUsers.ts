import { api } from "../api";
import { ListUsersParams, ListUsersResponse } from "@/types/user";

export async function listUsers(
  params: ListUsersParams
): Promise<ListUsersResponse> {
  const { data } = await api.get<ListUsersResponse>("/user", {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search,
      workspaceId: params.workspaceId,
      companyId: params.companyId, // PLATFORM_ADMIN can filter by company
    },
  });
  return data;
}
