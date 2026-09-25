import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
import { clearOperationalChecklistPreference } from "@/services/operation/clearOperationalChecklistPreference";
import { getOperationalChecklistPreference } from "@/services/operation/getOperationalChecklistPreference";
import { setOperationalChecklistPreference } from "@/services/operation/setOperationalChecklistPreference";
import {
  OperationalChecklistPreference,
  SetOperationalChecklistPreferenceParams,
} from "@/types/operational-checklist";

const preferenceQueryKey = (workspaceId?: string) => [
  "operation-checklist-preference",
  workspaceId,
];

export function useOperationalChecklistPreference(
  workspaceId?: string,
  enabled = true,
) {
  const { userProfile } = useAuth();
  return useQuery({
    queryKey: [...preferenceQueryKey(workspaceId), userProfile?.id],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalChecklistPreference(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalChecklistPreferenceMutations(
  workspaceId?: string,
) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const queryKey = [...preferenceQueryKey(workspaceId), userProfile?.id];

  const set = useMutation({
    mutationFn: (
      params: Omit<SetOperationalChecklistPreferenceParams, "workspaceId">,
    ) => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return setOperationalChecklistPreference({ ...params, workspaceId });
    },
    onSuccess: (preference: OperationalChecklistPreference) => {
      queryClient.setQueryData(queryKey, preference);
    },
  });

  const clear = useMutation({
    mutationFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return clearOperationalChecklistPreference(workspaceId);
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null);
    },
  });

  return { set, clear };
}
