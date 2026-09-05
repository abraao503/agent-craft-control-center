import {
  OperationalChannelEntryMode,
  OperationalChannelProviderName,
  OperationalChannelRouteMissing,
} from "@/types/operation-channels";

export const OPERATIONAL_CHANNEL_PROVIDER_LABELS: Record<
  OperationalChannelProviderName,
  string
> = {
  "z-api": "Z-API",
  evolux: "Evolux",
  "meta-cloud": "Meta Cloud",
};

export const OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS: Record<
  OperationalChannelEntryMode,
  string
> = {
  TRIAGE: "Triagem",
  QUEUE: "Fila",
  ASSISTANT: "Assistente",
  EXTERNAL_AGENT: "Agente externo",
};

export const OPERATIONAL_CHANNEL_ROUTE_MISSING_LABELS: Record<
  OperationalChannelRouteMissing,
  string
> = {
  route: "rota",
  TRIAGE_AGENT: "agente de triagem",
  ASSISTANT: "Assistente ativo",
  TARGET_AREA: "área de entrada",
  TARGET_QUEUE: "fila de entrada",
  FALLBACK_AREA: "área alternativa",
  FALLBACK_QUEUE: "fila alternativa",
};

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: "Conectado",
  DISCONNECTED: "Desconectado",
  CONNECTING: "Conectando",
  OPEN: "Aberto",
  CLOSE: "Fechado",
  open: "Aberto",
  close: "Fechado",
  connecting: "Conectando",
};

const ERROR_LABELS: Record<string, string> = {
  CHANNEL_ALREADY_EXISTS: "Já existe uma conexão deste provedor neste ambiente.",
  CHANNEL_NOT_FOUND: "A conexão não existe mais neste ambiente.",
  DESTINATION_NOT_FOUND: "Um dos destinos não existe mais ou está inativo.",
  DESTINATION_WORKSPACE_MISMATCH:
    "A fila selecionada não pertence à área informada.",
  IDEMPOTENCY_IN_PROGRESS:
    "Esta alteração ainda está sendo processada. Aguarde e atualize a lista.",
  IDEMPOTENCY_PAYLOAD_CONFLICT:
    "A chave de idempotência já foi usada com outro conteúdo.",
  INVALID_PROVIDER_CONFIGURATION:
    "As credenciais não são compatíveis com este provedor.",
  INVALID_ROUTE_CONFIGURATION:
    "A combinação de destinos não é compatível com o modo da rota.",
  META_PHONE_NUMBER_NOT_FOUND:
    "O número Meta não está sincronizado ou não pertence à empresa.",
  OPERATIONAL_RUNTIME_NOT_READY:
    "O recebimento de mensagens ainda não está disponível. A ativação permanece bloqueada por enquanto.",
  PROVIDER_QR_UNSUPPORTED: "Este provedor não oferece QR Code.",
  PROVIDER_UNAVAILABLE: "Este provedor está indisponível no momento.",
  ROUTE_ALREADY_EXISTS: "Este canal já possui uma rota configurada.",
  ROUTE_INCOMPLETE: "Complete uma rota válida antes de solicitar o QR Code.",
  STALE_VERSION:
    "O recurso foi alterado por outra pessoa. Atualize a lista e tente novamente.",
  ASSISTANT_NOT_FOUND: "O Assistente não está ativo neste ambiente.",
  TRIAGE_AGENT_NOT_FOUND:
    "O agente de triagem não está ativo neste ambiente.",
  HARNESS_DISABLED:
    "O console sintético está desabilitado neste ambiente de execução.",
  EVENT_PROCESSING:
    "O evento foi recebido, mas não pôde ser processado pela operação.",
  EVENT_PAYLOAD_CONFLICT:
    "Já existe um evento sintético com os mesmos identificadores e outro conteúdo.",
  INVALID_CUSTOMER_PHONE: "Informe um telefone válido para o contato.",
};

export function getOperationalErrorCode(error: unknown): string | undefined {
  const responseMessage = (
    error as { response?: { data?: { message?: unknown } } }
  )?.response?.data?.message;

  return typeof responseMessage === "string" ? responseMessage : undefined;
}

export function getOperationalErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = getOperationalErrorCode(error);
  return (code && ERROR_LABELS[code]) || fallback;
}

export function getOperationalStatusLabel(status: string): string {
  return STATUS_LABELS[status] || "Desconhecido";
}

export function formatOperationalDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
