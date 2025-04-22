
export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  required: boolean;
}

export interface Agent {
  id: string;
  name: string;
  internalName: string;
  description: string;
  avatarUrl?: string;
  timeZone: string;
  language: string;
  initialMessage: string;
  iaModelId: string;
  prompt: {
    description: string;
    goal: string;
    habilities: string;
    companyName: string;
    companySite: string;
    companyDescription: string;
    companySector: string;
  };
  contentsIds: string[];
  customFields: CustomField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentFormData {
  // Step 1: Basic Information
  name: string;
  internalName: string;
  description: string;
  avatarUrl?: string;
  timeZone: string;
  language: string;
  initialMessage: string;
  iaModelId: string;
  
  // Step 2: Prompt & Context
  promptDescription: string;
  goal: string;
  habilities: string;
  companyName: string;
  companySite: string;
  companyDescription: string;
  companySector: string;
  
  // Step 3: Knowledge Content
  contentsIds: string[];
  
  // Step 4: Custom Fields
  customFields: CustomField[];
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
