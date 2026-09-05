import axios from "axios";

const TRIAGE_AGENT_ERROR_MESSAGES: Record<string, string> = {
  WORKSPACE_NOT_FOUND: "Ambiente operacional não encontrado.",
  WORKSPACE_TYPE_INCOMPATIBLE:
    "O ambiente atual não é compatível com esta configuração operacional.",
  TRIAGE_AGENT_NOT_FOUND: "O agente de triagem não existe mais neste ambiente.",
  AGENT_NAME_CONFLICT: "Já existe um agente com este nome neste ambiente.",
  INVALID_TRIAGE_AGENT_CONFIG:
    "Revise a URL, o timeout e o número de tentativas do agente.",
  TRIAGE_AGENT_HOST_NOT_ALLOWED:
    "O host informado não está permitido pela política deste ambiente.",
  TRIAGE_AGENT_CREDENTIAL_ENCRYPTION_NOT_CONFIGURED:
    "A credencial não pode ser salva neste ambiente.",
  TRIAGE_AGENT_CREDENTIAL_INVALID: "A credencial do agente foi rejeitada.",
  TRIAGE_AGENT_CONNECTION_FAILED:
    "Não foi possível conectar ao serviço do agente.",
  STALE_VERSION:
    "A configuração foi alterada por outra pessoa. Recarregue e tente novamente.",
  TRIAGE_AGENT_IN_USE:
    "Desative a rota do agente e finalize os atendimentos antes de desativá-lo.",
};

export function getOperationalTriageAgentErrorCode(
  error: unknown,
): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null) {
      if (typeof (data as { message?: unknown }).message === "string") {
        return (data as { message: string }).message;
      }
      if (typeof (data as { error?: unknown }).error === "string") {
        return (data as { error: string }).error;
      }
    }
  }

  return error instanceof Error && error.message ? error.message : undefined;
}

export function getOperationalTriageAgentErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = getOperationalTriageAgentErrorCode(error);
  if (code && TRIAGE_AGENT_ERROR_MESSAGES[code]) {
    return TRIAGE_AGENT_ERROR_MESSAGES[code];
  }

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "Você não tem permissão para administrar os agentes de triagem.";
    }
    if (error.response?.status && error.response.status >= 500) {
      return "O serviço de triagem está indisponível no momento.";
    }
  }

  return fallback;
}

export function isOperationalTriageAgentStaleVersion(error: unknown): boolean {
  return getOperationalTriageAgentErrorCode(error) === "STALE_VERSION";
}
