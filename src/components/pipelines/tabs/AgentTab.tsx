import React, { useState, useEffect } from "react";
import { AgentFormData } from "@/types/agent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Bot, AlertCircle, Loader2 } from "lucide-react";
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
  const [activeSubTab, setActiveSubTab] = useState<
    "basic" | "custom" | "prompt" | "tags" | "skills"
  >("basic");

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

  const getTabIndicator = (
    tabName: "basic" | "custom" | "prompt" | "tags" | "skills",
  ) => {
    if (!useAgent) return null;

    if (tabName === "basic" && !isBasicValid()) {
      return <span className="ml-1 text-destructive">*</span>;
    }
    if (tabName === "prompt" && !isPromptValid()) {
      return <span className="ml-1 text-destructive">*</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Switch para habilitar/desabilitar agente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Agente de IA</CardTitle>
                <CardDescription>
                  Configure um agente para automatizar interações neste funil
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoadingDeleted && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Label htmlFor="use-agent" className="cursor-pointer">
                {useAgent ? "Ativado" : "Desativado"}
              </Label>
              <Switch
                id="use-agent"
                checked={useAgent}
                onCheckedChange={handleAgentToggle}
                disabled={isLoadingDeleted}
              />
            </div>
          </div>
        </CardHeader>
        {useAgent && !showWizard && (
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure todas as informações obrigatórias do agente nas abas
                abaixo. Campos marcados com{" "}
                <span className="text-destructive">*</span> são obrigatórios.
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
              setWizardCompleted(true); // Mark wizard as completed
              // Após completar o wizard, vai para as tabs normais
            }}
            onCancel={() => {
              setShowWizard(false);
              setWizardCompleted(false); // Reset if cancelled
              onUseAgentChange(false); // Desativa o agente se cancelar
            }}
          />
        ) : (
          <Tabs
            value={activeSubTab}
            onValueChange={(v) =>
              setActiveSubTab(
                v as "basic" | "custom" | "prompt" | "tags" | "skills",
              )
            }
          >
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="basic">
                Informações{getTabIndicator("basic")}
              </TabsTrigger>
              <TabsTrigger value="prompt">
                Prompt{getTabIndicator("prompt")}
              </TabsTrigger>
              <TabsTrigger value="tags">
                Tags{getTabIndicator("tags")}
              </TabsTrigger>
              <TabsTrigger value="skills">
                Skills{getTabIndicator("skills")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <BasicInformationCard
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="prompt" className="mt-6">
              <PromptContextCard
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="tags" className="mt-6">
              <EntryTagsCard
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <SkillsCard formData={formData} updateFormData={updateFormData} />
            </TabsContent>
          </Tabs>
        )
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Agente Desativado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Ative o agente para configurar automações e interações
              inteligentes neste funil. O agente poderá mover negócios entre
              etapas e interagir com clientes automaticamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
