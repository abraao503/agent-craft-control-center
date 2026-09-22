import { api } from "@/services/api";
import {
  ArchiveOperationalChecklistTemplateParams,
  OperationalChecklistTemplate,
} from "@/types/operational-checklist";

export async function archiveOperationalChecklistTemplate(
  params: ArchiveOperationalChecklistTemplateParams,
): Promise<OperationalChecklistTemplate> {
  const { workspaceId, templateId, ...body } = params;
  const { data } = await api.post<OperationalChecklistTemplate>(
    `/operation/workspaces/${workspaceId}/checklist-templates/${templateId}/archive`,
    body,
  );

  return data;
}
