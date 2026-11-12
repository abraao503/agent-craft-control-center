import { createOperationalTriageAgentCallbackKey } from "@/services/operation/createOperationalTriageAgentCallbackKey";
import { OperationalTriageAgentCallbackKeyParams } from "@/types/operation-triage-agent";

// A API usa o mesmo POST para emitir a primeira chave e substituir uma existente.
export async function rotateOperationalTriageAgentCallbackKey(
  params: OperationalTriageAgentCallbackKeyParams,
) {
  return createOperationalTriageAgentCallbackKey(params);
}
