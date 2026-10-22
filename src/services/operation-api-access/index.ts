import { api } from "@/services/api";
import type {
  CreateOperationalApiKeyResponse,
  OperationalApiKeyList,
} from "@/types/operational-api-access";

const apiKeysPath = (workspaceId: string) =>
  `/operation/workspaces/${workspaceId}/api-keys`;

export async function listOperationalApiKeys(
  workspaceId: string,
  params: { page?: number; limit?: number } = {},
): Promise<OperationalApiKeyList> {
  const { data } = await api.get<OperationalApiKeyList>(
    apiKeysPath(workspaceId),
    { params },
  );

  return data;
}

export async function createOperationalApiKey(
  workspaceId: string,
  name: string,
): Promise<CreateOperationalApiKeyResponse> {
  const { data } = await api.post<CreateOperationalApiKeyResponse>(
    apiKeysPath(workspaceId),
    { name },
  );

  return data;
}

export async function revokeOperationalApiKey(
  workspaceId: string,
  apiKeyId: string,
): Promise<void> {
  await api.delete(`${apiKeysPath(workspaceId)}/${apiKeyId}`);
}
