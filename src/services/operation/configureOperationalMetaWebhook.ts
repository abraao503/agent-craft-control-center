import { api } from "@/services/api";
import type {
  ConfigureOperationalMetaWebhookData,
  ConfigureOperationalMetaWebhookParams,
} from "@/types/operation-meta-manual-account";

export async function configureOperationalMetaWebhook(
  params: ConfigureOperationalMetaWebhookParams,
): Promise<ConfigureOperationalMetaWebhookData> {
  const { data } = await api.post<ConfigureOperationalMetaWebhookData>(
    `/operation/workspaces/${params.workspaceId}/channels/meta-cloud/manual-accounts/${encodeURIComponent(params.wabaId)}/webhook`,
  );

  return data;
}
