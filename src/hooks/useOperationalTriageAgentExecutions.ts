import { useQuery } from "@tanstack/react-query";
import { listAttendanceTriageAgentExecutions } from "@/services/operation/listAttendanceTriageAgentExecutions";

export function useOperationalTriageAgentExecutions(
  workspaceId?: string,
  attendanceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-triage-agent-executions",
      workspaceId,
      attendanceId,
    ],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }

      return listAttendanceTriageAgentExecutions({
        workspaceId,
        attendanceId,
        limit: 20,
      });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
    refetchInterval: 5_000,
  });
}
