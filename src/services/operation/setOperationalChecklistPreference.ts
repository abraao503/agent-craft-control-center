import { api } from "@/services/api";
import {
  OperationalChecklistPreference,
  SetOperationalChecklistPreferenceParams,
} from "@/types/operational-checklist";

export async function setOperationalChecklistPreference(
  params: SetOperationalChecklistPreferenceParams,
): Promise<OperationalChecklistPreference> {
  const { workspaceId, templateId } = params;
  const { data } = await api.put<OperationalChecklistPreference>(
    `/operation/workspaces/${workspaceId}/checklist-preference`,
    { templateId },
  );

  return data;
}
