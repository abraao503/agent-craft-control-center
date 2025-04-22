
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import AgentStepIndicator from '@/components/agents/AgentStepIndicator';
import BasicInformation from '@/components/agents/step1/BasicInformation';
import PromptContext from '@/components/agents/step2/PromptContext';
import KnowledgeContent from '@/components/agents/step3/KnowledgeContent';
import CustomFields from '@/components/agents/step4/CustomFields';
import { AgentFormData } from '@/types/agent';
import { addAgent } from '@/services/mockData';
import { useToast } from '@/components/ui/use-toast';

const STEPS = [
  'Basic Information',
  'Prompt & Context',
  'Knowledge Content',
  'Custom Fields',
];

const defaultFormData: AgentFormData = {
  name: '',
  internalName: '',
  description: '',
  avatarUrl: '',
  timeZone: 'America/New_York',
  language: 'en',
  initialMessage: 'Hello! How can I assist you today?',
  iaModelId: 'gpt-4o',
  
  promptDescription: '',
  goal: '',
  habilities: '',
  companyName: '',
  companySite: '',
  companyDescription: '',
  companySector: '',
  
  contentsIds: [],
  
  customFields: [],
};

const CreateAgentPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateFormData = (data: Partial<AgentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Create agent from form data
    const newAgent = addAgent({
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
      title: "Agent created successfully",
      description: `${newAgent.name} has been created and is ready to use.`,
    });

    // Navigate to the agent details page
    navigate(`/agents/${newAgent.id}`);
  };

  const renderStepContent = () => {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
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
                Create Agent
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateAgentPage;
