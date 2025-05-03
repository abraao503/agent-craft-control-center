import { Customer, CustomerWithFields } from "@/types/customer";
import { api } from "../api";

export const getCustomerById = async (
  id: string
): Promise<CustomerWithFields> => {
  const response = await api.get<CustomerWithFields>(`/customer/${id}`);

  return {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt),
  };
};
