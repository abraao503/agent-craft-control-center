import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AgentStepIndicator from "@/components/agents/AgentStepIndicator";
import BasicInformation from "@/components/agents/step1/BasicInformation";
import PromptContext from "@/components/agents/step2/PromptContext";
import CustomFields from "@/components/agents/step4/EditCustomFields";
import {
  AgentFormData,
  AssistantContent,
  FullAgent,
  UpdateAgentResquest,
  UpdateAssistantCustomField,
} from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { getAgent } from "@/services/agent/getAgent";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateAgent } from "@/services/agent/updateAgent";
import EditKnowledgeContent from "@/components/agents/step3/EditKnowledgeContent";
import { useMainContainerRef } from "@/contexts/mainContainer";
import { convertHtmlStringToText } from "@/lib/utils";

const STEPS = [
  "Basic Information",
  "Prompt & Context",
  "Knowledge Content",
  "Custom Fields",
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
  const containerRef = useMainContainerRef();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentStep, containerRef]);

  const { isLoading, data, error } = useQuery({
    queryKey: ["getAgent", id],
    queryFn: () => getAgent(id),
  });

  const { mutateAsync: updateAgentMutation, isPending: isUpdating } =
    useMutation({
      mutationFn: ({
        agentId,
        agentData,
      }: {
        agentId: string;
        agentData: UpdateAgentResquest;
      }) => updateAgent(agentId, agentData),
      onSuccess: () => {
        toast({
          title: "Agent updated successfully",
          description: `${agent?.name} has been updated.`,
        });
        navigate(`/agents/${id}`);
      },
      onError: (error) => {
        toast({
          title: "Error updating agent",
          description: error.message,
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
        avatarUrl: data.avatar ? data.avatar.url : null,
        timeZone: data.timeZone,
        language: data.language,
        initialMessage: data.initialMessage,
        iaModelId: data.iaModel.id,

        identity: data.prompt.identity,
        function: data.prompt.function,
        goal: data.prompt.goal,
        style: data.prompt.style,
        instructions: data.prompt.instructions,
        blacklist: data.prompt.blacklist,
        links: data.prompt.links,

        contents: data.contents,
        customFields: data.customFields,
      });
    }
  }, [data]);

  const updateFormData = (data: Partial<AgentFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...data } : null));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData || !id) return;

    const formattedInstructions = convertHtmlStringToText(
      formData.instructions
    );

    await updateAgentMutation({
      agentId: id,
      agentData: {
        avatarFileId: null,
        name: formData.name,
        description: formData.description,
        timeZone: formData.timeZone,
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
        language: formData.language,
        iaModelId: formData.iaModelId,
      },
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
          <PromptContext formData={formData} updateFormData={updateFormData} />
        );
      case 3:
        return (
          <EditKnowledgeContent
            formData={formData}
            updateFormData={updateFormData}
            setContentsToUpdate={setContentsToUpdate}
          />
        );
      case 4:
        return (
          <CustomFields
            formData={formData}
            updateFormData={updateFormData}
            setCustomFieldsToUpdate={setCustomFieldsToUpdate}
          />
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
        return (
          !!formData.identity &&
          !!formData.function &&
          !!formData.goal &&
          !!formData.style &&
          !!formData.instructions
        );
      case 3:
        return true; // Knowledge content is optional
      case 4:
        return true; // Custom fields are optional
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
            <p className="text-muted-foreground">Loading agent data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground">
            Update your AI agent's configuration
          </p>
        </div>

        <AgentStepIndicator currentStep={currentStep} steps={STEPS} />

        <div className="bg-white rounded-lg shadow-sm border">
          {renderStepContent()}

          <div className="p-6 border-t flex justify-between">
            {currentStep !== 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Previous Step
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isUpdating}
                isLoading={isUpdating}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAgentPage;
