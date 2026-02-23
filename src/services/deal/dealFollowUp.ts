import { api } from "../api";
import {
  CreateDealFollowUpParams,
  DealFollowUp,
  DealFollowUpListResponse,
} from "@/types/deal-follow-up";

/**
 * Build a FormData from follow-up params (supports file upload + recurrence JSON)
 */
function buildFollowUpFormData(data: CreateDealFollowUpParams): FormData {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("message", data.message);
  formData.append("scheduledAt", data.scheduledAt);

  if (data.file) {
    formData.append("file", data.file);
  }

  if (data.recurrence) {
    formData.append("recurrence", JSON.stringify(data.recurrence));
  }

  return formData;
}

/**
 * Create a follow-up for a deal
 */
export const createDealFollowUp = async (
  dealId: string,
  data: CreateDealFollowUpParams,
): Promise<{ id: string }> => {
  const formData = buildFollowUpFormData(data);
  const response = await api.post(`/deal/${dealId}/follow-up`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * List follow-ups for a deal
 */
export const listDealFollowUps = async (
  dealId: string,
  params?: { page?: number; limit?: number },
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
  data: CreateDealFollowUpParams,
): Promise<DealFollowUp> => {
  const formData = buildFollowUpFormData(data);
  const response = await api.patch(
    `/deal/${dealId}/follow-up/${followUpId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

/**
 * Delete a follow-up
 */
export const deleteDealFollowUp = async (followUpId: string): Promise<void> => {
  await api.delete(`/follow-up/${followUpId}`);
};
