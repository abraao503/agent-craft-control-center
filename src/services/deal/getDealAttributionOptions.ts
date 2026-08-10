import { api } from "../api";
import { LeadAttributionSource } from "@/types/deal";

export interface DealAttributionOptions {
  sources: LeadAttributionSource[];
  campaigns: Array<{ id: string; name: string }>;
  ads: Array<{ id: string; name: string }>;
  forms: Array<{ id: string; name: string }>;
  metaAttributionActive: boolean;
}

export const getDealAttributionOptions = async (params: {
  workspaceId: string;
  pipelineId?: string;
  assignedUserId?: string;
}): Promise<DealAttributionOptions> => {
  const { data } = await api.get<DealAttributionOptions>(
    "/deal/attribution-options",
    { params },
  );
  return data;
};
