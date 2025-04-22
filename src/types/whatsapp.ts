
export interface WhatsAppIntegration {
  id: string;
  name: string;
  provider: 'twilio' | 'zapi' | 'other';
  phoneNumber: string;
  status: 'active' | 'inactive' | 'pending';
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppFormData {
  name: string;
  provider: 'twilio' | 'zapi' | 'other';
  phoneNumber: string;
  agentId: string;
}
