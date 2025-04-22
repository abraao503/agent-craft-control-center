
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const AgentStepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="flex justify-center items-center mb-8">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`step-item ${currentStep === index + 1 ? "active" : ""} ${
            currentStep > index + 1 ? "complete" : ""
          }`}
        >
          <div className="step">
            {currentStep > index + 1 ? (
              <Check className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          <p className="text-sm mt-2">{step}</p>
        </div>
      ))}
    </div>
  );
};

export default AgentStepIndicator;
