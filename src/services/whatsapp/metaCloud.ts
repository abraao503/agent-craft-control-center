import { api } from "../api";

export type MetaCloudPhoneNumber = {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  qualityRating: string | null;
  status: string | null;
  lastSyncedAt: string | null;
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
    connectionStatus: string;
    diagnosticCode: string | null;
    diagnosticMessage: string | null;
    metaPhoneNumber: { phoneNumberId: string; status: string | null } | null;
  }>;
};

export async function getMetaCloudDiagnostic() {
  const response = await api.get<MetaCloudDiagnostic>("/meta-cloud/diagnostic");
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

export async function linkMetaCloudPhoneNumber(params: {
  phoneNumberId: string;
  pipelineId: string;
  initialPipelineStageId: string;
}) {
  const response = await api.post("/meta-cloud/integrations", params);
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
