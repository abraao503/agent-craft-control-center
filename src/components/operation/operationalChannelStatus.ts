import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";

export type OperationalChannelStateKey =
  | "CONFIGURATION_REQUIRED"
  | "DESTINATION_REQUIRED"
  | "READY_TO_ACTIVATE"
  | "AWAITING_CONNECTION"
  | "READY"
  | "PAUSED"
  | "NEEDS_ATTENTION"
  | "UNAVAILABLE";

export type OperationalChannelStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "muted";

export type OperationalChannelStateAction =
  | "configure-destination"
  | "update-credentials"
  | "activate-channel"
  | "generate-qr"
  | "refresh-status"
  | "open-details";

export type OperationalChannelFilterGroup =
  | "ALL"
  | "NEEDS_ACTION"
  | "READY"
  | "PAUSED";

export interface OperationalChannelStateActionSpec {
  action: OperationalChannelStateAction;
  label: string;
}

export interface OperationalChannelStateSpec {
  key: OperationalChannelStateKey;
  label: string;
  description: string;
  tone: OperationalChannelStatusTone;
  nextStep: string;
  priority: number;
  primaryAction: OperationalChannelStateActionSpec | null;
}

export interface OperationalChannelStateInput {
  channel: OperationalChannel;
  route: OperationalChannelRoute | null;
  routeUnavailable: boolean;
  canManageConnection: boolean;
  canManageRoute: boolean;
}

export const OPERATIONAL_CHANNEL_STATE_LABELS: Record<
  OperationalChannelStateKey,
  string
> = {
  CONFIGURATION_REQUIRED: "Configuração necessária",
  DESTINATION_REQUIRED: "Destino necessário",
  READY_TO_ACTIVATE: "Pronto para ativar",
  AWAITING_CONNECTION: "Aguardando conexão",
  READY: "Pronto",
  PAUSED: "Pausado",
  NEEDS_ATTENTION: "Requer atenção",
  UNAVAILABLE: "Indisponível",
};

export const OPERATIONAL_CHANNEL_STATE_PRIORITIES: Record<
  OperationalChannelStateKey,
  number
> = {
  UNAVAILABLE: 8,
  DESTINATION_REQUIRED: 7,
  CONFIGURATION_REQUIRED: 6,
  NEEDS_ATTENTION: 5,
  AWAITING_CONNECTION: 4,
  READY_TO_ACTIVATE: 3,
  PAUSED: 2,
  READY: 1,
};

const STATE_FILTER_GROUP: Record<OperationalChannelStateKey, OperationalChannelFilterGroup> = {
  CONFIGURATION_REQUIRED: "NEEDS_ACTION",
  DESTINATION_REQUIRED: "NEEDS_ACTION",
  READY_TO_ACTIVATE: "NEEDS_ACTION",
  AWAITING_CONNECTION: "NEEDS_ACTION",
  NEEDS_ATTENTION: "NEEDS_ACTION",
  UNAVAILABLE: "NEEDS_ACTION",
  READY: "READY",
  PAUSED: "PAUSED",
};

export function getOperationalChannelFilterGroup(
  state: OperationalChannelStateSpec,
): OperationalChannelFilterGroup {
  return STATE_FILTER_GROUP[state.key];
}

function connectionIsEstablished(channel: OperationalChannel): boolean {
  return ["CONNECTED", "OPEN"].includes(channel.connectionStatus.toUpperCase());
}

function providerReportsError(channel: OperationalChannel): boolean {
  return (
    channel.status.toUpperCase() === "ERROR" ||
    channel.connectionStatus.toUpperCase() === "ERROR"
  );
}

/**
 * Deriva o estado consolidado do canal. Único ponto de verdade para decidir
 * qual problema tem prioridade e qual é o próximo passo do usuário.
 */
