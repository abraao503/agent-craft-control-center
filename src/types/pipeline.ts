// Types for Sales Pipeline and Deals
// Comments in English as per project rules

import { WhatsAppIntegrationName } from "./whatsapp-integration";

export interface PipelineListItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  stagesCount: number;
  assistantId?: string | null;
  companyWhatsappIntegrationId?: string | null;
}

export interface AssistantAllowedTargetStage {
  targetStageOrder: number;
  targetStageId?: string;
  moveCondition: string;
}

export interface AssistantPipelineStage {
  assistantAllowedTargetStages: AssistantAllowedTargetStage[];
}

export interface CreatePipelineStageInput {
  name: string;
  description?: string;
  order: number; // integer >= 0
  color: string; // hex color string e.g. #FF0000
  winProbability: number; // 0-100
  assistantPipelineStage?: AssistantPipelineStage | null;
}

export interface WhatsAppIntegrationConfig {
  whatsappIntegrationName: WhatsAppIntegrationName;
  initialPipelineStageOrder: number;
  externalToken?: string;
  externalClientToken?: string;
  postbackUrl?: string;
}

export interface CreatePipelineInput {
  workspaceId: string; // UUID
  name: string;
  description?: string;
  stages: CreatePipelineStageInput[]; // at least 1
  assistant?: {
    name: string;
    description: string;
    avatarFileId: string | null;
    timeZone: string;
    language: string;
    skipMessages: string[];
    iaModelId: string;
    iaProviderApiKey: string;
    prompt: {
      function: string;
      style: string;
      instructions: string;
      blacklist: string | null;
      links: { name: string; url: string }[] | null;
    };
    contentsIds: string[];
    customFields: unknown[];
    entryTags: string[];
  } | null;
  assistantId?: string | null; // DEPRECATED: UUID of assistant to use in this pipeline (for backwards compatibility)
  whatsappIntegration?: WhatsAppIntegrationConfig | null;
}

export interface CreatePipelineResponse {
  id: string;
}

export interface PipelineStageMinimal {
  id: string;
  name: string;
  order?: number;
  // Optional fields if backend provides more data
  color?: string;
  winProbability?: number;
  assistantPipelineStage?: AssistantPipelineStage | null;
}
