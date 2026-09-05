import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalTriageAgent } from "@/services/operation/createOperationalTriageAgent";
import { deactivateOperationalTriageAgent } from "@/services/operation/deactivateOperationalTriageAgent";
import { listOperationalTriageAgents } from "@/services/operation/listOperationalTriageAgents";
import { testOperationalTriageAgent } from "@/services/operation/testOperationalTriageAgent";
import { updateOperationalTriageAgent } from "@/services/operation/updateOperationalTriageAgent";
import {
  CreateOperationalTriageAgentBody,
  DeactivateOperationalTriageAgentParams,
  TestOperationalTriageAgentParams,
  UpdateOperationalTriageAgentParams,
} from "@/types/operation-triage-agent";

export function useOperationalTriageAgents(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-triage-agents", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalTriageAgents(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalTriageAgentMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateState = async () => {
    if (!resolvedWorkspaceId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["operation-triage-agents", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-route-triage-agents", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-channel-routes", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-channels", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-setup", resolvedWorkspaceId],
      }),
    ]);
  };

  const create = useMutation({
    mutationFn: (body: CreateOperationalTriageAgentBody) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalTriageAgent({
        workspaceId: resolvedWorkspaceId,
        body,
      });
    },
    onSuccess: invalidateState,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalTriageAgentParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalTriageAgent({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateState,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeactivateOperationalTriageAgentParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deactivateOperationalTriageAgent({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateState,
  });

  const test = useMutation({
    mutationFn: (
      params: Omit<TestOperationalTriageAgentParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return testOperationalTriageAgent({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
  });

  return { create, update, remove, test };
}
