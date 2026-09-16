import { api } from "@/services/api";
import {
  ServiceArea,
  UpdateOperationalAreaParams,
} from "@/types/operation";

export async function updateOperationalArea(
  params: UpdateOperationalAreaParams,
): Promise<ServiceArea> {
  const { workspaceId, areaId, ...body } = params;
  const { data } = await api.patch<ServiceArea>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}`,
    body,
  );

  return data;
}