export function deriveOperationalChannelState(
  input: OperationalChannelStateInput,
): OperationalChannelStateSpec {
  const { channel, route, routeUnavailable, canManageConnection, canManageRoute } =
    input;
  const canConfigureRoute = canManageRoute;
  const canManageConnectionActions = canManageConnection;
  const connectionEstablished = connectionIsEstablished(channel);

  if (routeUnavailable) {
    return {
      key: "UNAVAILABLE",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.UNAVAILABLE,
      description:
        "Não foi possível confirmar o destino deste canal no momento. Atualize o canal para tentar novamente.",
      tone: "danger",
      nextStep: "Atualizar status do canal",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.UNAVAILABLE,
      primaryAction: canManageConnectionActions
        ? { action: "refresh-status", label: "Atualizar canal" }
        : null,
    };
  }

  const routeConfigured = channel.route.configured;
  const routeValid =
    routeConfigured && channel.route.configurationStatus === "VALID";

  if (!routeConfigured) {
    return {
      key: "DESTINATION_REQUIRED",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.DESTINATION_REQUIRED,
      description: canConfigureRoute
        ? "Defina o destino das mensagens deste canal para liberar a ativação."
        : "O destino das mensagens ainda não está pronto neste ambiente.",
      tone: "warning",
      nextStep: "Definir destino das mensagens",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.DESTINATION_REQUIRED,
      primaryAction: canConfigureRoute
        ? { action: "configure-destination", label: "Definir destino" }
        : null,
    };
  }

  if (!routeValid) {
    return {
      key: "DESTINATION_REQUIRED",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.DESTINATION_REQUIRED,
      description: canConfigureRoute
        ? "Complete o destino das mensagens para liberar o canal."
        : "O destino das mensagens precisa ser completado neste ambiente.",
      tone: "warning",
      nextStep: "Completar destino das mensagens",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.DESTINATION_REQUIRED,
      primaryAction: canConfigureRoute
        ? { action: "configure-destination", label: "Completar destino" }
        : null,
    };
  }

  if (!channel.active) {
    return {
      key: "PAUSED",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.PAUSED,
      description: canManageConnectionActions
        ? "O canal está pausado. Ative quando quiser voltar a receber mensagens."
        : "O canal está pausado neste ambiente.",
      tone: "muted",
      nextStep: "Ativar canal",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.PAUSED,
      primaryAction: canManageConnectionActions
        ? { action: "activate-channel", label: "Ativar canal" }
        : null,
    };
  }

  if (providerReportsError(channel)) {
    return {
      key: "NEEDS_ATTENTION",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.NEEDS_ATTENTION,
      description:
        "O provedor reportou um problema nesta conexão. Consulte o diagnóstico para resolver.",
      tone: "danger",
      nextStep: "Verificar diagnóstico técnico",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.NEEDS_ATTENTION,
      primaryAction: { action: "open-details", label: "Ver diagnóstico" },
    };
  }

  if (!channel.credentialsConfigured) {
    return {
      key: "CONFIGURATION_REQUIRED",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.CONFIGURATION_REQUIRED,
      description: canManageConnectionActions
        ? "As credenciais deste canal estão incompletas. Atualize-as para conectar o provedor."
        : "As credenciais deste canal ainda não estão completas.",
      tone: "warning",
      nextStep: "Atualizar credenciais",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.CONFIGURATION_REQUIRED,
      primaryAction: canManageConnectionActions
        ? { action: "update-credentials", label: "Atualizar credenciais" }
        : null,
    };
  }

  if (!connectionEstablished) {
    const supportsQr = channel.capabilities.supportsQr;
    return {
      key: "AWAITING_CONNECTION",
      label: OPERATIONAL_CHANNEL_STATE_LABELS.AWAITING_CONNECTION,
      description: supportsQr
        ? "O provedor ainda não está conectado. Gere o QR Code para concluir a conexão."
        : "A conexão está em andamento com o provedor. Atualize o status para conferir o progresso.",
      tone: "warning",
      nextStep: supportsQr ? "Gerar QR Code" : "Atualizar status",
      priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.AWAITING_CONNECTION,
      primaryAction: supportsQr
        ? canManageConnectionActions
          ? { action: "generate-qr", label: "Gerar QR Code" }
          : null
        : { action: "refresh-status", label: "Atualizar canal" },
    };
  }

  return {
    key: "READY",
    label: OPERATIONAL_CHANNEL_STATE_LABELS.READY,
    description:
      "Canal pronto para receber mensagens com o destino definido para este ambiente.",
    tone: "success",
    nextStep: "Nenhuma pendência neste canal",
    priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.READY,
    primaryAction: null,
  };
}

/**
 * Estado reservado para "Pronto para ativar": o canal tem destino e conexão
 * válidos, mas a ativação ainda não foi feita. Derivado fora da função
 * principal para não duplicar a lógica da lista.
 */
export function deriveOperationalChannelStateWithActivation(
  input: OperationalChannelStateInput,
): OperationalChannelStateSpec {
  const state = deriveOperationalChannelState(input);
  if (state.key !== "PAUSED") {
    return state;
  }

  const { channel } = input;
  const connectionEstablished = connectionIsEstablished(channel);
  if (!connectionEstablished) {
    return state;
  }

  return {
    key: "READY_TO_ACTIVATE",
    label: OPERATIONAL_CHANNEL_STATE_LABELS.READY_TO_ACTIVATE,
    description: input.canManageConnection
      ? "Destino e conexão estão válidos. Ative o canal para começar a receber mensagens."
      : "O canal pode ser ativado pelo administrador quando necessário.",
    tone: "muted",
    nextStep: "Ativar canal",
    priority: OPERATIONAL_CHANNEL_STATE_PRIORITIES.READY_TO_ACTIVATE,
    primaryAction: input.canManageConnection
      ? { action: "activate-channel", label: "Ativar canal" }
      : null,
  };
}

export function describeOperationalChannelDestination(
  route: OperationalChannelRoute,
): string {
  if (route.entryMode === "TRIAGE") {
    return "Triagem operacional";
  }

  if (route.entryMode === "QUEUE") {
    return `${route.destinations.targetArea?.name || "Área indisponível"} → ${
      route.destinations.targetQueue?.name || "Fila indisponível"
    }`;
  }

  if (route.entryMode === "EXTERNAL_AGENT") {
    const handoff =
      route.destinations.handoffArea?.name && route.destinations.handoffQueue?.name
        ? ` · encaminhamento: ${route.destinations.handoffArea.name} → ${
            route.destinations.handoffQueue.name
          }`
        : "";
    return `Integração de triagem: ${
      route.destinations.triageAgent?.name || "integração indisponível"
    }${handoff}`;
  }

  return `${
    route.destinations.assistant?.name || "Agente de atendimento indisponível"
  } → alternativa: ${
    route.destinations.fallbackArea?.name || "Área indisponível"
  } / ${route.destinations.fallbackQueue?.name || "Fila indisponível"}`;
}
