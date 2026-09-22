import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { applyOperationalAttendanceChecklist } from "@/services/operation/applyOperationalAttendanceChecklist";
import { getOperationalAttendanceChecklist } from "@/services/operation/getOperationalAttendanceChecklist";
import { ApplyOperationalAttendanceChecklistParams } from "@/types/operational-checklist";

export function useOperationalAttendanceChecklist(
  workspaceId?: string,
  attendanceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance-checklist", workspaceId, attendanceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }

      return getOperationalAttendanceChecklist({ workspaceId, attendanceId });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalAttendanceChecklistMutations(
  workspaceId?: string,
  attendanceId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateChecklist = () => {
    void queryClient.invalidateQueries({
      queryKey: [
        "operation",
        "attendance-checklist",
        resolvedWorkspaceId,
        attendanceId,
      ],
    });
  };

  const apply = useMutation({
    mutationFn: (params: Pick<ApplyOperationalAttendanceChecklistParams, "templateId">) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }

      return applyOperationalAttendanceChecklist({
        workspaceId: resolvedWorkspaceId,
        attendanceId,
        templateId: params.templateId,
      });
    },
    onSuccess: invalidateChecklist,
  });

  return { apply };
}
