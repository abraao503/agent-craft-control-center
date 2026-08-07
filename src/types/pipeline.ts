// Types for Sales Pipeline and Deals
// Comments in English as per project rules

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
  id?: string;
  targetStageOrder: number;
  targetStageId?: string;
  moveCondition?: string;
  matchMode?: "ALL" | "ANY";
  criteria?: string[];
  exceptions?: string[];
  positiveExamples?: string[];
  negativeExamples?: string[];
  priority?: number;
  requiresExplicitConfirmation?: boolean;
}

export interface AssistantPipelineStage {
  canCreateFollowUp?: boolean;
  assistantAllowedTargetStages: AssistantAllowedTargetStage[];
}

/**
 * IMPORTANTE: No backend este recurso é chamado de "reengagementConfig"
 * mas no frontend chamamos de "Follow-up" para melhor UX
 *
 * API: reengagementConfig em pipeline stages
 */

// Type aliases para melhor legibilidade no frontend
export type FollowUpConfig = ReengagementConfig;
export type FollowUpConfigInput = ReengagementConfigInput;

export interface ReengagementConfig {
  id?: string; // Present when fetched from API
  minInactiveChatTimeHours: number; // >= 1
  maxMessages: number; // >= 1
  messagingIntervalHours?: number; // Returned by API
  messages: string[]; // min 1 item, each item min 1 char
  includeTags: string[]; // UUIDs of tags to include (empty = all deals)
  excludeTags: string[]; // UUIDs of tags to exclude
  isActive: boolean; // default: true
  startTime?: string; // optional, ISO 8601 datetime string
  endTime?: string; // optional, ISO 8601 datetime string
  // Media fields resolved by backend (read-only, returned on GET)
  mediaUrl?: string | null;
  mediaMimetype?: string | null;
  mediaType?: "image" | "audio" | "document" | null;
  // Used when building request payload — set by ReengagementConfigSection
  mediaFileId?: string | null;
  configurationState?: "READY" | "REQUIRES_TEMPLATE";
  metaTemplateId?: string | null;
  metaTemplateLanguage?: string | null;
  metaTemplateBindings?: Record<string, unknown>;
}

export interface ReengagementConfigInput {
  minInactiveChatTimeHours: number; // >= 1
  maxMessages: number; // >= 1
  messages: string[]; // min 1 item, each item min 1 char
  includeTags?: string[]; // optional, array of UUIDs, default: []
  excludeTags?: string[]; // optional, array of UUIDs, default: []
  isActive?: boolean; // optional, default: true
  startTime?: string; // optional, ISO 8601 datetime string (e.g., "2024-01-15T08:00:00.000Z")
  endTime?: string; // optional, ISO 8601 datetime string (e.g., "2024-01-15T17:00:00.000Z")
  mediaFileId?: string | null; // UUID returned by POST /file/media/upload
  metaTemplateId?: string | null;
  metaTemplateLanguage?: string | null;
  metaTemplateBindings?: Record<string, unknown>;
}

export interface CreatePipelineStageInput {
  name: string;
  description?: string;
  order: number; // integer >= 0
  color: string; // hex color string e.g. #FF0000
  winProbability: number; // 0-100
  assistantPipelineStage?: AssistantPipelineStage | null;
  reengagementConfig?: ReengagementConfigInput | null;
}

export type LegacyWhatsAppIntegrationConfig =
  | {
      whatsappIntegrationName: "evolux";
      initialPipelineStageOrder: number;
    }
  | {
      whatsappIntegrationName: "z-api";
      initialPipelineStageOrder: number;
      externalToken: string;
      externalClientToken: string;
      postbackUrl: string;
    };

/** Meta Cloud is configured through its pipeline-scoped endpoint, never here. */
export type WhatsAppIntegrationConfig = LegacyWhatsAppIntegrationConfig;

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
    googleCalendarIntegrationId?: string | null;
    transitionDecisionMode?: "CONVERSATIONAL" | "DEDICATED";
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
  reengagementConfig?: ReengagementConfig | null;
}
