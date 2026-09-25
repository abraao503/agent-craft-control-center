import { api } from "@/services/api";
import {
  OperationalChecklistTemplate,
  UpdateOperationalChecklistTemplateParams,
} from "@/types/operational-checklist";

export async function updateOperationalChecklistTemplate(
  params: UpdateOperationalChecklistTemplateParams,
): Promise<OperationalChecklistTemplate> {
  const { workspaceId, templateId, ...body } = params;
  const { data } = await api.patch<OperationalChecklistTemplate>(
    `/operation/workspaces/${workspaceId}/checklist-templates/${templateId}`,
    body,
  );

  return data;
}
