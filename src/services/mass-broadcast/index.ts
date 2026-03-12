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
  if (input.file) {
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("messages", JSON.stringify(input.messages));
    formData.append("pipelineId", input.pipelineId);
    formData.append("workspaceId", input.workspaceId);

    if (input.customerIds?.length)
      formData.append("customerIds", JSON.stringify(input.customerIds));
    if (input.includeTagIds?.length)
      formData.append("includeTagIds", JSON.stringify(input.includeTagIds));
    if (input.excludeTagIds?.length)
      formData.append("excludeTagIds", JSON.stringify(input.excludeTagIds));
    if (input.pipelineStageIds?.length)
      formData.append(
        "pipelineStageIds",
        JSON.stringify(input.pipelineStageIds),
      );
    if (input.applyTagIds?.length)
      formData.append("applyTagIds", JSON.stringify(input.applyTagIds));

    if (input.messageDelaySeconds !== undefined)
      formData.append("messageDelaySeconds", String(input.messageDelaySeconds));
    if (input.startTime) formData.append("startTime", input.startTime);
    if (input.endTime) formData.append("endTime", input.endTime);

    formData.append("file", input.file);

    const { data } = await api.post<MassBroadcast>("/mass-broadcast", formData);
    return data;
  }

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
