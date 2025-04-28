import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import WhatsAppForm from "@/components/whatsapp/WhatsAppForm";
import { WhatsAppFormData } from "@/types/whatsapp";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CreateWhatsAppIntegrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");
  const { toast } = useToast();

  const initialData: WhatsAppFormData = {
    name: "",
    provider: "twilio",
    phoneNumber: "",
    agentId: agentId || "",
  };

  const handleSubmit = (data: WhatsAppFormData) => {
    // const newIntegration = addWhatsAppIntegration(data);

    toast({
      title: "Integration created",
      description: "Your WhatsApp integration has been created successfully.",
    });

    navigate("/integrations");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            New WhatsApp Integration
          </h1>
        </div>
        <p className="text-muted-foreground">
          Connect your AI agent to WhatsApp using third-party services
        </p>

        <WhatsAppForm onSubmit={handleSubmit} initialData={initialData} />
      </div>
    </MainLayout>
  );
};

export default CreateWhatsAppIntegrationPage;
