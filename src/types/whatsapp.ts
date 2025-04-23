
export interface WhatsAppIntegration {
  id: string;
  name: string;
  provider: 'twilio' | 'zapi' | 'other';
  phoneNumber: string;
  status: 'active' | 'inactive' | 'pending';
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  // Z-API specific fields
  instanceApi?: string;
  token?: string;
  webhookUrl?: string;
}

export interface WhatsAppFormData {
  name: string;
  provider: 'twilio' | 'zapi' | 'other';
  phoneNumber: string;
  agentId: string;
  // Z-API specific fields
  instanceApi?: string;
  token?: string;
  webhookUrl?: string;
}
