import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import WhatsAppForm from "@/components/whatsapp/WhatsAppForm";
import { WhatsAppFormData } from "@/types/whatsapp";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWhatsAppIntegration } from "@/services/whatsapp";

const CreateWhatsAppIntegrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialData: Partial<WhatsAppFormData> = {
    agentId: agentId || "",
    externalToken: "",
    externalClientToken: "",
    postbackUrl: "",
    whatsappIntegrationId: "",
  };

  const createMutation = useMutation({
    mutationFn: (data: WhatsAppFormData) => createWhatsAppIntegration(data),
    onSuccess: () => {
      toast({
        title: "Integration created",
        description: "Your WhatsApp integration has been created successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["company-whatsapp-integrations"],
      });
      navigate("/integrations");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the WhatsApp integration.",
        variant: "destructive",
      });
      console.error("Error creating WhatsApp integration:", error);
    },
  });

  const handleSubmit = (data: WhatsAppFormData) => {
    createMutation.mutate(data);
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
          Connect your AI agent to WhatsApp
        </p>

        <WhatsAppForm onSubmit={handleSubmit} initialData={initialData} />
      </div>
    </MainLayout>
  );
};

export default CreateWhatsAppIntegrationPage;
