import {
  WhatsAppIntegrationName,
  WhatsAppProviderCapabilities,
} from './whatsapp-integration';

export interface WhatsAppIntegration {
  id: string;
  name: string;
  alias: string;
  active?: boolean;
  capabilities?: WhatsAppProviderCapabilities;
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
  metaPhoneNumberId?: string | null;
  displayPhoneNumber?: string | null;
  connectionStatus?: string;
  diagnosticCode?: string | null;
  diagnosticMessage?: string | null;
}

export interface CompanyWhatsAppIntegrationFull {
  id: string;
  postbackUrl: string;
  externalToken: string;
  externalClientToken: string;
  pipelineId: string;
  whatsappIntegrationId: string;
  whatsappIntegrationName: WhatsAppIntegrationName;
  active: boolean;
  initialPipelineStageId: string;
  status: "close" | "open" | "connecting";
  metaPhoneNumberId?: string | null;
  connectionStatus?: string;
}

export interface WhatsAppFormData {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: WhatsAppIntegrationName;
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
