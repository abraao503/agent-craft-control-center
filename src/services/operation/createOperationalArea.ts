import { api } from "@/services/api";
import {
  CreateOperationalAreaParams,
  ServiceArea,
} from "@/types/operation";

export async function createOperationalArea(
  params: CreateOperationalAreaParams,
): Promise<ServiceArea> {
  const { workspaceId, ...body } = params;
  const { data } = await api.post<ServiceArea>(
    `/operation/workspaces/${workspaceId}/areas`,
    body,
  );

  return data;
}
