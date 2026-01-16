import { api } from "../api";
import {
  CreateDealFollowUpParams,
  DealFollowUp,
  DealFollowUpListResponse,
} from "@/types/deal-follow-up";

/**
 * Create a follow-up for a deal
 */
export const createDealFollowUp = async (
  dealId: string,
  data: CreateDealFollowUpParams
): Promise<{ id: string }> => {
  const response = await api.post(`/deal/${dealId}/follow-up`, data);
  return response.data;
};

/**
 * List follow-ups for a deal
 */
export const listDealFollowUps = async (
  dealId: string,
  params?: { page?: number; limit?: number }
): Promise<DealFollowUpListResponse> => {
  const response = await api.get(`/deal/${dealId}/follow-up`, { params });
  return response.data;
};

/**
 * Update a follow-up
 */
export const updateDealFollowUp = async (
  dealId: string,
  followUpId: string,
  data: CreateDealFollowUpParams
): Promise<DealFollowUp> => {
  const response = await api.patch(
    `/deal/${dealId}/follow-up/${followUpId}`,
    data
  );
  return response.data;
};

/**
 * Delete a follow-up
 */
export const deleteDealFollowUp = async (followUpId: string): Promise<void> => {
  await api.delete(`/follow-up/${followUpId}`);
};
