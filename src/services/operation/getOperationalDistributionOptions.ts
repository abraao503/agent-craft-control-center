import { api } from "@/services/api";
import { OperationalDistributionOptions } from "@/types/operation-distribution";

export async function getOperationalDistributionOptions(
  workspaceId: string,
): Promise<OperationalDistributionOptions> {
  const { data } = await api.get<OperationalDistributionOptions>(
    `/operation/workspaces/${workspaceId}/distribution/options`,
  );

  return data;
}
