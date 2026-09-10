import { api } from "@/services/api";
import { StartOperationalMetaOnboardingData } from "@/types/operation-channels";

export async function startOperationalMetaOnboarding(
  workspaceId: string,
): Promise<StartOperationalMetaOnboardingData> {
  const { data } = await api.post<StartOperationalMetaOnboardingData>(
    `/operation/workspaces/${workspaceId}/channels/meta-cloud/onboarding/start`,
  );

  return data;
}
