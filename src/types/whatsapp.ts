export interface WhatsAppIntegration {
  id: string;
  name: string;
  alias: string;
}

export interface CompanyWhatsAppIntegration {
  id: string;
  postbackUrl: string;
  whatsappIntegrationName: string;
  status: "close" | "open" | "connecting";
  active: boolean;
  agent: {
    id: string;
    name: string;
  };
}

export interface CompanyWhatsAppIntegrationFull {
  id: string;
  postbackUrl: string;
  externalToken: string;
  externalClientToken: string;
  pipelineId: string;
  whatsappIntegrationId: string;
  whatsappIntegrationName: "z-api" | "evolux";
  active: boolean;
  initialPipelineStageId: string;
  status: "close" | "open" | "connecting";
}

export interface WhatsAppFormData {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: "z-api" | "evolux";
  id?: string; // For edit mode
  companyId?: string; // For edit mode
}

export type InstanceQrCodeEvent = {
  companyWhatsappIntegrationId: string;
  qrCode: string;
};

export type InstanceStatusEvent = {
  companyWhatsappIntegrationId: string;
  status: "close" | "open" | "connecting";
};
