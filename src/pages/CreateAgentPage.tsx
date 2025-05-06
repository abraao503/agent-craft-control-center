import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AgentStepIndicator from "@/components/agents/AgentStepIndicator";
import BasicInformation from "@/components/agents/step1/BasicInformation";
import PromptContext from "@/components/agents/step2/PromptContext";
import KnowledgeContent from "@/components/agents/step3/KnowledgeContent";
import { AgentFormData, CreateAgentRequest } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { listAgent } from "@/services/agent/listAgent";
import { createAgent } from "@/services/agent/createAgent";
import EditCustomFields from "@/components/agents/step4/CustomFields";
import CustomFields from "@/components/agents/step4/CustomFields";
import { useMainContainerRef } from "@/contexts/mainContainer";

const STEPS = [
  "Basic Information",
  "Prompt & Context",
  "Knowledge Content",
  "Custom Fields",
];

const defaultFormData: AgentFormData = {
  name: "",
  description: "",
  avatarUrl: null,
  iaModelId: "",
  initialMessage: "",
  timeZone: "America/Sao_Paulo",
  language: "pt-BR",
  promptDescription: "",
  goal: "",
  companyName: "",
  companySite: "",
  companyDescription: "",
  companySector: "",
  contents: [],
  customFields: [],
};

const CreateAgentPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const containerRef = useMainContainerRef();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentStep, containerRef]);

  const {
    isLoading,
    data: agents,
    error,
  } = useQuery({
    queryKey: ["listAgent"],
    queryFn: listAgent,
  });

  const { mutateAsync: createAgentMutation, isPending } = useMutation({
    mutationFn: (data: CreateAgentRequest) => createAgent(data),
    onSuccess: (agent) => {
      toast({
        title: "Agente criado com sucesso",
        description: `${agent.name} foi criado e está pronto para uso.`,
      });
      navigate("/agents");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar agente",
        description: "Ocorreu um erro ao criar o agente.",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (data: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    await createAgentMutation({
      ...formData,
      avatarFileId: null,
      contentsIds: formData.contents.map((content) => content.id),
      prompt: {
        description: formData.promptDescription,
        goal: formData.goal,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        companySector: formData.companySector,
        companySite: formData.companySite,
      },
    });
  };

  const renderStepContent = () => {
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
          <PromptContext formData={formData} updateFormData={updateFormData} />
        );
      case 3:
        return (
          <KnowledgeContent
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <CustomFields formData={formData} updateFormData={updateFormData} />
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          !!formData.name && !!formData.description && !!formData.iaModelId
        );
      case 2:
        return (
          !!formData.promptDescription &&
          !!formData.goal &&
          !!formData.companyName
        );
      case 3:
        return true; // Knowledge content is optional
      case 4:
        return true; // Custom fields are optional
      default:
        return false;
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Agent
          </h1>
          <p className="text-muted-foreground">
            Set up a new AI agent by following the steps below
          </p>
        </div>

        <AgentStepIndicator currentStep={currentStep} steps={STEPS} />

        <div className="bg-white rounded-lg shadow-sm border">
          {renderStepContent()}
          <div className="p-6 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous Step
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isPending}
                isLoading={isPending}
              >
                Create Agent
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentPage;
