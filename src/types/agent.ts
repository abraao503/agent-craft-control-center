export type AgentLanguage = "en-US" | "es-ES" | "pt-BR";

type Prompt = {
  identity: string;
  function: string;
  goal: string;
  style: string;
  instructions: string;
  blacklist: string | null;
  links: Link[] | null;
};

type CreateOrUpdateCustomField = {
  action: "createOrUpdate";
  fieldName: string;
  field: Omit<CustomField, "id">;
};

type DeleteCustomField = {
  action: "delete";
  fieldName: string;
};

export type UpdateAssistantCustomField =
  | CreateOrUpdateCustomField
  | DeleteCustomField;

export type AssistantContent = {
  action: "create" | "delete";
  contentId: string;
};

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "boolean";
  required: boolean;
}

export interface FullAgent {
  id: string;
  companyId: string;
  name: string;
  description: string;
  avatar: {
    id: string;
    url: string;
  } | null;
  timeZone: string;
  language: AgentLanguage;
  initialMessage: string;
  iaModel: {
    id: string;
    name: string;
  };
  prompt: {
    identity: string;
    function: string;
    goal: string;
    style: string;
    instructions: string;
    blacklist: string | null;
    links: Link[] | null;
  };
  contents: {
    id: string;
    name: string;
  }[];
  customFields: CustomField[];
  followUps: FollowUp[];
}

export interface Link {
  name: string;
  url: string;
}

export interface FollowUp {
  id?: string;
  name: string;
  description: string;
  delaySeconds: number;
  // Campos para UI apenas, não enviados para o backend
  days?: number;
  hours?: number;
  minutes?: number;
}

export type CreateFollowUp = {
  action: "create";
  followUp: {
    name: string;
    description: string;
    delaySeconds: number;
  };
};

export type UpdateFollowUp = {
  action: "update";
  followUpId: string;
  followUp: {
    name: string;
    description: string;
    delaySeconds: number;
  };
};

export type DeleteFollowUp = {
  action: "delete";
  followUpId: string;
};

export type UpdateFollowUpAction =
  | CreateFollowUp
  | UpdateFollowUp
  | DeleteFollowUp;

export interface AgentFormData {
  // Step 1: Basic Information
  name: string;
  description: string;
  avatarUrl?: string;
  timeZone: string;
  language: AgentLanguage;
  initialMessage: string;
  iaModelId: string;
  iaProviderApiKey: string;

  // Step 2: Prompt & Context
  identity: string;
  function: string;
  goal: string;
  style: string;
  instructions: string;
  blacklist: string | null;
  links: Link[] | null;

  // Step 3: Knowledge Content
  contents: {
    id: string;
    name: string;
  }[];

  // Step 4: Custom Fields
  customFields: (CustomField | Omit<CustomField, "id">)[];

  // Step 5: Follow Ups
  followUps: FollowUp[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface TimeZone {
  value: string;
  label: string;
}

export type Agent = {
  id: string;
  hasWhatsappIntegration: boolean;
  avatar: string | null;
  name: string;
  iaModelName: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAgentResponse = {
  agents: Agent[];
};

export type GetAgentResponse = FullAgent;

export type UpdateAgentResquest = {
  name: string;
  description: string;
  avatarFileId: string | null;
  timeZone: string;
  language: string;
  initialMessage: string;
  iaModelId: string;
  iaProviderApiKey: string;
  prompt: Prompt;
  contents: AssistantContent[];
  customFields: UpdateAssistantCustomField[];
  followUps: UpdateFollowUpAction[];
};

export type CreateAgentRequest = {
  name: string;
  description: string;
  avatarFileId: string | null;
  timeZone: string;
  language: string;
  initialMessage: string;
  iaModelId: string;
  iaProviderApiKey: string;
  prompt: Prompt;
  contentsIds: string[];
  customFields: Omit<CustomField, "id">[];
  followUps: FollowUp[];
  workspaceId: string;
};
