import { api } from "@/services/api";

type ApiResponse = {
  qrCode: string;
};

export const generateQrCode = async (
  integrationId: string,
  workspaceId: string
) => {
  const response = await api.get<ApiResponse>(
    `/company-whatsapp-integration/${integrationId}/request-qr-code`,
    {
      params: {
        workspaceId,
      },
    }
  );
  return response.data;
};
