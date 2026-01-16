import { api } from "../api";
import { CustomerDealApiResponse } from "./getCustomerDeals";

export interface SetPrimaryDealInput {
  customerId: string;
  pipelineId: string;
  workspaceId: string;
}

export const setPrimaryDeal = async ({
  customerId,
  pipelineId,
  workspaceId,
}: SetPrimaryDealInput): Promise<CustomerDealApiResponse> => {
  const { data } = await api.post<CustomerDealApiResponse>(
    `/customer/${customerId}/deal/primary`,
    {
      pipelineId,
      workspaceId,
    }
  );

  return data;
};
