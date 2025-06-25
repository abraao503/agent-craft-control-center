import { api } from "../api";

export const activateCompanyWhatsAppIntegration = async (
  id: string
): Promise<void> => {
  await api.post(`/company-whatsapp-integration/${id}/activate`);
};

export const deactivateCompanyWhatsAppIntegration = async (
  id: string
): Promise<void> => {
  await api.post(`/company-whatsapp-integration/${id}/deactivate`);
};
