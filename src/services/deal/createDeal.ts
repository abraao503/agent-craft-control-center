import { api } from "../api";
import { CreateDealInput, CreateDealResponse } from "@/types/deal";

export const createDeal = async (
  payload: CreateDealInput
): Promise<CreateDealResponse> => {
  const { data } = await api.post<CreateDealResponse>("/deal", payload);
  return data;
};
