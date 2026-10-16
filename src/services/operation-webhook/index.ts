import { api } from "@/services/api";
import type {
  CreateOperationalWebhookInput,
  OperationalWebhook,
  OperationalWebhookExecution,
  OperationalWebhookExecutionListParams,
  OperationalWebhookExecutionPage,
  OperationalWebhookListParams,
  OperationalWebhookPage,
  OperationalWebhookWithKey,
  UpdateOperationalWebhookInput,
} from "@/types/operational-webhook";

const basePath = (workspaceId: string) =>
  `/operation/workspaces/${workspaceId}/webhooks`;

export async function listOperationalWebhooks(
  workspaceId: string,
  params: OperationalWebhookListParams = {},
): Promise<OperationalWebhookPage> {
  const { data } = await api.get<OperationalWebhookPage>(basePath(workspaceId), {
    params,
  });
  return data;
}

export async function getOperationalWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<OperationalWebhook> {
  const { data } = await api.get<OperationalWebhook>(
    `${basePath(workspaceId)}/${webhookId}`,
  );
  return data;
}

export async function createOperationalWebhook(
  workspaceId: string,
  input: CreateOperationalWebhookInput,
): Promise<OperationalWebhookWithKey> {
  const { data } = await api.post<OperationalWebhookWithKey>(
    basePath(workspaceId),
    input,
  );
  return data;
}

export async function updateOperationalWebhook(
  workspaceId: string,
  webhookId: string,
  input: UpdateOperationalWebhookInput,
): Promise<OperationalWebhook> {
  const { data } = await api.patch<OperationalWebhook>(
    `${basePath(workspaceId)}/${webhookId}`,
    input,
  );
  return data;
}

export async function regenerateOperationalWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<OperationalWebhookWithKey> {
  const { data } = await api.post<OperationalWebhookWithKey>(
    `${basePath(workspaceId)}/${webhookId}/regenerate`,
  );
  return data;
}

export async function listOperationalWebhookExecutions(
  workspaceId: string,
  webhookId: string,
  params: OperationalWebhookExecutionListParams = {},
): Promise<OperationalWebhookExecutionPage> {
  const { data } = await api.get<OperationalWebhookExecutionPage>(
    `${basePath(workspaceId)}/${webhookId}/executions`,
    { params },
  );
  return data;
}

export async function getOperationalWebhookExecution(
  workspaceId: string,
  webhookId: string,
  executionId: string,
): Promise<OperationalWebhookExecution> {
  const { data } = await api.get<OperationalWebhookExecution>(
    `${basePath(workspaceId)}/${webhookId}/executions/${executionId}`,
  );
  return data;
}
