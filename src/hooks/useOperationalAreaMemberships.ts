import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { listUsers } from "@/services/user/listUsers";
import { deleteOperationalAreaMembership } from "@/services/operation/deleteOperationalAreaMembership";
import { listOperationalAreaMemberships } from "@/services/operation/listOperationalAreaMemberships";
import { upsertOperationalAreaMembership } from "@/services/operation/upsertOperationalAreaMembership";
import {
  DeleteOperationalAreaMembershipParams,
  UpsertOperationalAreaMembershipParams,
} from "@/types/operation";

export function useOperationalAreaMemberships(
  workspaceId?: string,
  areaId?: string,
  page = 1,
  limit = 100,
) {
  return useQuery({
    queryKey: ["operation-area-memberships", workspaceId, areaId, page, limit],
    queryFn: () => {
      if (!workspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return listOperationalAreaMemberships(workspaceId, areaId, page, limit);
    },
    enabled: Boolean(workspaceId && areaId),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalMembershipCandidates(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-membership-candidates", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listUsers({ workspaceId, page: 1, limit: 100 });
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalAreaMembershipMutations(
  workspaceId?: string,
  areaId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-area-memberships", resolvedWorkspaceId, areaId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-setup", resolvedWorkspaceId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-queue-memberships", resolvedWorkspaceId, areaId],
    });
  };

  const upsert = useMutation({
    mutationFn: (
      params: Omit<
        UpsertOperationalAreaMembershipParams,
        "workspaceId" | "areaId"
      >,
    ) => {
      if (!resolvedWorkspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return upsertOperationalAreaMembership({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
      });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<
        DeleteOperationalAreaMembershipParams,
        "workspaceId" | "areaId"
      >,
    ) => {
      if (!resolvedWorkspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return deleteOperationalAreaMembership({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
      });
    },
    onSuccess: invalidate,
  });

  return { upsert, remove };
}
