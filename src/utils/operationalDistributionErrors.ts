import axios from "axios";

const OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES: Record<string, string> = {
  DISTRIBUTION_NOT_INITIALIZED:
    "A configuração de distribuição ainda não foi inicializada neste workspace.",
  INVALID_DISTRIBUTION_REFERENCES:
    "Uma ou mais exceções não pertencem mais a este workspace ou estão inativas.",
  STALE_VERSION:
    "A configuração foi alterada por outra pessoa. Recarregue os dados e tente novamente.",
  WORKSPACE_NOT_FOUND: "Workspace operacional não encontrado.",
  WORKSPACE_TYPE_INCOMPATIBLE:
    "O workspace atual não é compatível com a configuração operacional.",
  FORBIDDEN: "Você não tem permissão para administrar a distribuição.",
};

export function extractOperationalDistributionErrorCode(
  error: unknown,
): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null) {
      if (typeof (data as { error?: unknown }).error === "string") {
        return (data as { error: string }).error;
      }
      if (typeof (data as { message?: unknown }).message === "string") {
        return (data as { message: string }).message;
      }
    }
  } else if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export function getOperationalDistributionErrorMessage(
  error: unknown,
  fallback = "Não foi possível atualizar a distribuição.",
): string {
  const code = extractOperationalDistributionErrorCode(error);
  if (code && OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES[code]) {
    return OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES[code];
  }

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES.FORBIDDEN;
    }
    if (error.response?.status === 404) {
      return OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES.WORKSPACE_NOT_FOUND;
    }
    if (error.response?.status === 409) {
      return OPERATIONAL_DISTRIBUTION_ERROR_MESSAGES.STALE_VERSION;
    }
    if (error.response?.status && error.response.status >= 500) {
      return "Erro interno ao processar a configuração de distribuição.";
    }
  }

  return fallback;
}

export function isOperationalDistributionStaleVersion(error: unknown): boolean {
  return extractOperationalDistributionErrorCode(error) === "STALE_VERSION";
}
