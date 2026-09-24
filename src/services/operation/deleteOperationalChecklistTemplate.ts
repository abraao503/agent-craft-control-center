import { api } from "@/services/api";
import {
  DeleteOperationalChecklistTemplateParams,
  OperationalChecklistTemplate,
} from "@/types/operational-checklist";

export async function deleteOperationalChecklistTemplate(
  params: DeleteOperationalChecklistTemplateParams,
): Promise<OperationalChecklistTemplate> {
  const { workspaceId, templateId, expectedVersion } = params;
  const { data } = await api.delete<OperationalChecklistTemplate>(
    `/operation/workspaces/${workspaceId}/checklist-templates/${templateId}`,
    { data: { expectedVersion } },
  );

  return data;
}
