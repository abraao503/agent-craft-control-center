import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import WhatsAppForm from "@/components/whatsapp/WhatsAppForm";
import { WhatsAppFormData } from "@/types/whatsapp";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyWhatsAppIntegration,
  updateWhatsAppIntegration,
} from "@/services/whatsapp";

const EditWhatsAppIntegrationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ["get-whatsapp-integration", id],
    queryFn: () => getCompanyWhatsAppIntegration(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: WhatsAppFormData) =>
      updateWhatsAppIntegration(id!, {
        companyId: data.companyId || "",
        externalToken: data.externalToken,
        externalClientToken: data.externalClientToken,
        postbackUrl: data.postbackUrl,
        agentId: data.agentId,
        whatsappIntegrationId: data.whatsappIntegrationId,
      }),
    onSuccess: () => {
      toast({
        title: "Integration updated",
        description: "Your WhatsApp integration has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["company-whatsapp-integrations"],
      });
      navigate("/integrations");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the WhatsApp integration.",
        variant: "destructive",
      });
      console.error("Error updating WhatsApp integration:", error);
    },
  });

  const handleSubmit = (data: WhatsAppFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Loading integration...</p>
        </div>
      </MainLayout>
    );
  }

  if (!integration) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Integration not found</h2>
          <p className="text-muted-foreground">
            The WhatsApp integration you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/integrations")} className="mt-4">
            Back to Integrations
          </Button>
        </div>
      </MainLayout>
    );
  }

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
            Edit WhatsApp Integration
          </h1>
        </div>
        <p className="text-muted-foreground">
          Update your WhatsApp integration
        </p>

        <WhatsAppForm
          onSubmit={handleSubmit}
          initialData={integration}
          isEditMode={true}
        />
      </div>
    </MainLayout>
  );
};

export default EditWhatsAppIntegrationPage;
