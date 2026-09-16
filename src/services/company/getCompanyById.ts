import { api } from "@/services/api";
import { CompanyDetails } from "@/types/company";

export async function getCompanyById(
  companyId: string
): Promise<CompanyDetails> {
  const { data } = await api.get<CompanyDetails>(
    `/company/${companyId}`
  );
  return data;
}
