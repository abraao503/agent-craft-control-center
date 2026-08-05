import type { DealWebhookExecutionStatus } from "@/types/deal-webhook";

export interface StatusTranslation {
  label: string;
  description: string;
}

export interface ParsedErrorMessage {
  code: string;
  message: string;
  metadata: Record<string, unknown>;
  isRecoverable: boolean;
}

const STATUS_TRANSLATIONS: Record<DealWebhookExecutionStatus, StatusTranslation> = {
  pending: {
    label: "Aguardando Processamento",
    description: "A requisição foi recebida e está aguardando ser processada.",
  },
  processing: {
    label: "Processando",
    description: "A requisição está sendo processada no momento.",
  },
  success: {
    label: "Concluído com Sucesso",
    description:
      "O negócio foi criado com sucesso e todas as operações foram concluídas.",
  },
  success_with_warnings: {
    label: "Concluído com Avisos",
    description:
      "O negócio foi criado, mas algumas operações secundárias (como envio de mensagens) apresentaram problemas.",
  },
  failed: {
    label: "Falhou",
    description: "Não foi possível processar a requisição devido a erros.",
  },
};

const ERROR_TRANSLATIONS: Record<string, { title: string; description: string }> = {
  DEAL_ALREADY_EXISTS: {
    title: "Negócio Já Existe",
    description: "Este cliente já possui um negócio ativo nesta pipeline.",
  },
  PIPELINE_NOT_FOUND: {
    title: "Pipeline Não Encontrada",
    description: "A pipeline especificada não foi encontrada no sistema.",
  },
  PIPELINE_STAGE_NOT_FOUND: {
    title: "Etapa Não Encontrada",
    description: "A etapa da pipeline especificada não foi encontrada.",
  },
  PIPELINE_STAGE_MISMATCH: {
    title: "Etapa Incompatível",
    description: "A etapa selecionada não pertence à pipeline especificada.",
  },
  CUSTOMER_CREATION_FAILED: {
    title: "Erro ao Processar Cliente",
    description: "Não foi possível criar ou localizar o cliente no sistema.",
  },
  DEAL_CREATION_FAILED: {
    title: "Erro ao Criar Negócio",
    description: "Ocorreu um erro ao tentar criar o negócio no sistema.",
  },
  INTERNAL_ERROR: {
    title: "Erro Interno",
    description: "Ocorreu um erro inesperado no processamento.",
  },
  DEAL_NOT_FOUND: {
    title: "Negócio Não Encontrado",
    description: "O negócio não foi encontrado para enviar a automação.",
  },
  WHATSAPP_INTEGRATION_NOT_CONFIGURED: {
    title: "WhatsApp Não Configurado",
    description: "A integração com WhatsApp não está configurada para este funil.",
  },
  CHAT_CREATION_FAILED: {
    title: "Erro ao Criar Conversa",
    description: "Não foi possível criar a conversa no WhatsApp.",
  },
  MESSAGE_SEND_FAILED: {
    title: "Erro ao Enviar Mensagem",
    description: "A mensagem de boas-vindas não pôde ser enviada.",
  },
  MESSAGE_RECORD_FAILED: {
    title: "Erro ao Registrar Mensagem",
    description: "A mensagem foi enviada, mas não foi registrada no banco de dados.",
  },
};

export function getStatusTranslation(status: DealWebhookExecutionStatus) {
  return STATUS_TRANSLATIONS[status];
}

export function getErrorTranslation(errorCode: string) {
  return (
    ERROR_TRANSLATIONS[errorCode] || {
      title: "Erro Desconhecido",
      description: "Ocorreu um erro não identificado durante o processamento.",
    }
  );
}

export function parseErrorMessage(errorMessage: string | null): ParsedErrorMessage | null {
  if (!errorMessage) return null;

  try {
    const parsed: unknown = JSON.parse(errorMessage);
    if (typeof parsed === "object" && parsed !== null) {
      const value = parsed as {
        code?: unknown;
        message?: unknown;
        metadata?: unknown;
        isRecoverable?: unknown;
      };
      return {
        code: typeof value.code === "string" ? value.code : "UNKNOWN",
        message:
          typeof value.message === "string" ? value.message : errorMessage,
        metadata:
          typeof value.metadata === "object" && value.metadata !== null
            ? (value.metadata as Record<string, unknown>)
            : {},
        isRecoverable: value.isRecoverable === true,
      };
    }
  } catch {
    // Fall through to the plain-text representation below.
  }

  return {
    code: "UNKNOWN",
    message: errorMessage,
    metadata: {},
    isRecoverable: false,
  };
}
