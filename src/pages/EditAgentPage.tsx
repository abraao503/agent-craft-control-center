import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AgentStepIndicator from "@/components/agents/AgentStepIndicator";
import BasicInformation from "@/components/agents/step1/BasicInformation";
import PromptContext from "@/components/agents/step3/PromptContext";
import CustomFields from "@/components/agents/step2/EditCustomFields";
import EntryTagsTab from "@/components/agents/step5/EntryTagsTab";
import {
  AgentFormData,
  AssistantContent,
  FullAgent,
  UpdateAgentResquest,
  UpdateAssistantCustomField,
  UpdateFollowUpAction,
} from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { getAgent } from "@/services/agent/getAgent";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateAgent } from "@/services/agent/updateAgent";
import EditKnowledgeContent from "@/components/agents/step4/EditKnowledgeContent";
import { useMainContainerRef } from "@/contexts/mainContainer";
import { convertHtmlStringToText } from "@/lib/utils";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

const STEPS = [
  "Informações Básicas",
  "Campos Personalizados",
  "Prompt & Contexto",
  //"Conteúdo do Agente",
  "Tags de Entrada",
];

const EditAgentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentFormData | null>(null);
  const [agent, setAgent] = useState<FullAgent | null>(null);
  const [contentsToUpdate, setContentsToUpdate] = useState<AssistantContent[]>(
    []
  );
  const [customFieldsToUpdate, setCustomFieldsToUpdate] = useState<
    UpdateAssistantCustomField[]
  >([]);
  const [followUpsToUpdate, setFollowUpsToUpdate] = useState<
    UpdateFollowUpAction[]
  >([]);
  const containerRef = useMainContainerRef();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentStep, containerRef]);

  const { workspaceId } = useWorkspaceManager();

  const { isLoading, data, error } = useQuery({
    queryKey: ["getAgent", id, workspaceId],
    queryFn: () => getAgent(id, workspaceId),
  });

  const { mutateAsync: updateAgentMutation, isPending: isUpdating } =
    useMutation({
      mutationFn: ({
        agentId,
        agentData,
        workspaceId,
      }: {
        agentId: string;
        agentData: UpdateAgentResquest;
        workspaceId: string;
      }) => updateAgent(agentId, agentData, workspaceId),
      onSuccess: () => {
        toast({
          title: "Agent updated successfully",
          description: `${agent?.name} has been updated.`,
        });
        navigate(`/agents/${id}`);
      },
      onError: (error: unknown) => {
        const apiError = error as { response?: { data?: { statusCode?: number; message?: string } }; message?: string };
        const isInvalidApiKey = 
          apiError?.response?.data?.statusCode === 422 && 
          apiError?.response?.data?.message === "Invalid API key";

        toast({
          title: isInvalidApiKey ? "Chave de API Inválida" : "Erro ao atualizar agente",
          description: isInvalidApiKey 
            ? "A chave de API fornecida é inválida. Verifique sua chave de API e tente novamente."
            : apiError.message || "Ocorreu um erro ao atualizar o agente.",
          variant: "destructive",
        });
      },
    });

  useEffect(() => {
    if (data) {
      setAgent(data);
      setFormData({
        name: data.name,
        description: data.description,
        avatarUrl: data.avatar?.url || null,
        timeZone: data.timeZone,
        language: data.language,
        initialMessage: data.initialMessage,
        skipMessages: data.skipMessages,
        iaModelId: data.iaModel.id,
        iaProviderApiKey: "", // Não enviamos a chave de volta para o frontend
        identity: data.prompt.identity,
        function: data.prompt.function,
        goal: data.prompt.goal,
        style: data.prompt.style,
        instructions: data.prompt.instructions,
        blacklist: data.prompt.blacklist,
        links: data.prompt.links,
        contents: data.contents,
        customFields: data.customFields,
        followUps: data.followUps,
        entryTags: data.entryTags || [],
      });
    }
  }, [data]);

  const updateFormData = (data: Partial<AgentFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...data } : null));
  };

  const handleStepChange = (targetStep: number) => {
    // Verificar se o passo atual é válido antes de permitir a navegação
    if (!isStepValid()) {
      toast({
        title: "Campos inválidos",
        description:
          "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
      return false;
    }

    // Se for válido, navegar para o passo desejado
    setCurrentStep(targetStep);
    return true;
  };

  const nextStep = () => {
    handleStepChange(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData || !agent) return;

    const formattedInstructions = convertHtmlStringToText(
      formData.instructions
    );

    await updateAgentMutation({
      agentId: id,
      agentData: {
        name: formData.name,
        description: formData.description,
        avatarFileId: null, // Não estamos permitindo atualizar o avatar por enquanto
        timeZone: formData.timeZone,
        language: formData.language,
        prompt: {
          identity: formData.identity,
          function: formData.function,
          goal: formData.goal,
          style: formData.style,
          instructions: formattedInstructions,
          blacklist: formData.blacklist,
          links: formData.links,
        },
        contents: contentsToUpdate,
        customFields: customFieldsToUpdate,
        initialMessage: formData.initialMessage,
        skipMessages: formData.skipMessages,
        iaModelId: formData.iaModelId,
        iaProviderApiKey: formData.iaProviderApiKey,
        entryTags: formData.entryTags,
      },
      workspaceId,
    });

    toast({
      title: "Agent updated successfully",
      description: `${formData.name} has been updated.`,
    });

    navigate(`/agents/${id}`);
  };

  const renderStepContent = () => {
    if (!formData) return null;

    switch (currentStep) {
      case 1:
        return (
          <BasicInformation
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <CustomFields
            formData={formData}
            updateFormData={updateFormData}
            setCustomFieldsToUpdate={setCustomFieldsToUpdate}
          />
        );
      case 3:
        return (
          <PromptContext formData={formData} updateFormData={updateFormData} />
        );
      case 4:
        return (
          <EditKnowledgeContent
            formData={formData}
            updateFormData={updateFormData}
            setContentsToUpdate={setContentsToUpdate}
          />
        );
      case 5:
        return (
          <EntryTagsTab formData={formData} updateFormData={updateFormData} />
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (!formData) return false;

    switch (currentStep) {
      case 1:
        return (
          !!formData.name && !!formData.description && !!formData.iaModelId
        );
      case 2:
        return true; // Custom fields are optional
      case 3:
        return (
          !!formData.identity &&
          !!formData.function &&
          !!formData.goal &&
          !!formData.style &&
          !!formData.instructions
        );
      case 4:
        return true; // Knowledge content is optional
      case 5:
        return true; // Entry tags are optional
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Carregando dados do agente...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Agente</h1>
          <p className="text-muted-foreground">
            Atualize a configuração do seu agente de IA
          </p>
        </div>

        <AgentStepIndicator
          currentStep={currentStep}
          steps={STEPS}
          onStepClick={(step) => {
            // Não permitir navegar para passos futuros sem validar o atual
            if (step > currentStep) {
              handleStepChange(step);
            } else {
              // Para passos anteriores ou o atual, permitir navegação direta
              setCurrentStep(step);
            }
          }}
        />

        <div className="bg-background rounded-lg shadow-sm border">
          {renderStepContent()}

          <div className="p-6 border-t flex justify-between">
            {currentStep !== 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Anterior
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isUpdating}
                isLoading={isUpdating}
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAgentPage;
