import { WhatsAppIntegration } from "@/types/whatsapp";
import { api } from "../api";

export const listWhatsAppIntegrations = async (): Promise<WhatsAppIntegration[]> => {
  const response = await api.get<WhatsAppIntegration[]>("/whatsapp-integration/list");
  return response.data;
}; 