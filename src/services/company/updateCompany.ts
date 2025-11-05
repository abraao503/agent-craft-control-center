import { api } from "@/services/api";
import {
  UpdateCompanyRequest,
  UpdateCompanyResponse,
} from "@/types/company";

export async function updateCompany(
  companyId: string,
  data: UpdateCompanyRequest
): Promise<UpdateCompanyResponse> {
  const { data: response } = await api.patch<UpdateCompanyResponse>(
    `/company/${companyId}`,
    data
  );
  return response;
}
