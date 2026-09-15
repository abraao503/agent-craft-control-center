import { api } from "@/services/api";
import { ServiceArea } from "@/types/operation";

export async function getOperationalArea(
  workspaceId: string,
  areaId: string,
): Promise<ServiceArea> {
  const { data } = await api.get<ServiceArea>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}`,
  );

  return data;
}
