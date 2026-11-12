import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationalTriageAgentCallbackKey,
  getOperationalTriageAgentCallbackKey,
} from "@/services/operation/createOperationalTriageAgentCallbackKey";
import { revokeOperationalTriageAgentCallbackKey } from "@/services/operation/revokeOperationalTriageAgentCallbackKey";
import { rotateOperationalTriageAgentCallbackKey } from "@/services/operation/rotateOperationalTriageAgentCallbackKey";
import {
  OperationalTriageAgentCallbackKeyParams,
  OperationalTriageAgentCallbackKeyStatus,
} from "@/types/operation-triage-agent";

export function useOperationalTriageAgentCallbackKey(
  params: OperationalTriageAgentCallbackKeyParams,
) {
  const queryClient = useQueryClient();
  const queryKey = [
    "operation-triage-agent-callback-key",
    params.workspaceId,
    params.agentId,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => getOperationalTriageAgentCallbackKey(params),
    enabled: Boolean(params.workspaceId && params.agentId),
  });

  const create = useMutation({
    mutationFn: createOperationalTriageAgentCallbackKey,
    gcTime: 0,
    onSuccess: (result) => {
      queryClient.setQueryData<OperationalTriageAgentCallbackKeyStatus>(
        queryKey,
        {
          configured: result.configured,
          keyPrefix: result.keyPrefix,
          createdAt: result.createdAt,
        },
      );
    },
  });

  const rotate = useMutation({
    mutationFn: rotateOperationalTriageAgentCallbackKey,
    gcTime: 0,
    onSuccess: (result) => {
      queryClient.setQueryData<OperationalTriageAgentCallbackKeyStatus>(
        queryKey,
        {
          configured: result.configured,
          keyPrefix: result.keyPrefix,
          createdAt: result.createdAt,
        },
      );
    },
  });

  const revoke = useMutation({
    mutationFn: revokeOperationalTriageAgentCallbackKey,
    onSuccess: () => {
      queryClient.setQueryData<OperationalTriageAgentCallbackKeyStatus>(
        queryKey,
        { configured: false, keyPrefix: null, createdAt: null },
      );
    },
  });

  return { query, create, rotate, revoke };
}
