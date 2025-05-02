export interface WhatsAppIntegration {
  id: string;
  name: string;
  alias: string;
}

export interface CompanyWhatsAppIntegration {
  id: string;
  postbackUrl: string;
  agentName: string;
  whatsappIntegrationName: string;
}

export interface CompanyWhatsAppIntegrationFull {
  id: string;
  postbackUrl: string;
  externalToken: string;
  externalClientToken: string;
  agentId: string;
  whatsappIntegrationId: string;
}

export interface WhatsAppFormData {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationId: string;
  id?: string; // For edit mode
  companyId?: string; // For edit mode
}
