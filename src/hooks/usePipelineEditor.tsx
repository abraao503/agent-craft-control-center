import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { useUnsavedChanges } from "@/contexts/unsaved-changes/UnsavedChangesContext";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { createPipeline } from "@/services/pipeline/createPipeline";
import {
  updatePipeline,
  UpdatePipelineStageItem,
} from "@/services/pipeline/updatePipeline";
import { getAgent } from "@/services/agent/getAgent";
import { listCompanyWhatsAppIntegrations } from "@/services/whatsapp/listCompanyWhatsAppIntegrations";
import { getCompanyWhatsAppIntegration } from "@/services/whatsapp/getCompanyWhatsAppIntegration";
import {
  configureMetaCloudPipelineIntegration,
  disconnectMetaCloudPipelineIntegration,
} from "@/services/whatsapp/metaCloud";
import {
  AssistantPipelineStage,
  CreatePipelineInput,
  CreatePipelineStageInput,
  PipelineStageMinimal,
  WhatsAppIntegrationConfig,
} from "@/types/pipeline";
import { AgentFormData } from "@/types/agent";
import {
  WHATSAPP_INTEGRATION_NAMES,
  WhatsAppIntegrationName,
} from "@/types/whatsapp-integration";
import { convertHtmlStringToText } from "@/lib/utils";
import { useAuth } from "@/contexts/auth/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { CompanyWhatsAppIntegrationFull } from "@/types/whatsapp";

export type PipelineEditorTab = "stages" | "agent" | "config";

export interface PipelineEditorResult {
  isCreating: boolean;
  pipelineId?: string;
  workspaceId?: string;
  activeTab: PipelineEditorTab;
  setActiveTab: (tab: PipelineEditorTab) => void;
  isSaving: boolean;
  pipelineName: string;
  handlePipelineNameChange: (name: string) => void;
  stages: PipelineStageMinimal[];
  focusedStageError: { stageId: string; ruleIndex?: number } | null;
  useAgent: boolean;
  handleUseAgentChange: (value: boolean) => void;
  agentFormData: AgentFormData;
  updateAgentFormData: (data: Partial<AgentFormData>) => void;
  useWhatsApp: boolean;
  handleUseWhatsAppChange: (value: boolean) => void;
  whatsAppIntegrationName: WhatsAppIntegrationName;
  handleWhatsAppIntegrationNameChange: (value: WhatsAppIntegrationName) => void;
  initialStageOrder: number;
  handleInitialStageOrderChange: (value: number) => void;
  externalToken: string;
  handleExternalTokenChange: (value: string) => void;
  externalClientToken: string;
  handleExternalClientTokenChange: (value: string) => void;
  postbackUrl: string;
  handlePostbackUrlChange: (value: string) => void;
  metaPhoneNumberId: string | null;
  handleMetaPhoneNumberIdChange: (value: string | null) => void;
  metaCloudEnabled: boolean;
  canUpdatePipeline: boolean;
  canManageIntegrations: boolean;
  metaIntegration?: CompanyWhatsAppIntegrationFull | null;
  currentPipeline?: { id: string; assistantId?: string | null; companyWhatsappIntegrationId?: string | null; name: string };
  availableWhatsAppIntegrations: Awaited<ReturnType<typeof listCompanyWhatsAppIntegrations>>;
  isAgentLoading: boolean;
  isAgentConfigured: boolean;
  handleStagesChange: (stages: PipelineStageMinimal[]) => void;
  handleLoadDeletedAgent: (agentData: AgentFormData) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
}

type PipelineValidationPath = Array<string | number>;

interface PipelineApiError {
  message?: string | string[];
  path?: PipelineValidationPath;
}

interface SaveErrorFeedback {
  message: string;
  tab?: PipelineEditorTab;
  stageIndex?: number;
  ruleIndex?: number;
}

const defaultAgentFormData: AgentFormData = {
  name: "",
  description: "",
  avatarUrl: undefined,
  timeZone: "America/Sao_Paulo",
  language: "pt-BR",
  skipMessages: [],
  iaModelId: "",
  iaProviderApiKey: "",
  function: "",
  style: "",
  instructions: "",
  blacklist: "",
  links: [],
  contents: [],
  customFields: [],
  followUps: [],
  entryTags: [],
  googleCalendarIntegrationId: null,
  transitionDecisionMode: "CONVERSATIONAL",
};

