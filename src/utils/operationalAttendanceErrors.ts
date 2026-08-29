import axios from "axios";

export const OPERATIONAL_ATTENDANCE_ERROR_MESSAGES: Record<string, string> = {
  // Concorrência e Idempotência
  STALE_VERSION:
    "O atendimento foi modificado por outra ação ou operador. Os dados foram atualizados.",
  IDEMPOTENCY_PAYLOAD_CONFLICT:
    "Esta ação já foi enviada anteriormente com parâmetros divergentes.",

  // Validação de Estado e Destino
  INVALID_STATE:
    "O estado atual do atendimento não permite esta operação.",
  DESTINATION_INACTIVE:
    "A área ou fila de destino está inativa.",
  DESTINATION_WORKSPACE_MISMATCH:
    "A área ou fila de destino não pertence ao workspace atual.",

  // Atribuição e Responsabilidade
  RESPONSIBLE_FIELDS_CONFLICT:
    "Não é possível definir usuário e assistente de IA simultaneamente.",
  ASSISTANT_ASSIGNMENT_NOT_SUPPORTED:
    "Atribuição a assistentes de IA não está habilitada nesta versão.",
  ASSISTANT_TRANSFER_NOT_SUPPORTED:
    "Transferência para assistentes de IA não está habilitada nesta versão.",
  ASSISTANT_NOT_ELIGIBLE:
    "O assistente selecionado não está ativo ou elegível para o destino.",
  USER_NOT_ELIGIBLE:
    "O usuário selecionado não é membro ativo da área ou fila de destino.",

  // Entidades e Tenancy
  WORKSPACE_NOT_FOUND:
    "Workspace operacional não encontrado.",
  WORKSPACE_TYPE_INCOMPATIBLE:
    "O workspace informado não é do tipo operacional.",
  WORKSPACE_TYPE_INVALID:
    "O workspace informado não é do tipo operacional.",
  ATTENDANCE_NOT_FOUND:
    "Atendimento não encontrado ou inacessível no escopo atual.",
  AREA_NOT_FOUND:
    "Área de atendimento não encontrada.",
  QUEUE_NOT_FOUND:
    "Fila de atendimento não encontrada.",
  FOLLOW_UP_NOT_FOUND:
    "Follow-up operacional não encontrado.",
  FOLLOW_UP_ALREADY_CANCELLED:
    "Este follow-up já foi cancelado anteriormente.",

  // Agendamento e Timezone
  INVALID_TIMEZONE:
    "Fuso horário inválido. Utilize um fuso horário IANA válido (ex: America/Sao_Paulo).",
  SCHEDULE_EVALUATION_FAILED:
    "Não foi possível calcular o agendamento com o fuso horário e parâmetros fornecidos.",

  // Permissões
  FORBIDDEN:
    "Você não tem permissão para realizar esta operação de atendimento.",
};

export function extractOperationalErrorCode(error: unknown): string | null {
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

export function getOperationalAttendanceErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro ao processar a operação de atendimento."
): string {
  const code = extractOperationalErrorCode(error);
  if (code && OPERATIONAL_ATTENDANCE_ERROR_MESSAGES[code]) {
    return OPERATIONAL_ATTENDANCE_ERROR_MESSAGES[code];
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) {
      return OPERATIONAL_ATTENDANCE_ERROR_MESSAGES.FORBIDDEN;
    }
    if (status === 404) {
      return "Recurso operacional não encontrado.";
    }
    if (status === 409) {
      return "Conflito ao atualizar atendimento. Tente novamente.";
    }
    if (status && status >= 500) {
      return "Erro interno no servidor ao processar atendimento.";
    }
    if (code) {
      return code;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isStaleVersionError(error: unknown): boolean {
  const code = extractOperationalErrorCode(error);
  return code === "STALE_VERSION";
}

export function isIdempotencyConflictError(error: unknown): boolean {
  const code = extractOperationalErrorCode(error);
  return code === "IDEMPOTENCY_PAYLOAD_CONFLICT";
}

export function isNotFoundError(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return true;
  }
  const code = extractOperationalErrorCode(error);
  return (
    code === "ATTENDANCE_NOT_FOUND" ||
    code === "WORKSPACE_NOT_FOUND" ||
    code === "AREA_NOT_FOUND" ||
    code === "QUEUE_NOT_FOUND" ||
    code === "FOLLOW_UP_NOT_FOUND"
  );
}

export function isForbiddenError(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return true;
  }
  const code = extractOperationalErrorCode(error);
  return (
    code === "FORBIDDEN" ||
    code === "WORKSPACE_TYPE_INCOMPATIBLE" ||
    code === "WORKSPACE_TYPE_INVALID"
  );
}
