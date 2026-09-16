export type OperationalAssistantLanguage = "pt-BR" | "en-US" | "es-ES";

export type OperationalAssistantContextWindowTurns = 10 | 20 | 40;

export type OperationalAssistantResponseProfile =
  | "fast"
  | "balanced"
  | "deep";

export interface OperationalAssistantPromptLink {
  name: string;
  url: string;
}

export interface OperationalAssistantPrompt {
  function: string;
  style: string;
  instructions: string;
  blacklist: string | null;
  links: OperationalAssistantPromptLink[] | null;
}

export interface OperationalAssistantSummary {
  id: string;
  name: string;
  active: boolean;
  avatarUrl: string | null;
  providerCredentialConfigured: boolean;
}

export interface OperationalAssistantOption {
  id: string;
  name: string;
  active: boolean;
  avatarUrl: string | null;
}

export interface OperationalAssistantDetails
  extends OperationalAssistantSummary {
  description: string;
  timeZone: string;
  language: OperationalAssistantLanguage;
  iaModel: {
    id: string;
    name: string;
    provider: "OPENAI" | "ANTHROPIC";
  };
  prompt: OperationalAssistantPrompt;
  contents: Array<{
    id: string;
    name: string;
  }>;
  openAiTranscriptionCredentialConfigured: boolean;
  audioTranscriptionEnabled: boolean;
  contextWindowTurns: OperationalAssistantContextWindowTurns;
  claudeResponseProfile: OperationalAssistantResponseProfile;
  createdAt: string;
  updatedAt: string;
}

interface OperationalAssistantCommonBody {
  name: string;
  description: string;
  avatarFileId: string | null;
  timeZone: string;
  language: OperationalAssistantLanguage;
  iaModelId: string;
  prompt: OperationalAssistantPrompt;
  contentIds: string[];
  audioTranscriptionEnabled?: boolean;
  contextWindowTurns?: OperationalAssistantContextWindowTurns;
  claudeResponseProfile?: OperationalAssistantResponseProfile;
}

export interface OperationalAssistantCreateBody
  extends OperationalAssistantCommonBody {
  providerCredential: string;
  openAiTranscriptionCredential?: string;
}

export interface OperationalAssistantUpdateBody
  extends OperationalAssistantCommonBody {
  providerCredential?: string;
  openAiTranscriptionCredential?: string;
}

export interface CreateOperationalAssistantParams {
  workspaceId: string;
  body: OperationalAssistantCreateBody;
  idempotencyKey?: string;
}

export interface UpdateOperationalAssistantParams {
  workspaceId: string;
  assistantId: string;
  body: OperationalAssistantUpdateBody;
}

export interface DeleteOperationalAssistantParams {
  workspaceId: string;
  assistantId: string;
}

export interface OperationalClaraConfiguration {
  enabled: boolean;
  baseUrl: string | null;
  credentialConfigured: boolean;
  timeoutMs: number;
  maxAttempts: number;
  version: number;
  updatedAt: string | null;
}

export interface UpdateOperationalClaraConfigurationBody {
  enabled: boolean;
  baseUrl?: string | null;
  credential?: string;
  clearCredential?: boolean;
  timeoutMs: number;
  maxAttempts: number;
  expectedVersion: number;
}
