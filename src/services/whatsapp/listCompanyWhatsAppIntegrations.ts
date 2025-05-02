import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import { api } from "../api";

type ApiResponse = {
  id: string;
  postbackUrl: string;
  assistantName: string;
  whatsappIntegrationName: string;
}[];

export const listCompanyWhatsAppIntegrations = async (): Promise<
  CompanyWhatsAppIntegration[]
> => {
  const response = await api.get<ApiResponse>(
    "/company-whatsapp-integration/list"
  );
  return response.data.map((item) => ({
    ...item,
    agentName: item.assistantName,
    whatsappIntegrationName: item.whatsappIntegrationName,
  }));
};
