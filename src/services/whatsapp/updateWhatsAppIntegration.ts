import { api } from "../api";
import { WhatsAppIntegrationName } from "@/types/whatsapp-integration";

export interface UpdateWhatsAppIntegrationParams {
  companyId: string;
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  agentId: string;
  whatsappIntegrationName: WhatsAppIntegrationName;
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
