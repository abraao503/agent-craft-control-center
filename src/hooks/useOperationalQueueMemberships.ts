import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { deleteOperationalQueueMembership } from "@/services/operation/deleteOperationalQueueMembership";
import { listOperationalQueueMemberships } from "@/services/operation/listOperationalQueueMemberships";
import { upsertOperationalQueueMembership } from "@/services/operation/upsertOperationalQueueMembership";
import {
  DeleteOperationalQueueMembershipParams,
  UpsertOperationalQueueMembershipParams,
} from "@/types/operation";

export function useOperationalQueueMemberships(
  workspaceId?: string,
  areaId?: string,
  queueId?: string,
  page = 1,
  limit = 100,
) {
  return useQuery({
    queryKey: [
      "operation-queue-memberships",
      workspaceId,
      areaId,
      queueId,
      page,
      limit,
    ],
    queryFn: () => {
      if (!workspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return listOperationalQueueMemberships(
        workspaceId,
        areaId,
        queueId,
        page,
        limit,
      );
    },
    enabled: Boolean(workspaceId && areaId && queueId),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalQueueMembershipMutations(
  workspaceId?: string,
  areaId?: string,
  queueId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: [
        "operation-queue-memberships",
        resolvedWorkspaceId,
        areaId,
        queueId,
      ],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-area-memberships", resolvedWorkspaceId, areaId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-queue", resolvedWorkspaceId, areaId, queueId],
    });
  };

  const upsert = useMutation({
    mutationFn: (
      params: Omit<
        UpsertOperationalQueueMembershipParams,
        "workspaceId" | "areaId" | "queueId"
      >,
    ) => {
      if (!resolvedWorkspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return upsertOperationalQueueMembership({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
        queueId,
      });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<
        DeleteOperationalQueueMembershipParams,
        "workspaceId" | "areaId" | "queueId"
      >,
    ) => {
      if (!resolvedWorkspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return deleteOperationalQueueMembership({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
        queueId,
      });
    },
    onSuccess: invalidate,
  });

  return { upsert, remove };
}
