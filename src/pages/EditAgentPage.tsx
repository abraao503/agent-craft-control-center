
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import AgentStepIndicator from '@/components/agents/AgentStepIndicator';
import BasicInformation from '@/components/agents/step1/BasicInformation';
import PromptContext from '@/components/agents/step2/PromptContext';
import KnowledgeContent from '@/components/agents/step3/KnowledgeContent';
import CustomFields from '@/components/agents/step4/CustomFields';
import { AgentFormData } from '@/types/agent';
import { AGENTS, updateAgent } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  'Basic Information',
  'Prompt & Context',
  'Knowledge Content',
  'Custom Fields',
];

const EditAgentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<AgentFormData | null>(null);

  useEffect(() => {
    const agent = AGENTS.find(a => a.id === id);
    if (!agent) {
      toast({
        title: "Agent not found",
        description: "The requested agent could not be found.",
        variant: "destructive"
      });
      navigate('/agents');
      return;
    }

    setFormData({
      name: agent.name,
      internalName: agent.internalName,
      description: agent.description,
      avatarUrl: agent.avatarUrl,
      timeZone: agent.timeZone,
      language: agent.language,
      initialMessage: agent.initialMessage,
      iaModelId: agent.iaModelId,
      promptDescription: agent.prompt.description,
      goal: agent.prompt.goal,
      habilities: agent.prompt.habilities,
      companyName: agent.prompt.companyName,
      companySite: agent.prompt.companySite,
      companyDescription: agent.prompt.companyDescription,
      companySector: agent.prompt.companySector,
      contentsIds: agent.contentsIds,
      customFields: agent.customFields,
    });
    setIsLoading(false);
  }, [id, navigate, toast]);

  const updateFormData = (data: Partial<AgentFormData>) => {
    setFormData(prev => prev ? { ...prev, ...data } : null);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!formData || !id) return;

    const updatedAgent = updateAgent(id, {
      name: formData.name,
      internalName: formData.internalName,
      description: formData.description,
      avatarUrl: formData.avatarUrl,
      timeZone: formData.timeZone,
      language: formData.language,
      initialMessage: formData.initialMessage,
      iaModelId: formData.iaModelId,
      prompt: {
        description: formData.promptDescription,
        goal: formData.goal,
        habilities: formData.habilities,
        companyName: formData.companyName,
        companySite: formData.companySite,
        companyDescription: formData.companyDescription,
        companySector: formData.companySector,
      },
      contentsIds: formData.contentsIds,
      customFields: formData.customFields,
    });

    toast({
      title: "Agent updated successfully",
      description: `${updatedAgent.name} has been updated.`,
    });

    navigate(`/agents/${id}`);
  };

  const renderStepContent = () => {
    if (!formData) return null;

    switch (currentStep) {
      case 1:
        return <BasicInformation formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <PromptContext formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <KnowledgeContent formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <CustomFields formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (!formData) return false;
    
    switch (currentStep) {
      case 1:
        return !!formData.name && !!formData.internalName && !!formData.description;
      case 2:
        return !!formData.promptDescription && !!formData.goal;
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
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading agent data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous Step
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button 
                onClick={nextStep}
                disabled={!isStepValid()}
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isStepValid()}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditAgentPage;
