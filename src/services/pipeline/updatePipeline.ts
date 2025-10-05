import { api } from "../api";
import { AssistantPipelineStage, WhatsAppIntegrationConfig } from "@/types/pipeline";

// Item structure for updating existing stages within a pipeline
export interface UpdatePipelineStageItem {
  id: string;
  name?: string;
  description?: string | null;
  order: number;
  color?: string;
  winProbability?: number; // 0-100
  assistantPipelineStage?: AssistantPipelineStage | null;
}

export interface UpdatePipelineInput {
  workspaceId: string;
  name?: string;
  description?: string | null;
  stages?: UpdatePipelineStageItem[];
  assistantId?: string | null;
  whatsappIntegration?: WhatsAppIntegrationConfig | null;
}

export const updatePipeline = async (
  pipelineId: string,
  payload: UpdatePipelineInput
): Promise<{ message: string }> => {
  const { workspaceId, ...body } = payload;
  const { data } = await api.patch<{ message: string }>(
    `/pipeline/${pipelineId}`,
    body,
    {
      params: { workspaceId },
    }
  );
  return data;
};
