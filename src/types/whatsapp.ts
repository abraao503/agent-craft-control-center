
export interface WhatsAppIntegration {
  id: string;
  name: string;
  agentId: string;
  phoneNumber: string;
  apiKey: string;
  createdAt: Date;
  webhookUrl: string;
  status: "active" | "inactive" | "pending";
  provider: "twilio" | "zapi" | "other";
  instanceApi: string;
}

export interface WhatsAppFormData {
  name?: string;
  provider: string;
  phoneNumber: string;
  agentId: string;
  instanceApi?: string;
  token?: string;
  webhookUrl?: string;
}
