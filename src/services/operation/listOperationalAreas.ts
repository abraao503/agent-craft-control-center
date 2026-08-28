import { api } from "@/services/api";
import { OperationalAreasPage } from "@/types/operation";

export async function listOperationalAreas(
  workspaceId: string,
  page = 1,
  limit = 100,
): Promise<OperationalAreasPage> {
  const { data } = await api.get<OperationalAreasPage>(
    `/operation/workspaces/${workspaceId}/areas`,
    { params: { page, limit } },
  );

  return data;
}
