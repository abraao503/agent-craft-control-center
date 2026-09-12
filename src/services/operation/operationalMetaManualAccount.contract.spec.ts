import { configureOperationalMetaWebhook } from "@/services/operation/configureOperationalMetaWebhook";
import { listOperationalMetaManualAccounts } from "@/services/operation/listOperationalMetaManualAccounts";
import { saveOperationalMetaManualAccount } from "@/services/operation/saveOperationalMetaManualAccount";
import type {
  ConfigureOperationalMetaWebhookData,
  OperationalMetaManualAccount,
  SaveOperationalMetaManualAccountBody,
} from "@/types/operation-meta-manual-account";

const workspaceId = "00000000-0000-0000-0000-000000000000";
const wabaId = "000000000000000";

const credentials: SaveOperationalMetaManualAccountBody = {
  appId: "app-id",
  appSecret: "app-secret",
  accessToken: "access-token",
};

async function operationalMetaManualAccountHttpContract(): Promise<void> {
  const accounts: OperationalMetaManualAccount[] =
    await listOperationalMetaManualAccounts(workspaceId);
  const saved: OperationalMetaManualAccount =
    await saveOperationalMetaManualAccount({ workspaceId, wabaId, body: credentials });
  const webhook: ConfigureOperationalMetaWebhookData =
    await configureOperationalMetaWebhook({ workspaceId, wabaId });

  void accounts;
  void saved;
  void webhook;
}

void operationalMetaManualAccountHttpContract;
