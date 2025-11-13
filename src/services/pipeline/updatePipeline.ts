import { api } from "../api";
import {
  AssistantPipelineStage,
  WhatsAppIntegrationConfig,
} from "@/types/pipeline";

// Item structure for updating existing stages within a pipeline
export interface UpdatePipelineStageItem {
  id?: string; // Optional for new stages
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
  assistant?: {
    name: string;
    description: string;
    avatarFileId: string | null;
    timeZone: string;
    language: string;
    initialMessage: string;
    skipMessages: string[];
    iaModelId: string;
    iaProviderApiKey: string;
    prompt: {
      identity: string;
      function: string;
      goal: string;
      style: string;
      instructions: string;
      blacklist: string | null;
      links: { name: string; url: string }[] | null;
    };
    contentsIds: string[];
    customFields: unknown[];
    entryTags: string[];
  } | null;
  assistantId?: string | null; // DEPRECATED: for backwards compatibility
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
