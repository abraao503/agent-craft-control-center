import { api } from "@/services/api";
import {
  CreateOperationalTriageAgentParams,
  OperationalTriageAgent,
} from "@/types/operation-triage-agent";

export async function createOperationalTriageAgent(
  params: CreateOperationalTriageAgentParams,
): Promise<OperationalTriageAgent> {
  const { data } = await api.post<OperationalTriageAgent>(
    `/operation/workspaces/${params.workspaceId}/triage-agents`,
    params.body,
  );

  return data;
}
