import axios from "axios";

const OPERATIONAL_ASSISTANT_ERROR_MESSAGES: Record<string, string> = {
  WORKSPACE_NOT_FOUND: "Ambiente operacional não encontrado.",
  WORKSPACE_TYPE_INCOMPATIBLE:
    "O ambiente atual não é compatível com esta configuração operacional.",
  ASSISTANT_NOT_FOUND: "O Assistente não existe mais neste ambiente.",
  ASSISTANT_IN_USE:
    "Desative as rotas e finalize os atendimentos deste Assistente antes de desativá-lo.",
  IA_MODEL_NOT_FOUND: "O modelo de IA selecionado não está disponível.",
  AVATAR_NOT_FOUND: "O avatar selecionado não está disponível.",
  AVATAR_INVALID: "O arquivo de avatar não é uma imagem válida.",
  CONTENT_NOT_FOUND:
    "Um dos conteúdos selecionados não pertence a este ambiente.",
  PROVIDER_CREDENTIAL_REQUIRED:
    "Informe a credencial do provedor para ativar o Assistente.",
  TRANSCRIPTION_CREDENTIAL_REQUIRED:
    "Informe a credencial de transcrição para ativar a transcrição de áudio.",
  IDEMPOTENCY_PAYLOAD_CONFLICT:
    "Esta criação já foi enviada com outro conteúdo. Recarregue e tente novamente.",
  IDEMPOTENCY_IN_PROGRESS:
    "Esta criação ainda está sendo processada. Aguarde e atualize a lista.",
  INVALID_CLARA_CONFIG:
    "A configuração da Clara precisa de URL e credencial válidas quando estiver ativa.",
  CLARA_HOST_NOT_ALLOWED:
    "O host informado não está permitido pela configuração do ambiente.",
  CLARA_CREDENTIAL_ENCRYPTION_NOT_CONFIGURED:
    "A credencial da Clara não pode ser salva neste ambiente.",
  STALE_VERSION:
    "A configuração foi alterada por outra pessoa. Recarregue os dados e tente novamente.",
};

export function getOperationalAssistantErrorCode(
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

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return undefined;
}

export function getOperationalAssistantErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = getOperationalAssistantErrorCode(error);
  if (code && OPERATIONAL_ASSISTANT_ERROR_MESSAGES[code]) {
    return OPERATIONAL_ASSISTANT_ERROR_MESSAGES[code];
  }

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "Você não tem permissão para administrar este recurso.";
    }
    if (error.response?.status === 404) {
      return OPERATIONAL_ASSISTANT_ERROR_MESSAGES.WORKSPACE_NOT_FOUND;
    }
    if (error.response?.status && error.response.status >= 500) {
      return "O serviço operacional está indisponível no momento.";
    }
  }

  return fallback;
}

export function isOperationalAssistantStaleVersion(error: unknown): boolean {
  return getOperationalAssistantErrorCode(error) === "STALE_VERSION";
}
