import { api } from "@/services/api";
import {
  OperationalChannelMigrationResult,
} from "@/types/operation-channels";

export async function createOperationalChannelMigration(params: {
  workspaceId: string;
  sourceChannelId: string;
  targetChannelId: string;
  reason?: string;
  idempotencyKey?: string;
}): Promise<OperationalChannelMigrationResult> {
  const { workspaceId, sourceChannelId, idempotencyKey, ...body } = params;
  const { data } = await api.post<OperationalChannelMigrationResult>(
    `/operation/workspaces/${workspaceId}/channels/${sourceChannelId}/migrations`,
    body,
    { headers: { "Idempotency-Key": idempotencyKey ?? crypto.randomUUID() } },
  );
  return data;
}
