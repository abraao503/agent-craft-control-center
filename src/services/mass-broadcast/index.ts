import { api } from "../api";
import { Pagination } from "@/types/pagination";
import {
  MassBroadcast,
  MassBroadcastWithSummary,
  MassBroadcastRecipient,
  CreateMassBroadcastInput,
  ListMassBroadcastsParams,
  ListMassBroadcastRecipientsParams,
  PreviewRecipientsParams,
  PreviewRecipientsResponse,
  RetryFailedResponse,
} from "@/types/mass-broadcast";

export const previewRecipients = async (
  params: PreviewRecipientsParams,
): Promise<PreviewRecipientsResponse> => {
  const { data } = await api.post<PreviewRecipientsResponse>(
    "/mass-broadcast/preview-recipients",
    params,
  );
  return data;
};

export const createMassBroadcast = async (
  input: CreateMassBroadcastInput,
): Promise<MassBroadcast> => {
  const { data } = await api.post<MassBroadcast>("/mass-broadcast", input);
  return data;
};

export const listMassBroadcasts = async (
  params?: ListMassBroadcastsParams,
): Promise<Pagination<MassBroadcast>> => {
  const { data } = await api.get<Pagination<MassBroadcast>>("/mass-broadcast", {
    params,
  });
  return data;
};

export const getMassBroadcast = async (
  id: string,
): Promise<MassBroadcastWithSummary> => {
  const { data } = await api.get<MassBroadcastWithSummary>(
    `/mass-broadcast/${id}`,
  );
  return data;
};

export const listMassBroadcastRecipients = async (
  id: string,
  params?: ListMassBroadcastRecipientsParams,
): Promise<Pagination<MassBroadcastRecipient>> => {
  const { data } = await api.get<Pagination<MassBroadcastRecipient>>(
    `/mass-broadcast/${id}/recipients`,
    { params },
  );
  return data;
};

export const startMassBroadcast = async (
  id: string,
): Promise<MassBroadcast> => {
  const { data } = await api.post<MassBroadcast>(`/mass-broadcast/${id}/start`);
  return data;
};

export const pauseMassBroadcast = async (
  id: string,
): Promise<MassBroadcast> => {
  const { data } = await api.post<MassBroadcast>(`/mass-broadcast/${id}/pause`);
  return data;
};

export const cancelMassBroadcast = async (
  id: string,
): Promise<MassBroadcast> => {
  const { data } = await api.post<MassBroadcast>(
    `/mass-broadcast/${id}/cancel`,
  );
  return data;
};

export const retryFailedRecipients = async (
  id: string,
): Promise<RetryFailedResponse> => {
  const { data } = await api.post<RetryFailedResponse>(
    `/mass-broadcast/${id}/retry-failed`,
  );
  return data;
};

export const deleteMassBroadcast = async (id: string): Promise<void> => {
  await api.delete(`/mass-broadcast/${id}`);
};
