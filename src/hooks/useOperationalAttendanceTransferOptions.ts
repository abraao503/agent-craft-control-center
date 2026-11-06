import { useQuery } from "@tanstack/react-query";
import { listAttendanceTransferOptions } from "@/services/operation/listAttendanceTransferOptions";

export function useOperationalAttendanceTransferOptions(
  workspaceId?: string,
  attendanceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-transfer-options",
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

      return listAttendanceTransferOptions({ workspaceId, attendanceId });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}
