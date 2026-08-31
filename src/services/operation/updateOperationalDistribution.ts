import { api } from "@/services/api";
import {
  OperationalDistributionSettings,
  UpdateOperationalDistributionParams,
} from "@/types/operation-distribution";

export async function updateOperationalDistribution(
  params: UpdateOperationalDistributionParams,
): Promise<OperationalDistributionSettings> {
  const { data } = await api.put<OperationalDistributionSettings>(
    `/operation/workspaces/${params.workspaceId}/distribution`,
    params.body,
  );

  return data;
}
