import { CompanyWhatsAppIntegrationFull } from "@/types/whatsapp";
import { api } from "../api";

type ApiResponse = {
  id: string;
  assistantId: string;
  postbackUrl: string;
  externalToken: string;
  externalClientToken: string;
  whatsappIntegrationId: string;
};

export const getCompanyWhatsAppIntegration = async (
  id: string
): Promise<CompanyWhatsAppIntegrationFull> => {
  const { data } = await api.get<ApiResponse>(
    `/company-whatsapp-integration/${id}`
  );

  return {
    id: data.id,
    agentId: data.assistantId,
    postbackUrl: data.postbackUrl,
    externalToken: data.externalToken,
    externalClientToken: data.externalClientToken,
    whatsappIntegrationId: data.whatsappIntegrationId,
  };
};