const getDefaultCreateStages = (): PipelineStageMinimal[] => {
  const base = [
    { name: "Qualificado", color: "#4f46e5", winProbability: 100 },
    { name: "Contato Realizado", color: "#0ea5e9", winProbability: 100 },
    { name: "Demonstração Agendada", color: "#10b981", winProbability: 100 },
    { name: "Proposta Feita", color: "#f59e0b", winProbability: 100 },
    { name: "Negociações Iniciadas", color: "#ef4444", winProbability: 100 },
  ];

  return base.map((stage, index) => ({
    id: `tmp-${index + 1}`,
    ...stage,
    order: index,
  }));
};

const normalizeAssistantPipelineStage = (
  config?: AssistantPipelineStage | null,
): AssistantPipelineStage | null | undefined => {
  if (!config) return config;

  return {
    ...config,
    assistantAllowedTargetStages: config.assistantAllowedTargetStages.map(
      ({ moveCondition, ...rule }) =>
        moveCondition?.trim()
          ? { ...rule, moveCondition: moveCondition.trim() }
          : rule,
    ),
  };
};

const getSaveErrorFeedback = (error: unknown): SaveErrorFeedback => {
  const apiError = (error as { response?: { data?: PipelineApiError } })
    ?.response?.data;
  const path = apiError?.path;
  const message = Array.isArray(apiError?.message)
    ? apiError.message[0]
    : apiError?.message;

  if (message === "Invalid API key") {
    return {
      message:
        "Chave de API inválida. Verifique a chave do provedor de IA e tente novamente.",
      tab: "agent",
    };
  }

  if (path?.[0] === "stages" && typeof path[1] === "number") {
    const stageIndex = path[1];
    const rulePathIndex = path.indexOf("assistantAllowedTargetStages");
    const targetPathPart =
      rulePathIndex >= 0 ? path[rulePathIndex + 1] : undefined;
    const targetIndex =
      typeof targetPathPart === "number" ? targetPathPart : undefined;
    const field = [...path]
      .reverse()
      .find((part): part is string => typeof part === "string");

    if (rulePathIndex >= 0) {
      if (targetIndex === undefined) {
        return {
          message: `Etapa ${stageIndex + 1}: adicione pelo menos uma regra de movimentação ou desative a automação do agente.`,
          tab: "stages",
          stageIndex,
        };
      }

      return {
        message:
          field === "moveCondition" || field === "criteria"
            ? `Etapa ${stageIndex + 1}, regra ${targetIndex + 1}: informe pelo menos uma condição de movimentação.`
            : `Etapa ${stageIndex + 1}, regra ${targetIndex + 1}: revise o campo informado na automação do agente.`,
        tab: "stages",
        stageIndex,
        ruleIndex: targetIndex,
      };
    }

    const fieldMessages: Record<string, string> = {
      name: "Informe o nome da etapa.",
      order: "A ordem da etapa é inválida.",
      winProbability: "A probabilidade da etapa deve estar entre 0 e 100.",
      minInactiveChatTimeHours:
        "O tempo de inatividade do follow-up deve ser de pelo menos 1 hora.",
      maxMessages: "O número de mensagens de follow-up é inválido.",
      messages: "Adicione uma mensagem válida de follow-up.",
      startTime: "Revise o horário de início do follow-up.",
      endTime: "Revise o horário de término do follow-up.",
    };

    return {
      message: `Etapa ${stageIndex + 1}: ${fieldMessages[String(field)] ?? "revise o campo informado."}`,
      tab: "stages",
      stageIndex,
    };
  }

  if (path?.[0] === "assistant") {
    return { message: "Revise os dados informados para o agente.", tab: "agent" };
  }

  if (path?.[0] === "whatsappIntegration") {
    return {
      message: "Revise a configuração da integração do WhatsApp.",
      tab: "config",
    };
  }

  return {
    message:
      message && !message.startsWith("String must")
        ? message
        : "Não foi possível salvar o funil e o agente. Tente novamente.",
  };
};

