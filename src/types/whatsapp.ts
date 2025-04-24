
export interface WhatsAppIntegration {
  id: string;
  agentId: string;
  phoneNumber: string;
  apiKey: string;
  createdAt: Date;
}

export interface WhatsAppFormData {
  name?: string;
  provider: string;
  phoneNumber: string;
  agentId: string;
}
