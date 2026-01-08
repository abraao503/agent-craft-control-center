import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import {
  StagesTab,
  AgentTab,
  ConfigurationsTab,
} from "@/components/pipelines/tabs";
import { AgentLoadingModal } from "@/components/pipelines/AgentLoadingModal";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listPipelines } from "@/services/pipeline/listPipelines";
import {
  updatePipeline,
  UpdatePipelineStageItem,
} from "@/services/pipeline/updatePipeline";
import { createPipeline } from "@/services/pipeline/createPipeline";
import { getAgent } from "@/services/agent/getAgent";
import { listCompanyWhatsAppIntegrations } from "@/services/whatsapp/listCompanyWhatsAppIntegrations";
import { getCompanyWhatsAppIntegration } from "@/services/whatsapp/getCompanyWhatsAppIntegration";
import {
  PipelineStageMinimal,
  CreatePipelineStageInput,
  WhatsAppIntegrationConfig,
} from "@/types/pipeline";
import { AgentFormData } from "@/types/agent";
import {
  WHATSAPP_INTEGRATION_NAMES,
  WhatsAppIntegrationName,
} from "@/types/whatsapp-integration";
import { convertHtmlStringToText } from "@/lib/utils";

// Default agent form data
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
};

const getDefaultCreateStages = (): PipelineStageMinimal[] => {
  const base: Array<{ name: string; color: string; winProbability: number }> = [
    { name: "Qualificado", color: "#4f46e5", winProbability: 100 },
    { name: "Contato Realizado", color: "#0ea5e9", winProbability: 100 },
    { name: "Demonstração Agendada", color: "#10b981", winProbability: 100 },
    { name: "Proposta Feita", color: "#f59e0b", winProbability: 100 },
    { name: "Negociações Iniciadas", color: "#ef4444", winProbability: 100 },
  ];
  return base.map((s, i) => ({
    id: `tmp-${i + 1}`,
    name: s.name,
    color: s.color,
    winProbability: s.winProbability,
  }));
};

