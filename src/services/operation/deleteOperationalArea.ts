import { api } from "@/services/api";
import { DeleteOperationalAreaParams } from "@/types/operation";

export async function deleteOperationalArea(
  params: DeleteOperationalAreaParams,
): Promise<void> {
  const { workspaceId, areaId, expectedVersion } = params;
  await api.delete(
    `/operation/workspaces/${workspaceId}/areas/${areaId}`,
    { params: { expectedVersion } },
  );
}
