import { api } from "../api";

export interface UpdateWhatsAppIntegrationParams {
  companyId: string;
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: string;
}

export const updateWhatsAppIntegration = async (
  id: string,
  data: UpdateWhatsAppIntegrationParams
) => {
  return api.put(`/company-whatsapp-integration/${id}`, {
    ...data,
    assistantId: data.agentId,
  });
};
