import { api } from "@/services/api";
import { OperationalSetup } from "@/types/operation";

export async function getOperationalSetup(
  workspaceId: string,
): Promise<OperationalSetup> {
  const { data } = await api.get<OperationalSetup>(
    `/operation/workspaces/${workspaceId}/setup`,
  );

  return data;
}
