import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { archiveOperationalChecklistTemplate } from "@/services/operation/archiveOperationalChecklistTemplate";
import { createOperationalChecklistTemplate } from "@/services/operation/createOperationalChecklistTemplate";
import { listOperationalChecklistTemplates } from "@/services/operation/listOperationalChecklistTemplates";
import { updateOperationalChecklistTemplate } from "@/services/operation/updateOperationalChecklistTemplate";
import {
  ArchiveOperationalChecklistTemplateParams,
  CreateOperationalChecklistTemplateParams,
  UpdateOperationalChecklistTemplateParams,
} from "@/types/operational-checklist";

export function useOperationalChecklistTemplates(workspaceId?: string) {
  return useQuery({
    queryKey: ["operation-checklist-templates", workspaceId],
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
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateTemplates = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-checklist-templates", resolvedWorkspaceId],
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

  const archive = useMutation({
    mutationFn: (
      params: Omit<ArchiveOperationalChecklistTemplateParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return archiveOperationalChecklistTemplate({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateTemplates,
  });

  return { create, update, archive };
}
