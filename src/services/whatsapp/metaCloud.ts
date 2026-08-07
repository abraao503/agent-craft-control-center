import { api } from "../api";

export type MetaCloudPhoneNumber = {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  qualityRating: string | null;
  status: string | null;
  lastSyncedAt: string | null;
  assignedPipelineId: string | null;
};

export type MetaCloudTemplate = {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string | null;
  components: unknown;
  compatible: boolean;
  incompatibilityReason: string | null;
  syncedAt: string;
};

export type MetaCloudTemplateBinding =
  | { source: "fixed"; value: string }
  | { source: "customer"; field: "name" | "firstName" | "phone" | "email" }
  | { source: "deal"; field: "id" | "pipeline" | "stage" }
  | { source: "owner"; field: "name" };

export type MetaCloudTemplatePreview = {
  templateId: string;
  name: string;
  language: string;
  header: string | null;
  body: string;
  parameters: Array<{ slot: string; binding: MetaCloudTemplateBinding; value: string }>;
  graphComponents: Array<Record<string, unknown>>;
  serviceWindow?: {
    status: "OPEN" | "CLOSED";
    expiresAt: string | null;
    lastInboundAt: string | null;
  };
};

export type MetaCloudDiagnostic = {
  enabled: boolean;
  companyFlag: boolean;
  environmentFlag: boolean;
  configured: boolean;
  graphVersion: string;
  integrations: Array<{
    id: string;
    pipelineId: string;
    status: string;
    connectionStatus: string;
    diagnosticCode: string | null;
    diagnosticMessage: string | null;
    metaPhoneNumber:
      | {
          phoneNumberId: string;
          displayPhoneNumber: string;
          status: string | null;
        }
      | null;
    active: boolean;
    initialPipelineStage: { order: number; name: string };
  }>;
};

export type MetaCloudConsentState = "UNKNOWN" | "GRANTED" | "REVOKED";

export type MetaCloudConsent = {
  state: MetaCloudConsentState;
  source: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  note: string | null;
  evidence: string | null;
};

export async function getMetaCloudDiagnostic() {
  const response = await api.get<MetaCloudDiagnostic>("/meta-cloud/diagnostic");
  return response.data;
}

export async function getMetaCloudConsent(params: {
  customerId: string;
  integrationId: string;
}): Promise<MetaCloudConsent> {
  const response = await api.get<MetaCloudConsent>("/meta-cloud/consent", {
    params,
  });
  return response.data;
}

export async function listMetaCloudPhoneNumbers() {
  const response = await api.get<MetaCloudPhoneNumber[]>(
    "/meta-cloud/phone-numbers",
  );
  return response.data;
}

export async function syncMetaCloudPhoneNumbers() {
  const response = await api.post<MetaCloudPhoneNumber[]>(
    "/meta-cloud/phone-numbers/sync",
  );
  return response.data;
}

export async function configureMetaCloudPipelineIntegration(
  pipelineId: string,
  params: {
    phoneNumberId: string;
    initialPipelineStageOrder: number;
  },
) {
  const response = await api.put(
    `/meta-cloud/pipelines/${pipelineId}/integration`,
    params,
  );
  return response.data;
}

export async function disconnectMetaCloudPipelineIntegration(
  pipelineId: string,
) {
  const response = await api.delete(
    `/meta-cloud/pipelines/${pipelineId}/integration`,
  );
  return response.data;
}

export async function listMetaCloudTemplates(
  status?: string,
  integrationId?: string,
) {
  const response = await api.get<MetaCloudTemplate[]>("/meta-cloud/templates", {
    params:
      status || integrationId
        ? {
            ...(status ? { status } : {}),
            ...(integrationId ? { integrationId } : {}),
          }
        : undefined,
  });
  return response.data;
}

export async function syncMetaCloudTemplates() {
  const response = await api.post<MetaCloudTemplate[]>(
    "/meta-cloud/templates/sync",
  );
  return response.data;
}

export async function setMetaCloudConsent(params: {
  customerId: string;
  integrationId: string;
  state: "GRANTED" | "REVOKED";
  source: string;
  note?: string;
  evidence?: string;
}) {
  const response = await api.post("/meta-cloud/consent", params);
  return response.data;
}

export type MetaCloudMessage = {
  chatId: string;
  integrationId: string;
  replyContextMessageId?: string;
  clientMessageId: string;
  message:
    | {
        kind: "service";
        type: "text" | "image" | "audio" | "document";
        content: string;
        mediaUrl?: string;
        mediaMimetype?: string;
      }
    | {
        kind: "template";
        templateId: string;
        bindings: Record<string, MetaCloudTemplateBinding>;
      };
};

export async function sendMetaCloudMessage(params: MetaCloudMessage) {
  const response = await api.post("/meta-cloud/messages", params);
  return response.data;
}

export async function listMetaCloudChatTemplates(params: {
  chatId: string;
  integrationId: string;
}) {
  const response = await api.get<MetaCloudTemplate[]>(
    `/meta-cloud/chats/${params.chatId}/templates`,
    { params: { integrationId: params.integrationId } },
  );
  return response.data;
}

export async function listMetaCloudPipelineTemplates(pipelineId: string) {
  const response = await api.get<MetaCloudTemplate[]>(
    `/meta-cloud/pipelines/${pipelineId}/templates`,
  );
  return response.data;
}

export async function previewMetaCloudPipelineTemplate(params: {
  pipelineId: string;
  templateId: string;
  bindings: Record<string, MetaCloudTemplateBinding>;
  dealId?: string;
}) {
  const response = await api.post<MetaCloudTemplatePreview>(
    `/meta-cloud/pipelines/${params.pipelineId}/templates/preview`,
    {
      templateId: params.templateId,
      bindings: params.bindings,
      ...(params.dealId ? { dealId: params.dealId } : {}),
    },
  );
  return response.data;
}

export async function previewMetaCloudChatTemplate(params: {
  chatId: string;
  integrationId: string;
  templateId: string;
  bindings: Record<string, MetaCloudTemplateBinding>;
  replyContextMessageId?: string;
}) {
  const response = await api.post<MetaCloudTemplatePreview>(
    `/meta-cloud/chats/${params.chatId}/templates/preview`,
    params,
  );
  return response.data;
}

export async function sendMetaCloudTemplate(params: {
  chatId: string;
  integrationId: string;
  clientMessageId: string;
  templateId: string;
  bindings: Record<string, MetaCloudTemplateBinding>;
  replyContextMessageId?: string;
  origin?: string;
  flowId?: string;
  contextDealId?: string;
}) {
  const response = await api.post(
    "/meta-cloud/messages",
    {
      chatId: params.chatId,
      integrationId: params.integrationId,
      clientMessageId: params.clientMessageId,
      replyContextMessageId: params.replyContextMessageId,
      origin: params.origin ?? "CHAT_HUMAN",
      flowId: params.flowId,
      contextDealId: params.contextDealId,
      message: {
        kind: "template",
        clientMessageId: params.clientMessageId,
        templateId: params.templateId,
        bindings: params.bindings,
      },
    },
  );
  return response.data;
}
