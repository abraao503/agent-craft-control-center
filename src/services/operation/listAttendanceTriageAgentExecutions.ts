import { api } from "@/services/api";
import {
  OperationalTriageAgentExecutionPage,
} from "@/types/operation-triage-agent-execution";

export async function listAttendanceTriageAgentExecutions(params: {
  workspaceId: string;
  attendanceId: string;
  page?: number;
  limit?: number;
}): Promise<OperationalTriageAgentExecutionPage> {
  const { data } = await api.get<OperationalTriageAgentExecutionPage>(
    `/operation/workspaces/${params.workspaceId}/attendances/${params.attendanceId}/triage-agent-executions`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
  );

  return data;
}
