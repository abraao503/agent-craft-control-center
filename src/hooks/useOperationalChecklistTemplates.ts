import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalChecklistTemplate } from "@/services/operation/createOperationalChecklistTemplate";
import { deleteOperationalChecklistTemplate } from "@/services/operation/deleteOperationalChecklistTemplate";
import { listOperationalChecklistTemplates } from "@/services/operation/listOperationalChecklistTemplates";
import { updateOperationalChecklistTemplate } from "@/services/operation/updateOperationalChecklistTemplate";
import {
  CreateOperationalChecklistTemplateParams,
  DeleteOperationalChecklistTemplateParams,
  UpdateOperationalChecklistTemplateParams,
} from "@/types/operational-checklist";

export function useOperationalChecklistTemplates(workspaceId?: string) {
  const { userProfile } = useAuth();
  return useQuery({
    queryKey: ["operation-checklist-templates", workspaceId, userProfile?.id],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalChecklistTemplates(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useOperationalChecklistTemplateMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { userProfile } = useAuth();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateTemplates = () => {
    void queryClient.invalidateQueries({
      queryKey: [
        "operation-checklist-templates",
        resolvedWorkspaceId,
        userProfile?.id,
      ],
    });
  };

  const create = useMutation({
    mutationFn: (
      params: Omit<CreateOperationalChecklistTemplateParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalChecklistTemplate({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateTemplates,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalChecklistTemplateParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalChecklistTemplate({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateTemplates,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeleteOperationalChecklistTemplateParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deleteOperationalChecklistTemplate({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateTemplates,
  });

  return { create, update, remove };
}
