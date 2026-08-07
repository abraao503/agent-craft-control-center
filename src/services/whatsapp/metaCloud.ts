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

export async function listMetaCloudTemplates(status?: string) {
  const response = await api.get<MetaCloudTemplate[]>("/meta-cloud/templates", {
    params: status ? { status } : undefined,
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
  message:
    | {
        kind: "service";
        clientMessageId: string;
        type: "text" | "image" | "audio" | "document";
        content: string;
        mediaUrl?: string;
        mediaMimetype?: string;
      }
    | {
        kind: "template";
        clientMessageId: string;
        templateName: string;
        language: string;
        headerParameters: string[];
        bodyParameters: string[];
        buttonParameters: string[];
      };
};

export async function sendMetaCloudMessage(params: MetaCloudMessage) {
  const response = await api.post("/meta-cloud/messages", params);
  return response.data;
}
