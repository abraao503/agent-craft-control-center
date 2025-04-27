
export interface WhatsAppIntegration {
  id: string;
  name: string;
  phoneNumber: string;
  agentId?: string;
  apiKey?: string;
  createdAt?: Date;
  webhookUrl?: string;
  status?: 'active' | 'inactive';
  instanceApi?: string;
  token?: string;
}

export interface WhatsAppFormData {
  name: string;
  phoneNumber: string;
  agentId?: string;
  apiKey?: string;
  webhookUrl?: string;
  instanceApi?: string;
  token?: string;
}

export interface WhatsAppFilterOption {
  value: string;
  label: string;
}
