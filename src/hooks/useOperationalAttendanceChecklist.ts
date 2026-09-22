import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { applyOperationalAttendanceChecklist } from "@/services/operation/applyOperationalAttendanceChecklist";
import { getOperationalAttendanceChecklist } from "@/services/operation/getOperationalAttendanceChecklist";
import { replaceOperationalAttendanceChecklist } from "@/services/operation/replaceOperationalAttendanceChecklist";
import { updateOperationalAttendanceChecklist } from "@/services/operation/updateOperationalAttendanceChecklist";
import {
  ApplyOperationalAttendanceChecklistParams,
  ReplaceOperationalAttendanceChecklistParams,
  UpdateOperationalAttendanceChecklistParams,
} from "@/types/operational-checklist";

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
      queryKey: checklistQueryKey(resolvedWorkspaceId, attendanceId),
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

  const update = useMutation({
    mutationFn: (
      params: Omit<
        UpdateOperationalAttendanceChecklistParams,
        "workspaceId" | "attendanceId"
      >,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }

      return updateOperationalAttendanceChecklist({
        ...params,
        workspaceId: resolvedWorkspaceId,
        attendanceId,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        checklistQueryKey(resolvedWorkspaceId, attendanceId),
        data,
      );
      invalidateChecklist();
    },
  });

  const replace = useMutation({
    mutationFn: (
      params: Omit<
        ReplaceOperationalAttendanceChecklistParams,
        "workspaceId" | "attendanceId"
      >,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }

      return replaceOperationalAttendanceChecklist({
        ...params,
        workspaceId: resolvedWorkspaceId,
        attendanceId,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        checklistQueryKey(resolvedWorkspaceId, attendanceId),
        data,
      );
      invalidateChecklist();
    },
  });

  return { apply, update, replace };
}

function checklistQueryKey(workspaceId?: string, attendanceId?: string) {
  return ["operation", "attendance-checklist", workspaceId, attendanceId];
}
