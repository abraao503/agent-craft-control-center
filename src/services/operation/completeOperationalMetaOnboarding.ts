import { api } from "@/services/api";
import {
  CompleteOperationalMetaOnboardingBody,
  CompleteOperationalMetaOnboardingData,
} from "@/types/operation-channels";

export async function completeOperationalMetaOnboarding(params: {
  workspaceId: string;
  body: CompleteOperationalMetaOnboardingBody;
}): Promise<CompleteOperationalMetaOnboardingData> {
  const { data } = await api.post<CompleteOperationalMetaOnboardingData>(
    `/operation/workspaces/${params.workspaceId}/channels/meta-cloud/onboarding/complete`,
    params.body,
  );

  return data;
}
