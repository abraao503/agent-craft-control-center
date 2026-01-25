import { api } from "../api";
import {
  DealWebhook,
  CreateDealWebhookInput,
  CreateDealWebhookResponse,
  UpdateDealWebhookInput,
  ListDealWebhooksParams,
  DealWebhookExecution,
  ListDealWebhookExecutionsParams,
} from "@/types/deal-webhook";
import { Pagination } from "@/types/pagination";

export const createDealWebhook = async (
  input: CreateDealWebhookInput,
): Promise<CreateDealWebhookResponse> => {
  const { data } = await api.post<CreateDealWebhookResponse>(
    "/deal-webhooks",
    input,
  );
  return data;
};

export const listDealWebhooks = async (
  params?: ListDealWebhooksParams,
): Promise<Pagination<DealWebhook>> => {
  const { data } = await api.get<Pagination<DealWebhook>>("/deal-webhooks", {
    params,
  });
  return data;
};

export const getDealWebhook = async (id: string): Promise<DealWebhook> => {
  const { data } = await api.get<DealWebhook>(`/deal-webhooks/${id}`);
  return data;
};

export const updateDealWebhook = async (
  id: string,
  input: UpdateDealWebhookInput,
): Promise<DealWebhook> => {
  const { data } = await api.patch<DealWebhook>(`/deal-webhooks/${id}`, input);
  return data;
};

export const deleteDealWebhook = async (id: string): Promise<void> => {
  await api.delete(`/deal-webhooks/${id}`);
};

export const listDealWebhookExecutions = async (
  webhookId: string,
  params?: ListDealWebhookExecutionsParams,
): Promise<Pagination<DealWebhookExecution>> => {
  const { data } = await api.get<Pagination<DealWebhookExecution>>(
    `/deal-webhooks/${webhookId}/executions`,
    { params },
  );
  return {
    ...data,
    items: data.items.map((execution) => ({
      ...execution,
      createdAt: new Date(execution.createdAt),
      updatedAt: new Date(execution.updatedAt),
    })),
  };
};
