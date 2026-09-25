import { api } from "@/services/api";

export async function clearOperationalChecklistPreference(
  workspaceId: string,
): Promise<void> {
  await api.delete(`/operation/workspaces/${workspaceId}/checklist-preference`);
}
