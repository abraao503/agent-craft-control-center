import { api } from "@/services/api";
import {
  OperationalChannelMigrationPreview,
} from "@/types/operation-channels";

export async function previewOperationalChannelMigration(params: {
  workspaceId: string;
  sourceChannelId: string;
  targetChannelId: string;
}): Promise<OperationalChannelMigrationPreview> {
  const { data } = await api.get<OperationalChannelMigrationPreview>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.sourceChannelId}/migration-preview`,
    { params: { targetChannelId: params.targetChannelId } },
  );
  return data;
}
