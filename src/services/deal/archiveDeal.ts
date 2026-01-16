import { api } from "../api";
import { CustomerDealApiResponse } from "./getCustomerDeals";

export interface ArchiveDealInput {
  dealId: string;
  workspaceId: string;
}

export const archiveDeal = async ({
  dealId,
  workspaceId,
}: ArchiveDealInput): Promise<CustomerDealApiResponse> => {
  const { data } = await api.patch<CustomerDealApiResponse>(
    `/deal/${dealId}/archive`,
    {
      workspaceId,
    }
  );

  return data;
};
