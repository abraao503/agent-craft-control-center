import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useCommercialMetaManualAccounts } from "@/hooks/useCommercialMetaManualAccounts";
import {
  getMetaCloudDiagnostic,
  listMetaCloudPhoneNumbers,
  listMetaCloudTemplates,
  syncMetaCloudPhoneNumbers,
  syncMetaCloudTemplates,
} from "@/services/whatsapp/metaCloud";

export function useMetaCloudPipelineConfiguration(
  enabled: boolean,
  canManageIntegrations: boolean,
  workspaceId?: string,
  canViewIntegrations = true,
) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const { currentWorkspace } = useWorkspaceContext();
  const companyId = userProfile?.companyId;
  const commercialWorkspaceId =
    currentWorkspace?.type === "COMMERCIAL" ? workspaceId : undefined;
  const manualAccountsQuery = useCommercialMetaManualAccounts(
    commercialWorkspaceId,
    enabled && canViewIntegrations,
  );

  const diagnosticQuery = useQuery({
    queryKey: ["meta-cloud-diagnostic", workspaceId ?? companyId],
    queryFn: getMetaCloudDiagnostic,
    enabled: enabled && Boolean(companyId),
  });

  const phoneNumbersQuery = useQuery({
    queryKey: ["meta-cloud-phone-numbers", companyId, workspaceId],
    queryFn: async () => {
      if (!commercialWorkspaceId) return listMetaCloudPhoneNumbers();

      const pipelineBindings = new Map(
        (diagnosticQuery.data?.integrations ?? [])
          .filter((item) => item.metaPhoneNumber)
          .map((item) => [item.metaPhoneNumber!.phoneNumberId, item.pipelineId]),
      );

      return (manualAccountsQuery.data ?? []).flatMap((account) =>
        account.phoneNumbers.map((phone) => ({
          ...phone,
          lastSyncedAt: phone.lastSyncedAt,
          assignedPipelineId: pipelineBindings.get(phone.phoneNumberId) ?? null,
        })),
      );
    },
    enabled:
      enabled &&
      Boolean(companyId) &&
      (commercialWorkspaceId
        ? manualAccountsQuery.isSuccess
        : diagnosticQuery.data?.enabled === true),
  });

  const templatesQuery = useQuery({
    queryKey: ["meta-cloud-templates", companyId, workspaceId],
    queryFn: () => listMetaCloudTemplates("APPROVED"),
    enabled: enabled && Boolean(companyId) && diagnosticQuery.data?.enabled === true,
  });

  const syncPhoneNumbersMutation = useMutation({
    mutationFn: syncMetaCloudPhoneNumbers,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["meta-cloud-phone-numbers", companyId, workspaceId],
        data,
      );
      void queryClient.invalidateQueries({
        queryKey: ["meta-cloud-diagnostic", workspaceId ?? companyId],
      });
    },
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: syncMetaCloudTemplates,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["meta-cloud-templates", companyId, workspaceId],
        data,
      );
    },
  });

  const autoSyncQueryKey = useMemo(
    () => ["meta-cloud-phone-numbers-auto-sync", companyId, workspaceId] as const,
    [companyId, workspaceId],
  );
  const autoSyncAttempted =
    companyId !== undefined &&
    queryClient.getQueryData<boolean>(autoSyncQueryKey) === true;

  useEffect(() => {
    if (
      !enabled ||
      Boolean(commercialWorkspaceId) ||
      !canManageIntegrations ||
      !companyId ||
      diagnosticQuery.data?.enabled !== true ||
      diagnosticQuery.data.configured !== true ||
      !phoneNumbersQuery.isSuccess ||
      phoneNumbersQuery.data.length > 0 ||
      syncPhoneNumbersMutation.isPending ||
      autoSyncAttempted
    ) {
      return;
    }

    queryClient.setQueryData(autoSyncQueryKey, true);
    syncPhoneNumbersMutation.mutate();
  }, [
    autoSyncAttempted,
    autoSyncQueryKey,
    canManageIntegrations,
    companyId,
    diagnosticQuery.data,
    enabled,
    phoneNumbersQuery.data,
    phoneNumbersQuery.isSuccess,
    queryClient,
    syncPhoneNumbersMutation,
    commercialWorkspaceId,
    workspaceId,
  ]);

  return {
    diagnosticQuery,
    manualAccountsQuery,
    phoneNumbersQuery,
    templatesQuery,
    syncPhoneNumbersMutation,
    syncTemplatesMutation,
  };
}