const PipelineEditPage = () => {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isCreating = !pipelineId;

  const { workspaceId } = useWorkspaceManager({
    queryKeys: ["listPipelineStages", "listPipelines", "listAgent", "getAgent"],
    autoRefetch: true,
  });

  const [activeTab, setActiveTab] = useState<"stages" | "agent" | "config">(
    "stages"
  );

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Pipeline state
  const [pipelineName, setPipelineName] = useState("");
  const [stages, setStages] = useState<PipelineStageMinimal[]>([]);

  // Agent state
  const [useAgent, setUseAgent] = useState(false);
  const [agentFormData, setAgentFormData] =
    useState<AgentFormData>(defaultAgentFormData);
  const [apiKeyChanged, setApiKeyChanged] = useState(false); // Track if API key was manually changed
  const initialApiKeyRef = useRef<string>(""); // Track initial API key to detect autocomplete
  const hasInitializedDataRef = useRef(false); // Track if we've already initialized data from queries

  // Reset initialization flag when pipelineId changes (navigating between different pipelines)
  useEffect(() => {
    hasInitializedDataRef.current = false;
  }, [pipelineId]);

  // WhatsApp state
  const [useWhatsApp, setUseWhatsApp] = useState(false);
  const [whatsAppIntegrationName, setWhatsAppIntegrationName] =
    useState<WhatsAppIntegrationName>(WHATSAPP_INTEGRATION_NAMES.ZAPI);
  const [initialStageOrder, setInitialStageOrder] = useState(0);
  const [externalToken, setExternalToken] = useState("");
  const [externalClientToken, setExternalClientToken] = useState("");
  const [postbackUrl, setPostbackUrl] = useState("");

  // Helper to update agent form data
  const updateAgentFormData = (data: Partial<AgentFormData>) => {
    // Track if API key was manually changed (only if it's different from initial value)
    if (data.iaProviderApiKey !== undefined) {
      // Only mark as changed if the new value is different from the initial empty state
      // and it's not an autocomplete (comparing with ref)
      if (data.iaProviderApiKey !== initialApiKeyRef.current) {
        setApiKeyChanged(true);
      }
    }
    setAgentFormData((prev) => ({ ...prev, ...data }));
  };

  // Queries
  const stagesQuery = useQuery({
    queryKey: ["listPipelineStages", pipelineId, workspaceId],
    queryFn: () => listPipelineStages(pipelineId!, workspaceId!),
    enabled: !!pipelineId && !!workspaceId,
  });

  const pipelinesQuery = useQuery({
    queryKey: ["listPipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: !!workspaceId,
  });

  const whatsappIntegrationsQuery = useQuery({
    queryKey: ["listCompanyWhatsAppIntegrations", workspaceId],
    queryFn: () => listCompanyWhatsAppIntegrations(workspaceId!),
    enabled: !!workspaceId,
  });

  const currentPipeline = useMemo(() => {
    return pipelinesQuery.data?.find((p) => p.id === pipelineId);
  }, [pipelinesQuery.data, pipelineId]);

  // Query for agent data when pipeline has an assistant
  const agentQuery = useQuery({
    queryKey: ["getAgent", currentPipeline?.assistantId, workspaceId],
    queryFn: () => getAgent(currentPipeline!.assistantId!, workspaceId!),
    enabled: !!currentPipeline?.assistantId && !!workspaceId,
  });

  // Query for WhatsApp integration data
  const whatsappIntegrationQuery = useQuery({
    queryKey: [
      "getCompanyWhatsAppIntegration",
      currentPipeline?.companyWhatsappIntegrationId,
    ],
    queryFn: () =>
      getCompanyWhatsAppIntegration(
        currentPipeline!.companyWhatsappIntegrationId!
      ),
    enabled: !!currentPipeline?.companyWhatsappIntegrationId,
  });

  // Load WhatsApp configuration when integration data is available
  useEffect(() => {
    if (whatsappIntegrationQuery.data) {
      const data = whatsappIntegrationQuery.data;
      setUseWhatsApp(true);
      setWhatsAppIntegrationName(data.whatsappIntegrationName);
      setExternalToken(data.externalToken || "");
      setExternalClientToken(data.externalClientToken || "");
      setPostbackUrl(data.postbackUrl || "");

      // Find stage order by initialPipelineStageId
      const stageIndex = stages.findIndex(
        (s) => s.id === data.initialPipelineStageId
      );
      if (stageIndex !== -1) {
        setInitialStageOrder(stageIndex);
      }
    }
  }, [whatsappIntegrationQuery.data, stages]);

  // Initialize form data when entering edit mode or creating
  useEffect(() => {
    // Só inicializa se ainda não foi inicializado
    if (hasInitializedDataRef.current) return;

    if (stagesQuery.data) {
      setStages(stagesQuery.data);
    }

    if (currentPipeline) {
      setPipelineName(currentPipeline.name);
      // Set useAgent based on whether pipeline has an agent
      setUseAgent(!!currentPipeline.assistantId);
    }

    // Load agent data if exists
    if (agentQuery.data) {
      const agent = agentQuery.data;
      const agentData = {
        name: agent.name,
        description: agent.description,
        avatarUrl: agent.avatar?.url || undefined,
        timeZone: agent.timeZone,
        language: agent.language,
        skipMessages: agent.skipMessages,
        iaModelId: agent.iaModel.id,
        iaProviderApiKey: "", // Not sent from backend
        function: agent.prompt.function,
        style: agent.prompt.style,
        instructions: agent.prompt.instructions,
        blacklist: agent.prompt.blacklist,
        links: agent.prompt.links,
        contents: agent.contents,
        customFields: agent.customFields,
        followUps: agent.followUps,
        entryTags: agent.entryTags || [],
      };
      setAgentFormData(agentData);
      initialApiKeyRef.current = ""; // Set initial as empty when loading existing agent
      hasInitializedDataRef.current = true; // Marca como inicializado
    } else if (isCreating) {
      // Reset to default for new pipeline
      setUseAgent(false); // Start with agent disabled for new pipelines
      setAgentFormData({
        ...defaultAgentFormData,
        name: "Agente do Funil",
        description: "Agente de IA configurado para este funil",
      });
      setPipelineName("Novo funil");
      setStages(getDefaultCreateStages());
      setApiKeyChanged(false); // Reset API key change flag for creation mode
      initialApiKeyRef.current = ""; // Set initial as empty for new pipeline
      hasInitializedDataRef.current = true; // Marca como inicializado
    }
  }, [stagesQuery.data, currentPipeline, agentQuery.data, isCreating]);

  // Detect and clear autocompleted API key
  useEffect(() => {
    const timer = setTimeout(() => {
      // If API key was filled but we didn't mark it as changed, it was autocompleted
      if (agentFormData.iaProviderApiKey && !apiKeyChanged) {
        console.log("Autocomplete detected, clearing API key field");
        setAgentFormData((prev) => ({ ...prev, iaProviderApiKey: "" }));
      }
    }, 1000); // Wait for browser autocomplete

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Check if agent is configured (has all required fields)
  const isAgentConfigured = useMemo(() => {
    if (!useAgent) return false;

    const isBasicValid =
      agentFormData.name.trim() !== "" &&
      agentFormData.description.trim() !== "" &&
      agentFormData.timeZone.trim() !== "" &&
      agentFormData.language.trim() !== "" &&
      agentFormData.iaModelId.trim() !== "";

    const isPromptValid =
      agentFormData.function.trim() !== "" && agentFormData.style.trim() !== "";

    return isBasicValid && isPromptValid;
  }, [useAgent, agentFormData]);

  // Validation functions
  const validateAgent = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!useAgent) return { valid: true, errors: [] };

    // Basic fields validation (min 3 chars for name/description)
    if (!agentFormData.name || agentFormData.name.trim().length < 3) {
      errors.push("Nome do agente deve ter no mínimo 3 caracteres");
    }
    if (
      !agentFormData.description ||
      agentFormData.description.trim().length < 3
    ) {
      errors.push("Descrição do agente deve ter no mínimo 3 caracteres");
    }
    if (!agentFormData.timeZone || agentFormData.timeZone.trim() === "") {
      errors.push("Fuso horário é obrigatório");
    }
    if (
      !agentFormData.language ||
      !["pt-BR", "en-US", "es-ES"].includes(agentFormData.language)
    ) {
      errors.push("Idioma inválido (pt-BR, en-US ou es-ES)");
    }
    if (!agentFormData.iaModelId || agentFormData.iaModelId.trim() === "") {
      errors.push("Modelo de IA é obrigatório");
    }

    // API key validation - only required if creating or if changed during editing
    if (isCreating || apiKeyChanged) {
      if (
        !agentFormData.iaProviderApiKey ||
        agentFormData.iaProviderApiKey.trim() === ""
      ) {
        errors.push("Chave de API do provedor é obrigatória");
      }
    }

    // Prompt validation (min 3 chars)
    if (!agentFormData.function || agentFormData.function.trim().length < 3) {
      errors.push("Função do agente deve ter no mínimo 3 caracteres");
    }
    if (!agentFormData.style || agentFormData.style.trim().length < 3) {
      errors.push("Estilo do agente deve ter no mínimo 3 caracteres");
    }
    const instructionsText = convertHtmlStringToText(
      agentFormData.instructions
    );
    if (!instructionsText || instructionsText.trim().length < 3) {
      errors.push("Instruções do agente devem ter no mínimo 3 caracteres");
    }

    // Links validation
    if (agentFormData.links && agentFormData.links.length > 0) {
      agentFormData.links.forEach((link, index) => {
        if (!link.name || link.name.trim().length < 3) {
          errors.push(
            `Link #${index + 1}: Nome deve ter no mínimo 3 caracteres`
          );
        }
        try {
          new URL(link.url);
        } catch {
          errors.push(`Link #${index + 1}: URL inválida`);
        }
      });
    }

    // Custom fields validation
    if (agentFormData.customFields && agentFormData.customFields.length > 0) {
      const identifierCount = agentFormData.customFields.filter(
        (field) => field.isIdentifier
      ).length;
      if (identifierCount > 1) {
        errors.push("Apenas um campo pode ser marcado como identificador");
      }

      agentFormData.customFields.forEach((field, index) => {
        if (!field.name || field.name.trim().length < 3) {
          errors.push(
            `Campo #${index + 1}: Nome deve ter no mínimo 3 caracteres`
          );
        }
        if (!field.label || field.label.trim().length < 3) {
          errors.push(
            `Campo #${index + 1}: Label deve ter no mínimo 3 caracteres`
          );
        }
        if (!["text", "number", "boolean"].includes(field.type)) {
          errors.push(
            `Campo #${index + 1}: Tipo inválido (text, number ou boolean)`
          );
        }
      });
    }

    return { valid: errors.length === 0, errors };
  };

  const validateStages = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (stages.length === 0) {
      errors.push("Pelo menos uma etapa é obrigatória");
      return { valid: false, errors };
    }

    const stageOrders = new Set<number>();

    stages.forEach((stage, index) => {
      // Name validation
      if (!stage.name || stage.name.trim().length === 0) {
        errors.push(`Etapa #${index + 1}: Nome é obrigatório`);
      }

      // Order validation
      if (typeof stage.order !== "number" || stage.order < 0) {
        errors.push(`Etapa #${index + 1}: Ordem inválida`);
      } else {
        stageOrders.add(stage.order);
      }

      // Win probability validation
      if (
        stage.winProbability !== undefined &&
        (stage.winProbability < 0 || stage.winProbability > 100)
      ) {
        errors.push(
          `Etapa #${index + 1}: Probabilidade deve estar entre 0 e 100`
        );
      }

      // Assistant pipeline stage validation
      if (stage.assistantPipelineStage) {
        const assistantTargets =
          stage.assistantPipelineStage.assistantAllowedTargetStages;

        assistantTargets.forEach((target, targetIndex) => {
          // Target stage order validation
          if (
            typeof target.targetStageOrder !== "number" ||
            target.targetStageOrder < 0
          ) {
            errors.push(
              `Etapa #${index + 1}, Movimentação #${
                targetIndex + 1
              }: Ordem da etapa destino inválida`
            );
          }

          // Move condition validation
          if (
            !target.moveCondition ||
            target.moveCondition.trim().length === 0
          ) {
            errors.push(
              `Etapa #${index + 1}, Movimentação #${
                targetIndex + 1
              }: Condição de movimento é obrigatória`
            );
          }
        });
      }

      // Reengagement config validation
      if (stage.reengagementConfig) {
        const config = stage.reengagementConfig;

        if (config.minInactiveChatTimeHours < 1) {
          errors.push(
            `Etapa #${
              index + 1
            }: Tempo de inatividade deve ser no mínimo 1 hora`
          );
        }

        if (config.maxMessages < 1) {
          errors.push(
            `Etapa #${
              index + 1
            }: Número máximo de mensagens deve ser no mínimo 1`
          );
        }

        if (
          config.intervalBetweenMessagesHours &&
          config.intervalBetweenMessagesHours < 1
        ) {
          errors.push(
            `Etapa #${
              index + 1
            }: Intervalo entre mensagens deve ser no mínimo 1 hora`
          );
        }

        const validMessages = config.messages.filter((m) => m.trim() !== "");
        if (validMessages.length === 0) {
          errors.push(
            `Etapa #${
              index + 1
            }: Adicione pelo menos uma mensagem de reengajamento`
          );
        }
      }
    });

    // Validate that all targetStageOrder references exist
    stages.forEach((stage, index) => {
      if (stage.assistantPipelineStage) {
        stage.assistantPipelineStage.assistantAllowedTargetStages.forEach(
          (target, targetIndex) => {
            if (!stageOrders.has(target.targetStageOrder)) {
              errors.push(
                `Etapa #${index + 1}, Movimentação #${
                  targetIndex + 1
                }: Etapa destino (ordem ${target.targetStageOrder}) não existe`
              );
            }
          }
        );
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const validateWhatsAppIntegration = (): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!useWhatsApp) return { valid: true, errors: [] };

    // Validate initial stage order exists
    const stageOrders = new Set(stages.map((s) => s.order));
    if (!stageOrders.has(initialStageOrder)) {
      errors.push(
        `Etapa inicial do WhatsApp (ordem ${initialStageOrder}) não existe`
      );
    }

    // Validate Z-API specific fields
    if (whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI) {
      if (!externalToken || externalToken.trim().length === 0) {
        errors.push("Token externo é obrigatório para Z-API");
      }
      if (!externalClientToken || externalClientToken.trim().length === 0) {
        errors.push("Token do cliente externo é obrigatório para Z-API");
      }
      if (!postbackUrl || postbackUrl.trim().length === 0) {
        errors.push("URL de postback é obrigatória para Z-API");
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const validatePipelineName = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!pipelineName || pipelineName.trim().length === 0) {
      errors.push("Nome do funil é obrigatório");
    }

    return { valid: errors.length === 0, errors };
  };

  // Handle unified save
  const handleUnifiedSave = async () => {
    if (!workspaceId) return;

    try {
      // Comprehensive validation
      const nameValidation = validatePipelineName();
      const stagesValidation = validateStages();
      const agentValidation = validateAgent();
      const whatsappValidation = validateWhatsAppIntegration();

      const allErrors = [
        ...nameValidation.errors,
        ...stagesValidation.errors,
        ...agentValidation.errors,
        ...whatsappValidation.errors,
      ];

      if (allErrors.length > 0) {
        toast({
          title: "Validação falhou",
          description: (
            <div className="space-y-1">
              <p className="font-medium">Corrija os seguintes erros:</p>
              <ul className="list-disc list-inside text-sm">
                {allErrors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
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

      // Show loading modal
      setIsSaving(true);

      // 1. Build assistant object if agent is enabled
      const assistant = useAgent
        ? {
            name: agentFormData.name,
            description: agentFormData.description,
            avatarFileId: null,
            timeZone: agentFormData.timeZone,
            language: agentFormData.language,
            skipMessages: agentFormData.skipMessages,
            iaModelId: agentFormData.iaModelId,
            // Only send API key if it was manually changed (prevents sending autocompleted value)
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
            contentsIds: agentFormData.contents.map((c) => c.id),
            customFields: agentFormData.customFields,
            entryTags: agentFormData.entryTags,
          }
        : null;

      // 2. Prepare WhatsApp integration config
      let whatsappIntegration: WhatsAppIntegrationConfig | null | undefined;
      if (useWhatsApp) {
        whatsappIntegration = {
          whatsappIntegrationName: whatsAppIntegrationName,
          initialPipelineStageOrder: initialStageOrder,
        };

        if (whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI) {
          whatsappIntegration.externalToken = externalToken;
          whatsappIntegration.externalClientToken = externalClientToken;
          whatsappIntegration.postbackUrl = postbackUrl;
        }
      } else if (currentPipeline?.companyWhatsappIntegrationId) {
        whatsappIntegration = null;
      }

      // 3. Prepare stages
      const stagesInput: CreatePipelineStageInput[] = stages.map((s, i) => ({
        name: s.name,
        order: i,
        color: s.color || "#64748b",
        winProbability: s.winProbability ?? 100,
        assistantPipelineStage: useAgent
          ? s.assistantPipelineStage || null // Se agente habilitado, usar config ou null
          : null, // Se agente desabilitado, sempre null
        reengagementConfig: s.reengagementConfig
          ? {
              minInactiveChatTimeHours:
                s.reengagementConfig.minInactiveChatTimeHours,
              maxMessages: s.reengagementConfig.maxMessages,
              intervalBetweenMessagesHours:
                s.reengagementConfig.intervalBetweenMessagesHours ||
                s.reengagementConfig.messagingIntervalHours ||
                48,
              messages: s.reengagementConfig.messages.filter(
                (m) => m.trim() !== ""
              ), // Remove empty messages
              includeTags: s.reengagementConfig.includeTags || [],
              excludeTags: s.reengagementConfig.excludeTags || [],
              isActive: s.reengagementConfig.isActive ?? true,
            }
          : null,
      }));

      console.log(
        "🔍 DEBUG - Stages antes de enviar:",
        JSON.stringify(stagesInput, null, 2)
      );

      // 4. Create or update pipeline with embedded assistant
      if (isCreating) {
        const response = await createPipeline({
          workspaceId: workspaceId!,
          name: pipelineName,
          stages: stagesInput,
          assistant: assistant
            ? {
                ...assistant,
                iaProviderApiKey: agentFormData.iaProviderApiKey || "",
              }
            : null,
          whatsappIntegration,
        });

        toast({
          title: "Funil criado com sucesso",
          description: useAgent
            ? `${pipelineName} foi criado com seu agente configurado.`
            : `${pipelineName} foi criado.`,
        });

        navigate(`/deals/pipeline/${response.id}`);
      } else {
        await updatePipeline(pipelineId!, {
          workspaceId: workspaceId!,
          name: pipelineName,
          stages: stagesInput.map((s, idx): UpdatePipelineStageItem => {
            const stage: UpdatePipelineStageItem = {
              name: s.name,
              order: idx,
              color: s.color,
              winProbability: s.winProbability,
              assistantPipelineStage: s.assistantPipelineStage || null,
              reengagementConfig: s.reengagementConfig || null,
            };
            const originalStage = stages[idx];
            if (originalStage && !originalStage.id.startsWith("tmp-")) {
              stage.id = originalStage.id;
            }
            return stage;
          }),
          assistant,
          whatsappIntegration,
        });

        toast({
          title: "Funil atualizado com sucesso",
          description: useAgent
            ? `${pipelineName} e seu agente foram atualizados.`
            : `${pipelineName} foi atualizado.`,
        });

        // Refetch queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["listPipelines"] }),
          queryClient.invalidateQueries({ queryKey: ["listPipelineStages"] }),
          queryClient.invalidateQueries({ queryKey: ["getAgent"] }),
        ]);

        navigate(`/deals/pipeline/${pipelineId}`);
      }
    } catch (e) {
      console.error("Error saving pipeline and agent:", e);

      // Check if error is "Invalid API key"
      const apiError = e as { response?: { data?: { message?: string } } };
      const isInvalidApiKey =
        apiError?.response?.data?.message === "Invalid API key";

      toast({
        title: "Erro ao salvar",
        description: isInvalidApiKey
          ? "Chave de API inválida. Verifique a chave do provedor de IA e tente novamente."
          : "Não foi possível salvar o funil e o agente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      navigate("/deals");
    } else {
      navigate(`/deals/pipeline/${pipelineId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isCreating ? "Criar Funil" : "Editar Funil"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleUnifiedSave}>
            {isCreating ? "Criar" : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Pipeline Name Input */}
      <div className="space-y-2">
        <Label htmlFor="pipeline-name">Nome do funil</Label>
        <Input
          id="pipeline-name"
          placeholder="4 Novo funil"
          value={pipelineName}
          onChange={(e) => setPipelineName(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "stages" | "agent" | "config")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="agent">Agente</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
          <StagesTab
            pipelineName={pipelineName}
            stages={stages}
            selectedAssistantId={currentPipeline?.assistantId || undefined}
            availableWhatsAppIntegrations={whatsappIntegrationsQuery.data || []}
            companyWhatsappIntegrationId={
              currentPipeline?.companyWhatsappIntegrationId
            }
            assistantEnabled={useAgent}
            assistantConfigured={isAgentConfigured}
            assistantLoading={agentQuery.isLoading}
            workspaceId={workspaceId}
            onSave={async ({ stages: newStages }) => {
              console.log(
                "💾 PipelineEditPage - Recebendo stages do StagesTab:",
                newStages
              );
              // Convert EditableStage to PipelineStageMinimal
              const convertedStages: PipelineStageMinimal[] = newStages.map(
                (s) => ({
                  id: s.id,
                  name: s.name,
                  order: s.order,
                  color: s.color,
                  winProbability: s.winProbability,
                  assistantPipelineStage: s.assistantPipelineStage,
                  reengagementConfig: s.reengagementConfig
                    ? {
                        minInactiveChatTimeHours:
                          s.reengagementConfig.minInactiveChatTimeHours,
                        maxMessages: s.reengagementConfig.maxMessages,
                        intervalBetweenMessagesHours:
                          s.reengagementConfig.intervalBetweenMessagesHours,
                        messages: s.reengagementConfig.messages,
                        includeTags: s.reengagementConfig.includeTags || [],
                        excludeTags: s.reengagementConfig.excludeTags || [],
                        isActive: s.reengagementConfig.isActive ?? true,
                      }
                    : null,
                })
              );
              setStages(convertedStages);
            }}
            onCancel={() => {}}
            saveLabel="Aplicar"
          />
        </TabsContent>

        <TabsContent value="agent">
          <AgentTab
            formData={agentFormData}
            updateFormData={updateAgentFormData}
            isCreating={isCreating}
            useAgent={useAgent}
            onUseAgentChange={setUseAgent}
            hasExistingAgent={!!currentPipeline?.assistantId}
            pipelineId={pipelineId}
            workspaceId={workspaceId}
            isLoading={agentQuery.isLoading}
            onLoadDeletedAgent={(deletedAgentData) => {
              // Carregar todos os dados do agente deletado
              setAgentFormData(deletedAgentData);
              // Não marcar API key como alterada ao carregar agente deletado
              setApiKeyChanged(false);
            }}
          />
        </TabsContent>

        <TabsContent value="config">
          <ConfigurationsTab
            stages={stages}
            availableWhatsAppIntegrations={whatsappIntegrationsQuery.data || []}
            companyWhatsappIntegrationId={
              currentPipeline?.companyWhatsappIntegrationId
            }
            useWhatsApp={useWhatsApp}
            whatsAppIntegrationName={whatsAppIntegrationName}
            initialStageOrder={initialStageOrder}
            externalToken={externalToken}
            externalClientToken={externalClientToken}
            postbackUrl={postbackUrl}
            onUseWhatsAppChange={setUseWhatsApp}
            onWhatsAppIntegrationNameChange={setWhatsAppIntegrationName}
            onInitialStageOrderChange={setInitialStageOrder}
            onExternalTokenChange={setExternalToken}
            onExternalClientTokenChange={setExternalClientToken}
            onPostbackUrlChange={setPostbackUrl}
          />
        </TabsContent>
      </Tabs>

      {/* Loading Modal */}
      <AgentLoadingModal
        open={isSaving}
        isCreating={isCreating}
        hasAgent={useAgent}
      />
    </div>
  );
};

export default PipelineEditPage;
