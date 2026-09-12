import { api } from "@/services/api";
import type {
  OperationalMetaManualAccount,
  SaveOperationalMetaManualAccountParams,
} from "@/types/operation-meta-manual-account";

export async function saveOperationalMetaManualAccount(
  params: SaveOperationalMetaManualAccountParams,
): Promise<OperationalMetaManualAccount> {
  const { data } = await api.put<OperationalMetaManualAccount>(
    `/operation/workspaces/${params.workspaceId}/channels/meta-cloud/manual-accounts/${encodeURIComponent(params.wabaId)}`,
    params.body,
  );

  return data;
}