export function usePipelineEditor(): PipelineEditorResult {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { has } = usePermissions();
  const isCreating = !pipelineId;
  const { setDirty, requestNavigation } = useUnsavedChanges();
  const { workspaceId } = useWorkspaceManager({
    queryKeys: ["listPipelineStages", "listPipelines", "listAgent", "getAgent"],
    autoRefetch: true,
  });

  const [activeTab, setActiveTab] = useState<PipelineEditorTab>("stages");
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineName, setPipelineName] = useState("");
  const [stages, setStages] = useState<PipelineStageMinimal[]>([]);
  const [focusedStageError, setFocusedStageError] = useState<{
    stageId: string;
    ruleIndex?: number;
  } | null>(null);
  const [useAgent, setUseAgent] = useState(false);
  const [agentFormData, setAgentFormData] =
    useState<AgentFormData>(defaultAgentFormData);
  const [apiKeyChanged, setApiKeyChanged] = useState(false);
  const initialApiKeyRef = useRef("");
  const hasInitializedDataRef = useRef(false);
  const [useWhatsApp, setUseWhatsApp] = useState(false);
  const [whatsAppIntegrationName, setWhatsAppIntegrationName] =
    useState<WhatsAppIntegrationName>(WHATSAPP_INTEGRATION_NAMES.ZAPI);
  const [initialStageOrder, setInitialStageOrder] = useState(0);
  const [externalToken, setExternalToken] = useState("");
  const [externalClientToken, setExternalClientToken] = useState("");
  const [postbackUrl, setPostbackUrl] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState<string | null>(null);
  const consumedMetaQueryRef = useRef(false);
  const metaSelectionFromQueryRef = useRef(false);

  const metaCloudEnabled = Boolean(userProfile?.metaCloudWhatsappEnabled);
  const canUpdatePipeline = has(
    isCreating ? "create:pipeline" : "update:pipeline",
  );
  const canManageIntegrations = has("manage:integrations");

  useEffect(() => {
    hasInitializedDataRef.current = false;
    consumedMetaQueryRef.current = false;
    metaSelectionFromQueryRef.current = false;
    setDirty(false);
  }, [pipelineId, setDirty]);

  useEffect(() => {
    if (consumedMetaQueryRef.current) return;

    const provider = searchParams.get("provider");
    const tab = searchParams.get("tab");
    if (provider !== WHATSAPP_INTEGRATION_NAMES.META_CLOUD && tab !== "config") {
      consumedMetaQueryRef.current = true;
      return;
    }

    if (provider === WHATSAPP_INTEGRATION_NAMES.META_CLOUD) {
      metaSelectionFromQueryRef.current = true;
      setUseWhatsApp(true);
      setWhatsAppIntegrationName(WHATSAPP_INTEGRATION_NAMES.META_CLOUD);
      const order = Number(searchParams.get("initialStageOrder"));
      if (Number.isInteger(order) && order >= 0) setInitialStageOrder(order);
    }
    if (tab === "config" || provider === WHATSAPP_INTEGRATION_NAMES.META_CLOUD) {
      setActiveTab("config");
    }

    consumedMetaQueryRef.current = true;
    navigate(location.pathname, { replace: true });
  }, [location.pathname, navigate, searchParams]);

  const updateAgentFormData = (data: Partial<AgentFormData>) => {
    if (hasInitializedDataRef.current) setDirty(true);
    if (
      data.iaProviderApiKey !== undefined &&
      data.iaProviderApiKey !== initialApiKeyRef.current
    ) {
      setApiKeyChanged(true);
    }
    setAgentFormData((previous) => ({ ...previous, ...data }));
  };

  const stagesQuery = useQuery({
    queryKey: ["listPipelineStages", pipelineId, workspaceId],
    queryFn: () => listPipelineStages(pipelineId!, workspaceId!),
    enabled: Boolean(pipelineId && workspaceId),
  });

  const pipelinesQuery = useQuery({
    queryKey: ["listPipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  const whatsappIntegrationsQuery = useQuery({
    queryKey: ["listCompanyWhatsAppIntegrations", workspaceId],
    queryFn: () => listCompanyWhatsAppIntegrations(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  const currentPipeline = useMemo(
    () => pipelinesQuery.data?.find((pipeline) => pipeline.id === pipelineId),
    [pipelinesQuery.data, pipelineId],
  );

  const agentQuery = useQuery({
    queryKey: ["getAgent", currentPipeline?.assistantId, workspaceId],
    queryFn: () => getAgent(currentPipeline!.assistantId!, workspaceId!),
    enabled: Boolean(currentPipeline?.assistantId && workspaceId),
  });

  const whatsappIntegrationQuery = useQuery({
    queryKey: [
      "getCompanyWhatsAppIntegration",
      currentPipeline?.companyWhatsappIntegrationId,
    ],
    queryFn: () =>
      getCompanyWhatsAppIntegration(
        currentPipeline!.companyWhatsappIntegrationId!,
      ),
    enabled: Boolean(currentPipeline?.companyWhatsappIntegrationId),
  });

  useEffect(() => {
    const data = whatsappIntegrationQuery.data;
    if (!data) return;

    const preserveRequestedMeta = metaSelectionFromQueryRef.current;
    if (!preserveRequestedMeta) {
      setUseWhatsApp(true);
      setWhatsAppIntegrationName(data.whatsappIntegrationName);
    }
    setExternalToken(data.externalToken || "");
    setExternalClientToken(data.externalClientToken || "");
    setPostbackUrl(data.postbackUrl || "");
    if (!preserveRequestedMeta || data.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD) {
      setMetaPhoneNumberId(data.metaPhoneNumberId || null);
    }

    if (
      data.initialPipelineStageOrder !== undefined &&
      (!preserveRequestedMeta ||
        data.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD)
    ) {
      setInitialStageOrder(data.initialPipelineStageOrder);
    } else {
      const stageIndex = stages.findIndex(
        (stage) => stage.id === data.initialPipelineStageId,
      );
      if (stageIndex !== -1) setInitialStageOrder(stageIndex);
    }
  }, [whatsappIntegrationQuery.data, stages]);

  useEffect(() => {
    if (hasInitializedDataRef.current) return;

    if (stagesQuery.data) {
      const normalizedStages = stagesQuery.data.map((stage, _, allStages) => {
        let assistantPipelineStage = stage.assistantPipelineStage;
        if (assistantPipelineStage?.assistantAllowedTargetStages) {
          assistantPipelineStage = {
            ...assistantPipelineStage,
            assistantAllowedTargetStages:
              assistantPipelineStage.assistantAllowedTargetStages.map(
                (target) => {
                  let targetStageOrder = target.targetStageOrder;
                  let targetStageId = target.targetStageId;

                  if (targetStageOrder === undefined && targetStageId) {
                    const targetIndex = allStages.findIndex(
                      (item) => item.id === targetStageId,
                    );
                    targetStageOrder = targetIndex !== -1 ? targetIndex : -1;
                  }

                  if (targetStageOrder !== undefined && !targetStageId) {
                    const targetStage = allStages.find(
                      (item) =>
                        item.order === targetStageOrder ||
                        allStages.indexOf(item) === targetStageOrder,
                    );
                    if (targetStage) targetStageId = targetStage.id;
                  }

                  return { ...target, targetStageOrder, targetStageId };
                },
              ),
          };
        }

        return { ...stage, assistantPipelineStage };
      });
      setStages(normalizedStages);
    }

    if (currentPipeline) {
      setPipelineName(currentPipeline.name);
      setUseAgent(Boolean(currentPipeline.assistantId));
    }

    if (agentQuery.data) {
      const agent = agentQuery.data;
      setAgentFormData({
        name: agent.name,
        description: agent.description,
        avatarUrl: agent.avatar?.url || undefined,
        timeZone: agent.timeZone,
        language: agent.language,
        skipMessages: agent.skipMessages,
        iaModelId: agent.iaModel.id,
        iaProviderApiKey: "",
        function: agent.prompt.function,
        style: agent.prompt.style,
        instructions: agent.prompt.instructions,
        blacklist: agent.prompt.blacklist,
        links: agent.prompt.links,
        contents: agent.contents,
        customFields: agent.customFields,
        followUps: agent.followUps,
        entryTags: agent.entryTags || [],
        googleCalendarIntegrationId: agent.googleCalendarIntegrationId || null,
        transitionDecisionMode: agent.transitionDecisionMode || "CONVERSATIONAL",
      });
      initialApiKeyRef.current = "";
      hasInitializedDataRef.current = true;
    } else if (isCreating) {
      setUseAgent(false);
      setAgentFormData({
        ...defaultAgentFormData,
        name: "Agente do Funil",
        description: "Agente de IA configurado para este funil",
      });
      setPipelineName("Novo funil");
      setStages(getDefaultCreateStages());
      setApiKeyChanged(false);
      initialApiKeyRef.current = "";
      hasInitializedDataRef.current = true;
    } else if (currentPipeline && !currentPipeline.assistantId) {
      hasInitializedDataRef.current = true;
    }
  }, [stagesQuery.data, currentPipeline, agentQuery.data, isCreating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (agentFormData.iaProviderApiKey && !apiKeyChanged) {
        setAgentFormData((previous) => ({ ...previous, iaProviderApiKey: "" }));
      }
    }, 1000);

    return () => clearTimeout(timer);
    // The autocomplete check intentionally runs only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAgentConfigured = useMemo(() => {
    if (!useAgent) return false;

    return Boolean(
      agentFormData.name.trim() &&
        agentFormData.description.trim() &&
        agentFormData.timeZone.trim() &&
        agentFormData.language.trim() &&
        agentFormData.iaModelId.trim() &&
        agentFormData.function.trim() &&
        agentFormData.style.trim(),
    );
  }, [useAgent, agentFormData]);

  const validateAgent = () => {
    const errors: string[] = [];
    if (!useAgent) return { valid: true, errors };

    if (!agentFormData.name || agentFormData.name.trim().length < 3)
      errors.push("Nome do agente deve ter no mínimo 3 caracteres");
    if (!agentFormData.description || agentFormData.description.trim().length < 3)
      errors.push("Descrição do agente deve ter no mínimo 3 caracteres");
    if (!agentFormData.timeZone?.trim()) errors.push("Fuso horário é obrigatório");
    if (!agentFormData.language || !["pt-BR", "en-US", "es-ES"].includes(agentFormData.language))
      errors.push("Idioma inválido (pt-BR, en-US ou es-ES)");
    if (!agentFormData.iaModelId?.trim()) errors.push("Modelo de IA é obrigatório");

    if (isCreating || apiKeyChanged) {
      if (!agentFormData.iaProviderApiKey?.trim())
        errors.push("Chave de API do provedor é obrigatória");
    }

    if (!agentFormData.function || agentFormData.function.trim().length < 3)
      errors.push("Função do agente deve ter no mínimo 3 caracteres");
    if (!agentFormData.style || agentFormData.style.trim().length < 3)
      errors.push("Estilo do agente deve ter no mínimo 3 caracteres");

    const instructionsText = convertHtmlStringToText(agentFormData.instructions);
    if (!instructionsText || instructionsText.trim().length < 3)
      errors.push("Instruções do agente devem ter no mínimo 3 caracteres");

    agentFormData.links?.forEach((link, index) => {
      if (!link.name || link.name.trim().length < 3)
        errors.push(`Link #${index + 1}: Nome deve ter no mínimo 3 caracteres`);
      try {
        new URL(link.url);
      } catch {
        errors.push(`Link #${index + 1}: URL inválida`);
      }
    });

    if (agentFormData.customFields?.length) {
      const identifierCount = agentFormData.customFields.filter(
        (field) => field.isIdentifier,
      ).length;
      if (identifierCount > 1)
        errors.push("Apenas um campo pode ser marcado como identificador");

      agentFormData.customFields.forEach((field, index) => {
        if (!field.name || field.name.trim().length < 3)
          errors.push(`Campo #${index + 1}: Nome deve ter no mínimo 3 caracteres`);
        if (!field.label || field.label.trim().length < 3)
          errors.push(`Campo #${index + 1}: Label deve ter no mínimo 3 caracteres`);
        if (!["text", "number", "boolean"].includes(field.type))
          errors.push(`Campo #${index + 1}: Tipo inválido (text, number ou boolean)`);
      });
    }

    return { valid: errors.length === 0, errors };
  };

  const validateStages = () => {
    const errors: string[] = [];
    if (!stages.length) {
      errors.push("Pelo menos uma etapa é obrigatória");
      return { valid: false, errors };
    }

    const stageOrders = new Set<number>();
    stages.forEach((stage, index) => {
      if (!stage.name?.trim()) errors.push(`Etapa #${index + 1}: Nome é obrigatório`);
      if (typeof stage.order !== "number" || stage.order < 0) {
        errors.push(`Etapa #${index + 1}: Ordem inválida`);
      } else {
        stageOrders.add(stage.order);
      }
      if (
        stage.winProbability !== undefined &&
        (stage.winProbability < 0 || stage.winProbability > 100)
      ) {
        errors.push(`Etapa #${index + 1}: Probabilidade deve estar entre 0 e 100`);
      }

      const assistantTargets =
        stage.assistantPipelineStage?.assistantAllowedTargetStages;
      if (assistantTargets) {
        if (!assistantTargets.length)
          errors.push(
            `Etapa #${index + 1}: adicione ao menos uma regra de movimentação ou desative a automação do agente`,
          );

        assistantTargets.forEach((target, targetIndex) => {
          if (
            typeof target.targetStageOrder !== "number" ||
            target.targetStageOrder < 0
          ) {
            errors.push(
              `Etapa #${index + 1}, Movimentação #${targetIndex + 1}: Ordem da etapa destino inválida`,
            );
          }
          if (
            (!target.moveCondition || !target.moveCondition.trim()) &&
            !target.criteria?.some((criterion) => criterion.trim())
          ) {
            errors.push(
              `Etapa #${index + 1}, Movimentação #${targetIndex + 1}: Adicione uma condição de movimento`,
            );
          }
        });
      }

      const config = stage.reengagementConfig;
      if (config) {
        if (config.minInactiveChatTimeHours < 1)
          errors.push(`Etapa #${index + 1}: Tempo de inatividade deve ser no mínimo 1 hora`);
        if (config.maxMessages < 1)
          errors.push(`Etapa #${index + 1}: Número máximo de mensagens deve ser no mínimo 1`);
        if (config.messagingIntervalHours && config.messagingIntervalHours < 1)
          errors.push(`Etapa #${index + 1}: Intervalo entre mensagens deve ser no mínimo 1 hora`);
        if (!config.messages.filter((message) => message.trim()).length)
          errors.push(`Etapa #${index + 1}: Adicione pelo menos uma mensagem de follow-up`);
      }
    });

    stages.forEach((stage, index) => {
      stage.assistantPipelineStage?.assistantAllowedTargetStages.forEach(
        (target, targetIndex) => {
          if (!stageOrders.has(target.targetStageOrder)) {
            errors.push(
              `Etapa #${index + 1}, Movimentação #${targetIndex + 1}: Etapa destino (ordem ${target.targetStageOrder}) não existe`,
            );
          }
        },
      );
    });

    return { valid: errors.length === 0, errors };
  };

  const validateWhatsAppIntegration = () => {
    const errors: string[] = [];
    if (!useWhatsApp) return { valid: true, errors };

    if (!new Set(stages.map((stage) => stage.order)).has(initialStageOrder))
      errors.push(`Etapa inicial do WhatsApp (ordem ${initialStageOrder}) não existe`);

    if (
      whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD &&
      !isCreating &&
      !metaPhoneNumberId
    ) {
      errors.push("Escolha um número Meta antes de salvar a conexão");
    }

    if (whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI) {
      if (!externalToken.trim()) errors.push("Token externo é obrigatório para Z-API");
      if (!externalClientToken.trim()) errors.push("Token do cliente externo é obrigatório para Z-API");
      if (!postbackUrl.trim()) errors.push("URL de postback é obrigatória para Z-API");
    }

    return { valid: errors.length === 0, errors };
  };

  const buildAssistant = () =>
    useAgent
      ? {
          name: agentFormData.name,
          description: agentFormData.description,
          avatarFileId: null,
          timeZone: agentFormData.timeZone,
          language: agentFormData.language,
          skipMessages: agentFormData.skipMessages,
          iaModelId: agentFormData.iaModelId,
          iaProviderApiKey: apiKeyChanged
            ? agentFormData.iaProviderApiKey
            : undefined,
          prompt: {
            function: agentFormData.function,
            style: agentFormData.style,
            instructions: convertHtmlStringToText(agentFormData.instructions),
            blacklist: agentFormData.blacklist,
            links: agentFormData.links,
          },
          contentsIds: agentFormData.contents.map((content) => content.id),
          customFields: agentFormData.customFields,
          entryTags: agentFormData.entryTags,
          googleCalendarIntegrationId:
            agentFormData.googleCalendarIntegrationId || null,
          transitionDecisionMode: agentFormData.transitionDecisionMode,
        }
      : null;

  const buildWhatsAppIntegration = (): WhatsAppIntegrationConfig | null | undefined => {
    if (!useWhatsApp) {
      return currentPipeline?.companyWhatsappIntegrationId ? null : undefined;
    }

    if (whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD) {
      return undefined;
    }

    if (useWhatsApp) {
      const integration: WhatsAppIntegrationConfig =
        whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.EVOLUX
          ? {
              whatsappIntegrationName: WHATSAPP_INTEGRATION_NAMES.EVOLUX,
              initialPipelineStageOrder: initialStageOrder,
            }
          : {
              whatsappIntegrationName: WHATSAPP_INTEGRATION_NAMES.ZAPI,
              initialPipelineStageOrder: initialStageOrder,
              externalToken,
              externalClientToken,
              postbackUrl,
            };
      return integration;
    }
    return undefined;
  };

  const buildStages = (): CreatePipelineStageInput[] =>
    stages.map((stage, index) => ({
      name: stage.name,
      order: index,
      color: stage.color || "#64748b",
      winProbability: stage.winProbability ?? 100,
      assistantPipelineStage: useAgent
        ? normalizeAssistantPipelineStage(stage.assistantPipelineStage) ?? null
        : null,
      reengagementConfig: stage.reengagementConfig
        ? {
            minInactiveChatTimeHours:
              stage.reengagementConfig.minInactiveChatTimeHours,
            maxMessages: stage.reengagementConfig.maxMessages,
            messages: stage.reengagementConfig.messages.filter((message) =>
              message.trim(),
            ),
            includeTags: stage.reengagementConfig.includeTags || [],
            excludeTags: stage.reengagementConfig.excludeTags || [],
            isActive: stage.reengagementConfig.isActive ?? true,
            startTime: stage.reengagementConfig.startTime,
            endTime: stage.reengagementConfig.endTime,
            mediaFileId: stage.reengagementConfig.mediaFileId ?? undefined,
          }
        : null,
    }));

  const handleSave = async () => {
    if (!workspaceId) return;

    const validations = [
      pipelineName.trim() ? [] : ["Nome do funil é obrigatório"],
      validateStages().errors,
      validateAgent().errors,
      validateWhatsAppIntegration().errors,
    ];
    const allErrors = validations.flat();

    if (allErrors.length) {
      const emptyAutomationStageIndex = stages.findIndex(
        (stage) =>
          stage.assistantPipelineStage &&
          stage.assistantPipelineStage.assistantAllowedTargetStages.length === 0,
      );
      if (emptyAutomationStageIndex >= 0) {
        setActiveTab("stages");
        setFocusedStageError({ stageId: stages[emptyAutomationStageIndex].id });
      }

      toast({
        title: "Validação falhou",
        description: (
          <div className="space-y-1">
            <p className="font-medium">Corrija os seguintes erros:</p>
            <ul className="list-disc list-inside text-sm">
              {allErrors.slice(0, 5).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {allErrors.length > 5 && (
                <li>... e mais {allErrors.length - 5} erro(s)</li>
              )}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const assistant = buildAssistant();
      const whatsappIntegration = buildWhatsAppIntegration();
      const stagesInput = buildStages();
      const currentIntegration = whatsappIntegrationQuery.data;

      if (
        !isCreating &&
        currentPipeline?.companyWhatsappIntegrationId &&
        whatsappIntegrationQuery.isPending
      ) {
        toast({
          title: "Carregando a conexão do WhatsApp",
          description: "Aguarde a leitura da integração antes de salvar.",
          variant: "destructive",
        });
        return;
      }

      const targetMeta =
        useWhatsApp &&
        whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD;
      const currentMeta =
        currentIntegration?.whatsappIntegrationName ===
        WHATSAPP_INTEGRATION_NAMES.META_CLOUD;
      const activeMetaMigration =
        currentMeta &&
        currentIntegration.active &&
        (!targetMeta || currentIntegration.metaPhoneNumberId !== metaPhoneNumberId);
      const shouldConfigureMeta =
        targetMeta &&
        canManageIntegrations &&
        (!currentMeta ||
          !currentIntegration ||
          !currentIntegration.active ||
          currentIntegration.metaPhoneNumberId !== metaPhoneNumberId ||
          currentIntegration.initialPipelineStageOrder !== initialStageOrder);

      if (activeMetaMigration && !window.confirm("A conexão Meta ativa será alterada. Deseja continuar?")) {
        return;
      }

      if (isCreating) {
        const payload: CreatePipelineInput = {
          workspaceId,
          name: pipelineName,
          stages: stagesInput,
          assistant: assistant
            ? { ...assistant, iaProviderApiKey: agentFormData.iaProviderApiKey || "" }
            : null,
          whatsappIntegration,
        };
        const response = await createPipeline(payload);
        toast({
          title: "Funil criado com sucesso",
          description: useAgent
            ? `${pipelineName} foi criado com seu agente configurado.`
            : `${pipelineName} foi criado.`,
        });
        setDirty(false);
        await queryClient.invalidateQueries({
          queryKey: ["listPipelines", workspaceId],
        });
        if (targetMeta) {
          navigate(
            `/deals/pipeline/${response.id}/edit?tab=config&provider=meta-cloud&initialStageOrder=${initialStageOrder}`,
          );
        } else {
          navigate(`/deals/pipeline/${response.id}`);
        }
        return;
      }

      await updatePipeline(pipelineId!, {
        workspaceId,
        name: pipelineName,
        stages: stagesInput.map((stage, index): UpdatePipelineStageItem => {
          const originalStage = stages[index];
          return {
            ...(originalStage && !originalStage.id.startsWith("tmp-")
              ? { id: originalStage.id }
              : {}),
            name: stage.name,
            order: index,
            color: stage.color,
            winProbability: stage.winProbability,
            assistantPipelineStage:
              normalizeAssistantPipelineStage(stage.assistantPipelineStage) ?? null,
            reengagementConfig: stage.reengagementConfig || null,
          };
        }),
        assistant,
        whatsappIntegration,
      });

      if (shouldConfigureMeta) {
        try {
          await configureMetaCloudPipelineIntegration(pipelineId!, {
            phoneNumberId: metaPhoneNumberId!,
            initialPipelineStageOrder: initialStageOrder,
          });
        } catch {
          setActiveTab("config");
          toast({
            title: "Pipeline salvo; WhatsApp não atualizado",
            description: "Revise a conexão Meta e tente novamente.",
            variant: "destructive",
          });
          return;
        }
      } else if (currentMeta && !useWhatsApp) {
        try {
          await disconnectMetaCloudPipelineIntegration(pipelineId!);
        } catch {
          setActiveTab("config");
          toast({
            title: "Pipeline salvo; WhatsApp não desconectado",
            description: "A conexão Meta continua ativa. Tente desconectar novamente.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Funil atualizado com sucesso",
        description: useAgent
          ? `${pipelineName} e seu agente foram atualizados.`
          : `${pipelineName} foi atualizado.`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["listPipelines"] }),
        queryClient.invalidateQueries({ queryKey: ["listPipelineStages"] }),
        queryClient.invalidateQueries({ queryKey: ["getAgent"] }),
        queryClient.invalidateQueries({
          queryKey: ["getCompanyWhatsAppIntegration", currentPipeline?.companyWhatsappIntegrationId],
        }),
        queryClient.invalidateQueries({ queryKey: ["meta-cloud-diagnostic"] }),
      ]);
      setDirty(false);
      navigate(`/deals/pipeline/${pipelineId}`);
    } catch (error) {
      const feedback = getSaveErrorFeedback(error);
      if (feedback.tab) setActiveTab(feedback.tab);
      if (feedback.stageIndex !== undefined) {
        const stage = stages[feedback.stageIndex];
        if (stage) {
          setFocusedStageError({
            stageId: stage.id,
            ruleIndex: feedback.ruleIndex,
          });
        }
      }
      toast({
        title: "Erro ao salvar",
        description: feedback.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    requestNavigation(() =>
      navigate(isCreating ? "/deals" : `/deals/pipeline/${pipelineId}`),
    );
  };

  const markDirty = () => {
    if (hasInitializedDataRef.current) setDirty(true);
  };

  return {
    isCreating,
    pipelineId,
    workspaceId,
    activeTab,
    setActiveTab,
    isSaving,
    pipelineName,
    handlePipelineNameChange: (name: string) => {
      setPipelineName(name);
      markDirty();
    },
    stages,
    focusedStageError,
    useAgent,
    handleUseAgentChange: (value: boolean) => {
      setUseAgent(value);
      markDirty();
    },
    agentFormData,
    updateAgentFormData,
    useWhatsApp,
    handleUseWhatsAppChange: (value: boolean) => {
      setUseWhatsApp(value);
      markDirty();
    },
    whatsAppIntegrationName,
    handleWhatsAppIntegrationNameChange: (value: WhatsAppIntegrationName) => {
      metaSelectionFromQueryRef.current = false;
      setWhatsAppIntegrationName(value);
      markDirty();
    },
    initialStageOrder,
    handleInitialStageOrderChange: (value: number) => {
      setInitialStageOrder(value);
      markDirty();
    },
    externalToken,
    handleExternalTokenChange: (value: string) => {
      setExternalToken(value);
      markDirty();
    },
    externalClientToken,
    handleExternalClientTokenChange: (value: string) => {
      setExternalClientToken(value);
      markDirty();
    },
    postbackUrl,
    handlePostbackUrlChange: (value: string) => {
      setPostbackUrl(value);
      markDirty();
    },
    metaPhoneNumberId,
    handleMetaPhoneNumberIdChange: (value: string | null) => {
      setMetaPhoneNumberId(value);
      markDirty();
    },
    metaCloudEnabled,
    canUpdatePipeline,
    canManageIntegrations,
    metaIntegration: whatsappIntegrationQuery.data,
    currentPipeline,
    availableWhatsAppIntegrations: whatsappIntegrationsQuery.data || [],
    isAgentLoading: agentQuery.isLoading,
    isAgentConfigured,
    handleStagesChange: (nextStages: PipelineStageMinimal[]) => {
      setStages(nextStages);
      if (hasInitializedDataRef.current) setDirty(true);
    },
    handleLoadDeletedAgent: (agentData: AgentFormData) => {
      setAgentFormData(agentData);
      setApiKeyChanged(false);
      setDirty(true);
    },
    handleSave,
    handleCancel,
  };
}
