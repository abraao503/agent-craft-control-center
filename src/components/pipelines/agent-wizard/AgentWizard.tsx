import React, { useState } from "react";
import { AgentFormData } from "@/types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bot, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { BasicInformationCard } from "@/components/pipelines/agent-config/BasicInformationCard";
import { PromptContextCard } from "@/components/pipelines/agent-config/PromptContextCard";
import { EntryTagsCard } from "@/components/pipelines/agent-config/EntryTagsCard";

interface AgentWizardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = "intro" | "basic" | "prompt" | "optional" | "review";

export const AgentWizard: React.FC<AgentWizardProps> = ({
  formData,
  updateFormData,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");

  const steps: WizardStep[] = [
    "intro",
    "basic",
    "prompt",
    "optional",
    "review",
  ];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Validações seguindo o schema do backend
  const isBasicValid = () => {
    return !!(
      formData.name.trim().length >= 3 &&
      formData.description.trim().length >= 3 &&
      formData.timeZone.trim() &&
      ["pt-BR", "en-US", "es-ES"].includes(formData.language) &&
      formData.iaModelId.trim() &&
      formData.iaProviderApiKey.trim()
    );
  };

  const isPromptValid = () => {
    return !!(
      formData.function.trim().length >= 3 &&
      formData.style.trim().length >= 3 &&
      formData.instructions.trim().length >= 3
    );
  };

  const areLinksValid = () => {
    if (!formData.links || formData.links.length === 0) return true;

    return formData.links.every((link) => {
      if (!link.name || link.name.trim().length < 3) return false;
      try {
        new URL(link.url);
        return true;
      } catch {
        return false;
      }
    });
  };

  const areCustomFieldsValid = () => {
    if (!formData.customFields || formData.customFields.length === 0)
      return true;

    // Maximum one identifier
    const identifierCount = formData.customFields.filter(
      (field) => field.isIdentifier
    ).length;
    if (identifierCount > 1) return false;

    // Validate each field
    return formData.customFields.every((field) => {
      return (
        field.name.trim().length >= 3 &&
        field.label.trim().length >= 3 &&
        ["text", "number", "boolean"].includes(field.type)
      );
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case "intro":
        return true;
      case "basic":
        return isBasicValid();
      case "prompt":
        return isPromptValid();
      case "optional":
        return areLinksValid() && areCustomFieldsValid(); // Valida campos opcionais se preenchidos
      case "review":
        return (
          isBasicValid() &&
          isPromptValid() &&
          areLinksValid() &&
          areCustomFieldsValid()
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleFinish = () => {
    if (canProceed()) {
      onComplete();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "intro":
        return (
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Configurar Agente de IA
              </CardTitle>
              <CardDescription className="text-base">
                Vamos criar um agente inteligente para automatizar interações
                neste funil. Este processo tem 3 etapas principais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Informações Básicas</h4>
                    <p className="text-sm text-muted-foreground">
                      Nome, descrição, idioma e configurações iniciais do agente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Configuração de Prompt</h4>
                    <p className="text-sm text-muted-foreground">
                      Defina a personalidade, objetivo e comportamento do agente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Customizações (Opcional)</h4>
                    <p className="text-sm text-muted-foreground">
                      Tags para organização
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={handleNext}>
                Começar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Passo 1: Informações Básicas
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure as informações fundamentais do seu agente
              </p>
            </div>
            <BasicInformationCard
              formData={formData}
              updateFormData={updateFormData}
            />
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={!isBasicValid()}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "prompt":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Passo 2: Configuração de Prompt
              </h3>
              <p className="text-sm text-muted-foreground">
                Defina como o agente deve se comportar e responder
              </p>
            </div>
            <PromptContextCard
              formData={formData}
              updateFormData={updateFormData}
            />
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleNext} disabled={!isPromptValid()}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "optional":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Passo 3: Customizações (Opcional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione tags. Você pode pular esta etapa.
              </p>
            </div>
            <div className="space-y-6">
              <EntryTagsCard
                formData={formData}
                updateFormData={updateFormData}
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleNext}>
                  Pular
                </Button>
                <Button onClick={handleNext}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Revisão Final</CardTitle>
              <CardDescription>
                Revise as configurações do seu agente antes de finalizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Informações Básicas</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nome:</dt>
                      <dd className="font-medium">{formData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Descrição:</dt>
                      <dd className="font-medium">{formData.description}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Idioma:</dt>
                      <dd className="font-medium">{formData.language}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fuso Horário:</dt>
                      <dd className="font-medium">{formData.timeZone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Prompt</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Função:</dt>
                      <dd className="font-medium">{formData.function}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Estilo:</dt>
                      <dd className="font-medium">{formData.style}</dd>
                    </div>
                  </dl>
                </div>

                {(formData.customFields.length > 0 ||
                  formData.entryTags.length > 0) && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Customizações</h4>
                    <dl className="space-y-2 text-sm">
                      {formData.entryTags.length > 0 && (
                        <div>
                          <dt className="text-muted-foreground">
                            Tags de Entrada:
                          </dt>
                          <dd className="font-medium">
                            {formData.entryTags.length} tag(s)
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={handleFinish}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" /> Finalizar Configuração
              </Button>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Etapa {currentStepIndex + 1} de {steps.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      {renderStepContent()}
    </div>
  );
};
