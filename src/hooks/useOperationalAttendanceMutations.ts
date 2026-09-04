import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { assignAttendance } from "@/services/operation/assignAttendance";
import { cancelOperationalFollowUp } from "@/services/operation/cancelOperationalFollowUp";
import { claimAttendance } from "@/services/operation/claimAttendance";
import { closeAttendance } from "@/services/operation/closeAttendance";
import { createOperationalFollowUp } from "@/services/operation/createOperationalFollowUp";
import { pendingAttendance } from "@/services/operation/pendingAttendance";
import { resumeAttendance } from "@/services/operation/resumeAttendance";
import { routeAttendance } from "@/services/operation/routeAttendance";
import { transferAttendance } from "@/services/operation/transferAttendance";
import { unassignAttendance } from "@/services/operation/unassignAttendance";
import { updateOperationalFollowUp } from "@/services/operation/updateOperationalFollowUp";
import { sendOperationalAttendanceMessage } from "@/services/operation/sendOperationalAttendanceMessage";
import {
  AssignAttendanceParams,
  CancelOperationalFollowUpParams,
  ClaimAttendanceParams,
  CloseAttendanceParams,
  CreateOperationalFollowUpParams,
  PendingAttendanceParams,
  ResumeAttendanceParams,
  RouteAttendanceParams,
  TransferAttendanceParams,
  UnassignAttendanceParams,
  UpdateOperationalFollowUpParams,
  SendOperationalAttendanceMessageParams,
} from "@/types/operation-attendance";
import { isStaleVersionError } from "@/utils/operationalAttendanceErrors";

export function useOperationalAttendanceMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateAttendanceLists = () => {
    if (!resolvedWorkspaceId) return;

    void queryClient.invalidateQueries({
      queryKey: ["operation", "attendances", resolvedWorkspaceId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation", "attendance-kanban", resolvedWorkspaceId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation", "attendance-summary", resolvedWorkspaceId],
    });
  };

  const invalidateAttendanceScope = (attendanceId?: string) => {
    if (!resolvedWorkspaceId) return;

    invalidateAttendanceLists();

    if (attendanceId) {
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance", resolvedWorkspaceId, attendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-events",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-messages",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-timeline",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-commands",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-follow-ups",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-follow-up-occurrences",
          resolvedWorkspaceId,
          attendanceId,
        ],
      });
    }
  };

  const handleMutationError = (error: unknown, attendanceId?: string) => {
    if (resolvedWorkspaceId) {
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-kanban", resolvedWorkspaceId],
      });
    }

    if (isStaleVersionError(error) && resolvedWorkspaceId && attendanceId) {
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance", resolvedWorkspaceId, attendanceId],
      });
    }
  };

  const route = useMutation({
    mutationFn: (
      params: Omit<RouteAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return routeAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const claim = useMutation({
    mutationFn: (
      params: Omit<ClaimAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return claimAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const assign = useMutation({
    mutationFn: (
      params: Omit<AssignAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return assignAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const transfer = useMutation({
    mutationFn: (
      params: Omit<TransferAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return transferAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const unassign = useMutation({
    mutationFn: (
      params: Omit<UnassignAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return unassignAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const pending = useMutation({
    mutationFn: (
      params: Omit<PendingAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return pendingAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const resume = useMutation({
    mutationFn: (
      params: Omit<ResumeAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return resumeAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const close = useMutation({
    mutationFn: (
      params: Omit<CloseAttendanceParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return closeAttendance({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: () => {
      invalidateAttendanceLists();
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const createFollowUp = useMutation({
    mutationFn: (
      params: Omit<CreateOperationalFollowUpParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return createOperationalFollowUp({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const updateFollowUp = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalFollowUpParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return updateOperationalFollowUp({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const cancelFollowUp = useMutation({
    mutationFn: (
      params: Omit<CancelOperationalFollowUpParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return cancelOperationalFollowUp({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  const sendMessage = useMutation({
    mutationFn: (
      params: Omit<SendOperationalAttendanceMessageParams, "workspaceId"> & {
        workspaceId?: string;
      },
    ) => {
      const targetWorkspaceId = params.workspaceId ?? resolvedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return sendOperationalAttendanceMessage({
        ...params,
        workspaceId: targetWorkspaceId,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAttendanceScope(variables.attendanceId);
    },
    onError: (error, variables) => {
      handleMutationError(error, variables.attendanceId);
    },
  });

  return {
    route,
    claim,
    assign,
    transfer,
    unassign,
    pending,
    resume,
    close,
    createFollowUp,
    updateFollowUp,
    cancelFollowUp,
    sendMessage,
    invalidateAttendanceScope,
  };
}
