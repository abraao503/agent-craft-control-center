import { api } from "../api";
import { DealNote } from "@/types/deal";

export const getDealNotes = async (
  dealId: string,
  params?: { limit?: number; offset?: number }
): Promise<DealNote[]> => {
  const response = await api.get<DealNote[]>(`/deal/${dealId}/notes`, {
    params,
  });
  return response.data;
};
