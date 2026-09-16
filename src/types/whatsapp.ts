import { WhatsAppIntegrationName } from './whatsapp-integration';

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
  initialPipelineStageOrder?: number;
  metaDisplayPhoneNumber?: string | null;
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
  diagnosticCode?: string | null;
  diagnosticMessage?: string | null;
  initialPipelineStageOrder?: number;
  metaDisplayPhoneNumber?: string | null;
}

export type InstanceQrCodeEvent = {
  companyWhatsappIntegrationId: string;
  qrCode: string;
};

export type InstanceStatusEvent = {
  companyWhatsappIntegrationId: string;
  workspaceId: string;
  status: "close" | "open" | "connecting";
};
