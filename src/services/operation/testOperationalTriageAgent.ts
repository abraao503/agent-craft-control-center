import { api } from "@/services/api";
import {
  OperationalTriageAgentConnectionTest,
  TestOperationalTriageAgentParams,
} from "@/types/operation-triage-agent";

export async function testOperationalTriageAgent(
  params: TestOperationalTriageAgentParams,
): Promise<OperationalTriageAgentConnectionTest> {
  const { data } = await api.post<OperationalTriageAgentConnectionTest>(
    `/operation/workspaces/${params.workspaceId}/triage-agents/${params.agentId}/test`,
  );

  return data;
}
