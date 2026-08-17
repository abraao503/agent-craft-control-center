import { api } from "./api";
import {
  MetaIntegrationResponse,
  MetaLeadEventStatus,
  MetaLeadEventsResponse,
  MetaLeadForm,
  MetaLeadFormMapping,
} from "@/types/meta-integration";

export interface MetaAssetSelection {
  adAccountIds: string[];
  pageIds: string[];
}

export interface MetaMappingPayload {
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  active: boolean;
  fields: {
    phone: string;
    name?: string;
    email?: string;
    custom: Array<{ metaField: string; customerCustomFieldId: string }>;
  };
}

export async function getMetaIntegration(): Promise<MetaIntegrationResponse> {
  const { data } = await api.get<MetaIntegrationResponse>("/meta-integrations");
  return data;
}

export async function startMetaOAuth(): Promise<{ authorizationUrl: string }> {
  const { data } = await api.post<{ authorizationUrl: string }>(
    "/meta-integrations/oauth/start",
  );
  return data;
}

export async function syncMetaIntegration(): Promise<MetaIntegrationResponse> {
  const { data } = await api.post<MetaIntegrationResponse>(
    "/meta-integrations/sync",
  );
  return data;
}

export async function disconnectMetaIntegration(): Promise<{
  disconnected: boolean;
}> {
  const { data } = await api.delete<{ disconnected: boolean }>(
    "/meta-integrations",
  );
  return data;
}

export async function selectMetaAssets(
  payload: MetaAssetSelection,
): Promise<MetaIntegrationResponse> {
  const { data } = await api.put<MetaIntegrationResponse>(
    "/meta-integrations/assets",
    payload,
  );
  return data;
}

export async function listMetaLeadForms(
  workspaceId?: string,
): Promise<MetaLeadForm[]> {
  const query = workspaceId
    ? `?workspaceId=${encodeURIComponent(workspaceId)}`
    : "";
  const { data } = await api.get<MetaLeadForm[]>(
    `/meta-integrations/lead-forms${query}`,
  );
  return data;
}

export async function saveMetaLeadFormMapping(
  formId: string,
  payload: MetaMappingPayload,
): Promise<MetaLeadFormMapping> {
  const { data } = await api.put<MetaLeadFormMapping>(
    `/meta-integrations/lead-forms/${encodeURIComponent(formId)}/mapping`,
    payload,
  );
  return data;
}

export async function deleteMetaLeadFormMapping(
  formId: string,
): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<{ deleted: boolean }>(
    `/meta-integrations/lead-forms/${encodeURIComponent(formId)}/mapping`,
  );
  return data;
}

export async function listMetaLeadEvents(params: {
  workspaceId?: string;
  page?: number;
  limit?: number;
  status?: MetaLeadEventStatus;
}): Promise<MetaLeadEventsResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 25));
  if (params.workspaceId) query.set("workspaceId", params.workspaceId);
  if (params.status) query.set("status", params.status);
  const { data } = await api.get<{
    items: MetaLeadEventsResponse["items"];
    total: number;
  }>(`/meta-integrations/lead-events?${query.toString()}`);
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  return { ...data, page, limit, totalPages: Math.ceil(data.total / limit) };
}

export async function retryMetaLeadEvent(
  id: string,
): Promise<{ queued: boolean }> {
  const { data } = await api.post<{ queued: boolean }>(
    `/meta-integrations/lead-events/${id}/retry`,
  );
  return data;
}

export async function resolveMetaLeadPhone(
  id: string,
  phone: string,
): Promise<{ queued: boolean }> {
  const { data } = await api.post<{ queued: boolean }>(
    `/meta-integrations/lead-events/${id}/resolve-phone`,
    { phone },
  );
  return data;
}
