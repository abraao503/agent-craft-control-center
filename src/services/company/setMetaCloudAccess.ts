import { api } from "@/services/api";

export async function setMetaCloudAccess(companyId: string, enabled: boolean) {
  const { data } = await api.patch(
    `/platform/companies/${companyId}/meta-cloud-access`,
    { enabled },
  );
  return data as { companyId: string; enabled: boolean };
}
