import { api } from "@/services/api";
import {
  CreateOperationalChecklistTemplateParams,
  OperationalChecklistTemplate,
} from "@/types/operational-checklist";

export async function createOperationalChecklistTemplate(
  params: CreateOperationalChecklistTemplateParams,
): Promise<OperationalChecklistTemplate> {
  const { workspaceId, ...body } = params;
  const { data } = await api.post<OperationalChecklistTemplate>(
    `/operation/workspaces/${workspaceId}/checklist-templates`,
    body,
  );

  return data;
}
