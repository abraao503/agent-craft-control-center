import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import { api } from "../api";

type ApiResponse = {
  id: string;
  postbackUrl: string;
  whatsappIntegrationName: "z-api" | "evolux";
  assistant: {
    id: string;
    name: string;
  };
}[];

export const listCompanyWhatsAppIntegrations = async (): Promise<
  CompanyWhatsAppIntegration[]
> => {
  const response = await api.get<ApiResponse>(
    "/company-whatsapp-integration/list"
  );
  return response.data.map((item) => ({
    ...item,
    whatsappIntegrationName: item.whatsappIntegrationName as "z-api" | "evolux",
    agent: item.assistant,
  }));
};
