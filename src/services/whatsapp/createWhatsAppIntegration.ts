import { api } from "../api";
import { WhatsAppIntegrationName } from "@/types/whatsapp-integration";

export interface CreateWhatsAppIntegrationParams {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: WhatsAppIntegrationName;
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
