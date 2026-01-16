import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import { WhatsAppIntegrationName } from "@/types/whatsapp-integration";
import { api } from "../api";

type ApiResponse = {
  id: string;
  postbackUrl: string;
  whatsappIntegrationName: WhatsAppIntegrationName;
  assistant: {
    id: string;
    name: string;
  };
  status: "close" | "open" | "connecting";
  active: boolean;
}[];

export const listCompanyWhatsAppIntegrations = async (
  workspaceId: string
): Promise<CompanyWhatsAppIntegration[]> => {
  const response = await api.get<ApiResponse>(
    "/company-whatsapp-integration/list",
    {
      params: { workspaceId },
    }
  );

  return response.data.map((item) => ({
    ...item,
    whatsappIntegrationName: item.whatsappIntegrationName,
    agent: item.assistant,
    status: item.status,
    active: item.active,
  }));
};
