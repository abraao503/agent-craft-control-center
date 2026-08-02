import { api } from "@/services/api";
import { Pagination } from "@/types/pagination";

export type DealDistributionMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  lastAssignedAt: string | null;
};

export async function listDealDistribution(params: {
  workspaceId: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { data } = await api.get<Pagination<DealDistributionMember>>(
    `/workspace/${params.workspaceId}/deal-distribution`,
    { params: { page: params.page ?? 1, limit: params.limit ?? 100, search: params.search } },
  );
  return data;
}

export async function setDealDistributionMember(params: {
  workspaceId: string;
  userId: string;
  enabled: boolean;
}) {
  await api.put(
    `/workspace/${params.workspaceId}/deal-distribution/${params.userId}`,
    { enabled: params.enabled },
  );
}
