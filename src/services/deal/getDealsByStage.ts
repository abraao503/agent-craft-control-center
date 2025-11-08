import { api } from "../api";
import {
  DealListItem,
  GetDealsByStageResponse,
  GetDealsByStageParams,
  RelatedMinimal,
} from "@/types/deal";

type DealApiItem = {
  id: string;
  currentStageId?: string;
  stageId?: string;
  title: string;
  description?: string | null;
  value?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: RelatedMinimal | null;
  assignedUser?: RelatedMinimal | null;
  tags?: string[];
  dueDate?: string | null;
};

type ApiResponse = {
  deals: DealApiItem[];
  total: number;
  limit: number;
  offset: number;
};

export const getDealsByStage = async ({
  stageId,
  workspaceId,
  limit = 10,
  offset = 0,
  search,
  assignedUserId,
}: GetDealsByStageParams): Promise<GetDealsByStageResponse> => {
  const { data } = await api.get<ApiResponse>(`/deal/stage/${stageId}`, {
    params: {
      workspaceId,
      limit,
      offset,
      search,
      assignedUserId,
    },
  });

  // Normalize deals data
  const normalizedDeals: DealListItem[] = data.deals.map((apiDeal) => ({
    id: apiDeal.id,
    stageId: apiDeal.currentStageId || apiDeal.stageId || stageId,
    title: apiDeal.title,
    description: apiDeal.description,
    value: apiDeal.value,
    currency: apiDeal.currency || "BRL",
    createdAt: new Date(apiDeal.createdAt),
    updatedAt: new Date(apiDeal.updatedAt),
    customer: apiDeal.customer,
    assignedUser: apiDeal.assignedUser,
    tags: apiDeal.tags || [],
    dueDate: apiDeal.dueDate,
  }));

  return {
    deals: normalizedDeals,
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
};
