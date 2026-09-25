import { api } from "@/services/api";
import { OperationalChecklistPreference } from "@/types/operational-checklist";

export async function getOperationalChecklistPreference(
  workspaceId: string,
): Promise<OperationalChecklistPreference | null> {
  const { data } = await api.get<OperationalChecklistPreference | null>(
    `/operation/workspaces/${workspaceId}/checklist-preference`,
  );

  return data;
}
