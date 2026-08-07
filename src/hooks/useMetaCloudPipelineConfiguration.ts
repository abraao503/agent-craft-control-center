import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
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
) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId;

  const diagnosticQuery = useQuery({
    queryKey: ["meta-cloud-diagnostic", companyId],
    queryFn: getMetaCloudDiagnostic,
    enabled: enabled && Boolean(companyId),
  });

  const phoneNumbersQuery = useQuery({
    queryKey: ["meta-cloud-phone-numbers", companyId],
    queryFn: listMetaCloudPhoneNumbers,
    enabled: enabled && Boolean(companyId) && diagnosticQuery.data?.enabled === true,
  });

  const templatesQuery = useQuery({
    queryKey: ["meta-cloud-templates", companyId],
    queryFn: () => listMetaCloudTemplates("APPROVED"),
    enabled: enabled && Boolean(companyId) && diagnosticQuery.data?.enabled === true,
  });

  const syncPhoneNumbersMutation = useMutation({
    mutationFn: syncMetaCloudPhoneNumbers,
    onSuccess: (data) => {
      queryClient.setQueryData(["meta-cloud-phone-numbers", companyId], data);
      void queryClient.invalidateQueries({
        queryKey: ["meta-cloud-diagnostic", companyId],
      });
    },
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: syncMetaCloudTemplates,
    onSuccess: (data) => {
      queryClient.setQueryData(["meta-cloud-templates", companyId], data);
    },
  });

  const autoSyncQueryKey = useMemo(
    () => ["meta-cloud-phone-numbers-auto-sync", companyId] as const,
    [companyId],
  );
  const autoSyncAttempted =
    companyId !== undefined &&
    queryClient.getQueryData<boolean>(autoSyncQueryKey) === true;

  useEffect(() => {
    if (
      !enabled ||
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
  ]);

  return {
    diagnosticQuery,
    phoneNumbersQuery,
    templatesQuery,
    syncPhoneNumbersMutation,
    syncTemplatesMutation,
  };
}
