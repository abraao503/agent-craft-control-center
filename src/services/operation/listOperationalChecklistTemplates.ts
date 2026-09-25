import { api } from "@/services/api";
import { OperationalChecklistTemplate } from "@/types/operational-checklist";

export async function listOperationalChecklistTemplates(
  workspaceId: string,
): Promise<OperationalChecklistTemplate[]> {
  const { data } = await api.get<OperationalChecklistTemplate[]>(
    `/operation/workspaces/${workspaceId}/checklist-templates`,
  );

  return data;
}
