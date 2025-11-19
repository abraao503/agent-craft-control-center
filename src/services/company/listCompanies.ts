import { api } from "@/services/api";
import { ListCompaniesResponse } from "@/types/company";

export interface ListCompaniesParams {
  limit?: number;
  page?: number;
}

export async function listCompanies(
  params?: ListCompaniesParams
): Promise<ListCompaniesResponse> {
  const { data } = await api.get<ListCompaniesResponse>("/company", {
    params: {
      limit: params?.limit || 10,
      page: params?.page || 1,
    },
  });
  return data;
}
