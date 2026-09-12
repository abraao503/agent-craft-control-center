import { api } from "@/services/api";
import type { OperationalMetaManualAccount } from "@/types/operation-meta-manual-account";

export async function listOperationalMetaManualAccounts(
  workspaceId: string,
): Promise<OperationalMetaManualAccount[]> {
  const { data } = await api.get<OperationalMetaManualAccount[]>(
    `/operation/workspaces/${workspaceId}/channels/meta-cloud/manual-accounts`,
  );

  return data;
}
