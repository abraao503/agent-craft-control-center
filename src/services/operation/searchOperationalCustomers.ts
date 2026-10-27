import { api } from "@/services/api";

export type OperationalCustomerSearchItem = {
  id: string;
  name: string;
  phone: string;
};

export async function searchOperationalCustomers(params: {
  workspaceId: string;
  search: string;
  limit?: number;
}): Promise<{ items: OperationalCustomerSearchItem[] }> {
  const { data } = await api.get<{ items: OperationalCustomerSearchItem[] }>(
    `/operation/workspaces/${params.workspaceId}/customers`,
    { params: { search: params.search, limit: params.limit ?? 8 } },
  );
  return data;
}
