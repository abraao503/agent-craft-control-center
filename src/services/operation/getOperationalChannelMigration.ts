import { api } from "@/services/api";
import { OperationalChannelMigrationDetails } from "@/types/operation-channels";

export async function getOperationalChannelMigration(params: {
  workspaceId: string;
  migrationId: string;
}): Promise<OperationalChannelMigrationDetails> {
  const { data } = await api.get<OperationalChannelMigrationDetails>(
    "/operation/workspaces/" +
      params.workspaceId +
      "/channel-migrations/" +
      params.migrationId,
  );
  return data;
}
