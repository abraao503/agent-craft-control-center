import { api } from "@/services/api";
import { OperationalAreaMembershipsPage } from "@/types/operation";

export async function listOperationalAreaMemberships(
  workspaceId: string,
  areaId: string,
  page = 1,
  limit = 100,
): Promise<OperationalAreaMembershipsPage> {
  const { data } = await api.get<OperationalAreaMembershipsPage>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/members`,
    { params: { page, limit } },
  );

  return data;
}
