import { api } from "../api";

export const deleteWhatsAppIntegration = async (id: string) => {
  return api.delete(`/company-whatsapp-integration/${id}`);
}; 