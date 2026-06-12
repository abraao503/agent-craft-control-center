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
  tagIds?: string[];
  dueDate?: string | null;
};

type ApiResponse = {
  items: DealApiItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getDealsByStage = async ({
  stageId,
  workspaceId,
  limit = 10,
  page = 1,
  search,
  assignedUserId,
}: GetDealsByStageParams): Promise<GetDealsByStageResponse> => {
  const { data } = await api.get<ApiResponse>(`/deal/stage/${stageId}`, {
    params: {
      workspaceId,
      limit,
      page,
      search,
      assignedUserId,
    },
  });

  // Normalize deals data
  const normalizedDeals: DealListItem[] = data.items.map((apiDeal) => ({
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
    tags: apiDeal.tags || apiDeal.tagIds || [],
    dueDate: apiDeal.dueDate,
  }));

  return {
    items: normalizedDeals,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
};
