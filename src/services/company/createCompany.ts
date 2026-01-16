import { api } from "@/services/api";
import {
  CreateCompanyRequest,
  CreateCompanyResponse,
} from "@/types/company";

export async function createCompany(
  data: CreateCompanyRequest
): Promise<CreateCompanyResponse> {
  const { data: response } = await api.post<CreateCompanyResponse>(
    "/company",
    data
  );
  return response;
}
