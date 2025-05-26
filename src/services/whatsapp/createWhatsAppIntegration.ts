import { api } from "../api";

export interface CreateWhatsAppIntegrationParams {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: "z-api" | "evolux";
}

export const createWhatsAppIntegration = async (
  data: CreateWhatsAppIntegrationParams
) => {
  return api.post("/company-whatsapp-integration", {
    ...data,
    assistantId: data.agentId,
    whatsappIntegrationName: data.whatsappIntegrationName,
  });
};
