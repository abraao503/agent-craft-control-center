import { api } from "../api";
import { DealAttributionHistory } from "@/types/deal";

export interface DealAttributionsResponse {
  items: DealAttributionHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getDealAttributions = async (
  dealId: string,
  params: { workspaceId?: string; page?: number; limit?: number } = {},
): Promise<DealAttributionsResponse> => {
  const { data } = await api.get<DealAttributionsResponse>(
    `/deal/${dealId}/attributions`,
    { params },
  );

  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      attributedAt: new Date(item.attributedAt).toISOString(),
    })),
  };
};
