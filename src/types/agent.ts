export type AgentLanguage = "en-US" | "es-ES" | "pt-BR";

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
    description: string;
    goal: string;
    habilities: string;
    companyName: string;
    companySite: string;
    companyDescription: string;
    companySector: string;
  };
  contents: {
    id: string;
    name: string;
  }[];
  customFields: CustomField[];
}

export interface AgentFormData {
  // Step 1: Basic Information
  name: string;
  description: string;
  avatarUrl?: string;
  timeZone: string;
  language: AgentLanguage;
  initialMessage: string;
  iaModelId: string;

  // Step 2: Prompt & Context
  promptDescription: string;
  goal: string;
  companyName: string;
  companySite: string;
  companyDescription: string;
  companySector: string;

  // Step 3: Knowledge Content
  contents: {
    id: string;
    name: string;
  }[];

  // Step 4: Custom Fields
  customFields: (CustomField | Omit<CustomField, "id">)[];
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
  prompt: {
    description: string;
    goal: string;
    companyName: string;
    companySite?: string;
    companyDescription?: string;
    companySector?: string;
  };
  contents: AssistantContent[];
  customFields: UpdateAssistantCustomField[];
};

export type CreateAgentRequest = {
  name: string;
  description: string;
  avatarFileId: string | null;
  timeZone: string;
  language: string;
  initialMessage: string;
  iaModelId: string;
  prompt: {
    description: string;
    goal: string;
    companyName: string;
    companySite?: string;
    companyDescription?: string;
    companySector?: string;
  };
  contentsIds: string[];
  customFields: Omit<CustomField, "id">[];
};
