import { api } from "@/services/api";
import {
  AreaMembership,
  UpsertOperationalAreaMembershipParams,
} from "@/types/operation";

export async function upsertOperationalAreaMembership(
  params: UpsertOperationalAreaMembershipParams,
): Promise<AreaMembership> {
  const { workspaceId, areaId, userId, role, expectedVersion } = params;
  const { data } = await api.put<AreaMembership>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/members/${userId}`,
    {
      role,
      ...(expectedVersion !== undefined && { expectedVersion }),
    },
  );

  return data;
}
