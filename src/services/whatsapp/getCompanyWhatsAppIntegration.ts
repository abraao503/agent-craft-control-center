import { CompanyWhatsAppIntegrationFull } from "@/types/whatsapp";
import { WhatsAppIntegrationName } from "@/types/whatsapp-integration";
import { api } from "../api";

type ApiResponse = {
  id: string;
  postbackUrl: string;
  externalToken: string;
  externalClientToken: string;
  whatsappIntegrationId: string;
  whatsappIntegrationName: string;
  pipelineId: string;
  initialPipelineStageId: string;
  active: boolean;
  status: "close" | "open" | "connecting";
  metaPhoneNumberId: string | null;
  connectionStatus: string;
  diagnosticCode: string | null;
  diagnosticMessage: string | null;
  initialPipelineStageOrder?: number;
  metaDisplayPhoneNumber?: string | null;
};

export const getCompanyWhatsAppIntegration = async (
  id: string
): Promise<CompanyWhatsAppIntegrationFull> => {
  const { data } = await api.get<ApiResponse>(
    `/company-whatsapp-integration/${id}`
  );

  return {
    id: data.id,
    pipelineId: data.pipelineId,
    postbackUrl: data.postbackUrl,
    externalToken: data.externalToken,
    externalClientToken: data.externalClientToken,
    whatsappIntegrationId: data.whatsappIntegrationId,
    whatsappIntegrationName: data.whatsappIntegrationName as WhatsAppIntegrationName,
    active: data.active,
    initialPipelineStageId: data.initialPipelineStageId,
    status: data.status,
    metaPhoneNumberId: data.metaPhoneNumberId,
    connectionStatus: data.connectionStatus,
    diagnosticCode: data.diagnosticCode,
    diagnosticMessage: data.diagnosticMessage,
    initialPipelineStageOrder: data.initialPipelineStageOrder,
    metaDisplayPhoneNumber: data.metaDisplayPhoneNumber,
  };
};
