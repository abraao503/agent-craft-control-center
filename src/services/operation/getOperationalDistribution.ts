import { api } from "@/services/api";
import { OperationalDistributionSettings } from "@/types/operation-distribution";

export async function getOperationalDistribution(
  workspaceId: string,
): Promise<OperationalDistributionSettings> {
  const { data } = await api.get<OperationalDistributionSettings>(
    `/operation/workspaces/${workspaceId}/distribution`,
  );

  return data;
}
