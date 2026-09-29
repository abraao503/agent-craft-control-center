import { api } from "@/services/api";
import type {
  CommercialMetaManualAccount,
  SaveCommercialMetaManualAccountParams,
} from "@/types/commercial-meta-manual-account";

export async function listCommercialMetaManualAccounts(
  workspaceId: string,
): Promise<CommercialMetaManualAccount[]> {
  const { data } = await api.get<CommercialMetaManualAccount[]>(
    `/meta-cloud/workspaces/${encodeURIComponent(workspaceId)}/manual-accounts`,
  );

  return data;
}

export async function saveCommercialMetaManualAccount(
  params: SaveCommercialMetaManualAccountParams,
): Promise<CommercialMetaManualAccount> {
  const { data } = await api.put<CommercialMetaManualAccount>(
    `/meta-cloud/workspaces/${encodeURIComponent(params.workspaceId)}/manual-accounts/${encodeURIComponent(params.wabaId)}`,
    params.body,
  );

  return data;
}
