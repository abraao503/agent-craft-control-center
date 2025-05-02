import { api } from "../api";

export interface CreateWhatsAppIntegrationParams {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationId: string;
}

export const createWhatsAppIntegration = async (
  data: CreateWhatsAppIntegrationParams
) => {
  return api.post("/company-whatsapp-integration", {
    ...data,
    assistantId: data.agentId,
  });
};
