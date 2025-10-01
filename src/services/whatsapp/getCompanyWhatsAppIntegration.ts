import { CompanyWhatsAppIntegrationFull } from "@/types/whatsapp";
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
    whatsappIntegrationName: data.whatsappIntegrationName as "z-api" | "evolux",
    active: data.active,
    initialPipelineStageId: data.initialPipelineStageId,
  };
};
