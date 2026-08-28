import { api } from "@/services/api";
import { DeleteOperationalAreaMembershipParams } from "@/types/operation";

export async function deleteOperationalAreaMembership(
  params: DeleteOperationalAreaMembershipParams,
): Promise<void> {
  const { workspaceId, areaId, userId, expectedVersion } = params;
  await api.delete(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/members/${userId}`,
    {
      params: {
        ...(expectedVersion !== undefined && { expectedVersion }),
      },
    },
  );
}
