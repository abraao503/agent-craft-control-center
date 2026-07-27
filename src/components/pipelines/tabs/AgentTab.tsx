import React, { useState, useEffect } from "react";
import { AgentFormData } from "@/types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bot, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AgentWizard } from "@/components/pipelines/agent-wizard";
import {
  BasicInformationCard,
  PromptContextCard,
  EntryTagsCard,
  SkillsCard,
} from "@/components/pipelines/agent-config";
import { getDeletedAssistant } from "@/services/pipeline/getDeletedAssistant";

interface AgentTabProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  isCreating: boolean;
  useAgent: boolean;
  onUseAgentChange: (value: boolean) => void;
  hasExistingAgent?: boolean; // Indica se já existe um agente criado
  pipelineId?: string; // ID da pipeline para buscar agente deletado
  workspaceId?: string; // ID do workspace
  onLoadDeletedAgent?: (agentData: AgentFormData) => void; // Callback para carregar dados do agente deletado
  isLoading?: boolean; // Indica se os dados do agente estão sendo carregados
}

export const AgentTab: React.FC<AgentTabProps> = ({
  formData,
  updateFormData,
  isCreating,
  useAgent,
  onUseAgentChange,
  hasExistingAgent = false,
  pipelineId,
  workspaceId,
  onLoadDeletedAgent,
  isLoading = false,
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false); // Track if wizard was completed
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "profile" | "behavior" | "resources"
  >("profile");

  // Buscar agente deletado quando ativar o switch (apenas em modo de edição)
  const handleAgentToggle = async (value: boolean) => {
    // Se estiver ativando o agente e não estiver criando (modo edição)
    if (
      value &&
      !isCreating &&
      !hasExistingAgent &&
      pipelineId &&
      workspaceId
    ) {
      setIsLoadingDeleted(true);
      try {
        const deletedAgent = await getDeletedAssistant(pipelineId, workspaceId);

        if (deletedAgent && onLoadDeletedAgent) {
          // Se encontrou um agente deletado, preencher os dados
          const agentData: AgentFormData = {
            name: deletedAgent.name,
            description: deletedAgent.description,
            avatarUrl: deletedAgent.avatar?.url || undefined,
            timeZone: deletedAgent.timeZone,
            language: deletedAgent.language,
            skipMessages: deletedAgent.skipMessages,
            iaModelId: deletedAgent.iaModel.id,
            iaProviderApiKey: "", // Não vem do backend por segurança
            function: deletedAgent.prompt.function,
            style: deletedAgent.prompt.style,
            instructions: deletedAgent.prompt.instructions,
            blacklist: deletedAgent.prompt.blacklist,
            links: deletedAgent.prompt.links,
            contents: deletedAgent.contents,
            customFields: deletedAgent.customFields,
            followUps: deletedAgent.followUps,
            entryTags: deletedAgent.entryTags || [],
            googleCalendarIntegrationId:
              deletedAgent.googleCalendarIntegrationId || null,
            transitionDecisionMode:
              deletedAgent.transitionDecisionMode || "CONVERSATIONAL",
          };

          onLoadDeletedAgent(agentData);
          setWizardCompleted(true); // Não mostrar wizard se recuperou dados
        }
      } catch (error) {
        // Silenciosamente ignora erros - usuário preencherá manualmente
        console.log("No deleted agent found or error fetching:", error);
      } finally {
        setIsLoadingDeleted(false);
      }
    }

    onUseAgentChange(value);
  };

  // Mostrar wizard quando ativar o agente pela primeira vez (não tem agente existente)
  useEffect(() => {
    if (useAgent && !hasExistingAgent && !wizardCompleted) {
      // Verifica se o agente está "vazio" (não foi configurado ainda)
      const isEmptyAgent = !formData.name || !formData.function;
      if (isEmptyAgent) {
        setShowWizard(true);
      }
    }
  }, [
    useAgent,
    hasExistingAgent,
    wizardCompleted,
    formData.name,
    formData.function,
  ]);

  // Reset wizard state when agent is disabled
  useEffect(() => {
    if (!useAgent) {
      setShowWizard(false);
      setWizardCompleted(false);
    }
  }, [useAgent]);

  // Validação de campos obrigatórios por aba
  const isBasicValid = () => {
    return !!(
      formData.name &&
      formData.description &&
      formData.iaModelId &&
      (isCreating ? formData.iaProviderApiKey : true)
    );
  };

  const isPromptValid = () => {
    return !!(formData.function && formData.style && formData.instructions);
  };

  const sections = [
    {
      id: "profile" as const,
      title: "Perfil e modelo",
      description: "Identificação, idioma, modelo e chave de API",
      hasPending: !isBasicValid(),
    },
    {
      id: "behavior" as const,
      title: "Comportamento",
      description: "Decisões, tom, instruções e restrições",
      hasPending: !isPromptValid(),
    },
    {
      id: "resources" as const,
      title: "Recursos",
      description: "Tags de entrada e Google Calendar",
      hasPending: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Switch para habilitar/desabilitar agente */}
      <Card className="border-primary/15 bg-muted/20">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Agente de IA</CardTitle>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${useAgent ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                >
                  {useAgent ? "Ligado" : "Desligado"}
                </span>
              </div>
              <CardDescription className="text-xs">
                {useAgent
                  ? "Personalize como o agente atende e movimenta negócios."
                  : "Ative para automatizar atendimentos e movimentações neste funil."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isLoadingDeleted && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Label htmlFor="use-agent" className="cursor-pointer text-sm">
              {useAgent ? "Desativar" : "Ativar"}
            </Label>
            <Switch
              id="use-agent"
              checked={useAgent}
              onCheckedChange={handleAgentToggle}
              disabled={isLoadingDeleted}
            />
          </div>
        </CardContent>
        {useAgent && !showWizard && (
          <CardContent className="pt-0">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure os campos obrigatórios nas seções abaixo. O ponto
                vermelho indica uma seção pendente.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Mostrar wizard ou tabs baseado no estado */}
      {useAgent ? (
        isLoading || isLoadingDeleted ? (
          // Skeleton loading state
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : showWizard ? (
          <AgentWizard
            formData={formData}
            updateFormData={updateFormData}
            onComplete={() => {
              setShowWizard(false);
              setWizardCompleted(true);
              setActiveSection(
                !isBasicValid()
                  ? "profile"
                  : !isPromptValid()
                    ? "behavior"
                    : "profile",
              );
            }}
            onCancel={() => {
              setShowWizard(false);
              setWizardCompleted(false); // Reset if cancelled
              onUseAgentChange(false); // Desativa o agente se cancelar
            }}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
            <nav
              className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
              aria-label="Seções da configuração do agente"
            >
              {sections.map((section) => {
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`min-w-[210px] rounded-lg border p-3 text-left transition-colors lg:min-w-0 ${selected ? "border-primary/40 bg-primary/5" : "bg-card hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {section.title}
                      </span>
                      {section.hasPending && (
                        <span
                          className="ml-auto h-2 w-2 rounded-full bg-destructive"
                          aria-label="Campos obrigatórios pendentes"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </button>
                );
              })}
            </nav>
            <div className="min-w-0 [&_.p-6]:p-4 [&_.space-y-6]:space-y-4 [&_h3]:text-base [&_p.text-muted-foreground]:text-xs">
              {activeSection === "profile" && (
                <BasicInformationCard
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              {activeSection === "behavior" && (
                <PromptContextCard
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}
              {activeSection === "resources" && (
                <div className="space-y-4">
                  <EntryTagsCard
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                  <SkillsCard
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <p className="px-1 text-sm text-muted-foreground">
          Quando estiver ligado, você poderá configurar o perfil, o
          comportamento e os recursos do agente.
        </p>
      )}
    </div>
  );
};
