import { api } from "../api";
import { DealDetails } from "@/types/deal";

export const getDealById = async (dealId: string): Promise<DealDetails> => {
  const response = await api.get<DealDetails>(`/deal/${dealId}`);
  return response.data;
};
