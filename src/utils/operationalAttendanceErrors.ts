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

  // Envio de mensagens
  NOT_CURRENT_ASSIGNEE:
    "Somente o responsável atual pode enviar mensagens neste atendimento.",
  CHANNEL_UNAVAILABLE: "O canal deste atendimento está indisponível.",
  WINDOW_CLOSED:
    "A janela de resposta está encerrada. Use um template aprovado para continuar.",
  TEMPLATE_REQUIRED: "Este atendimento exige o envio de um template aprovado.",
  TEMPLATE_NOT_FOUND: "O template selecionado não está disponível.",
  TEMPLATE_NOT_SUPPORTED: "O template selecionado não é compatível com este canal.",
  TEMPLATE_INVALID: "O template selecionado não está válido para envio.",
  INVALID_TEMPLATE_BINDINGS:
    "Revise os valores preenchidos para os parâmetros do template.",
  REPLY_CONTEXT_STALE:
    "O contexto da resposta mudou. Atualize o atendimento e tente novamente.",
  OPT_IN_REQUIRED: "O contato precisa autorizar o recebimento de mensagens.",
  FILE_REQUIRED: "Selecione um arquivo antes de enviar a mídia.",
  MEDIA_TOO_LARGE: "O arquivo excede o limite de 50 MB.",
  MEDIA_TYPE_NOT_ALLOWED: "O tipo do arquivo não é permitido para esta mídia.",
  MEDIA_NOT_SUPPORTED: "Este canal não aceita o tipo de mídia selecionado.",
  INVALID_CONTENT: "O conteúdo da mensagem não é válido.",
  INVALID_PHONE: "O telefone do contato não está apto para receber mensagens.",
  RATE_LIMITED: "O envio foi temporariamente limitado. Aguarde e tente novamente.",
  PROVIDER_UNAVAILABLE:
    "O provedor do canal está indisponível. Tente novamente em instantes.",
  OPERATIONAL_RUNTIME_NOT_READY:
    "O recebimento de mensagens ainda não está pronto para envio.",
  FAILED_TO_SEND_OPERATIONAL_MESSAGE:
    "Não foi possível enviar a mensagem operacional.",

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
      const errorValue = (data as { error?: unknown }).error;
      const messageValue = (data as { message?: unknown }).message;
      const errorCode = typeof errorValue === "string" ? errorValue : null;
      const messageCode =
        typeof messageValue === "string" ? messageValue : null;

      // Nest serializes structured conflicts as { message: CODE, error: "Conflict" }.
      // Prefer a known domain code over the generic HTTP exception label.
      if (
        messageCode &&
        Object.prototype.hasOwnProperty.call(
          OPERATIONAL_ATTENDANCE_ERROR_MESSAGES,
          messageCode,
        )
      ) {
        return messageCode;
      }
      if (
        errorCode &&
        Object.prototype.hasOwnProperty.call(
          OPERATIONAL_ATTENDANCE_ERROR_MESSAGES,
          errorCode,
        )
      ) {
        return errorCode;
      }

      return messageCode ?? errorCode;
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
