import { api } from "../api";
import { DealListItem } from "@/types/deal";

export interface CustomerDealApiResponse {
  id: string;
  customerId: string;
  stageId: string;
  isPrimaryDeal: boolean;
  title: string;
  description?: string | null;
  value?: number | null;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  archivedAt?: string | null;
  pipeline?: {
    id: string;
    name: string;
    workspaceId: string;
  };
  currentStage?: {
    id: string;
    name: string;
    order: number;
  };
  assignedUser?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

export interface GetCustomerDealsResponse {
  items: CustomerDealApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetCustomerDealsParams {
  customerId: string;
  workspaceId: string;
  limit?: number;
  page?: number;
}

export const getCustomerDeals = async ({
  customerId,
  workspaceId,
  limit = 10,
  page = 1,
}: GetCustomerDealsParams): Promise<GetCustomerDealsResponse> => {
  const { data } = await api.get<GetCustomerDealsResponse>(
    `deal/customer/${customerId}`,
    {
      params: {
        workspaceId,
        limit,
        page,
      },
    }
  );

  return data;
};
