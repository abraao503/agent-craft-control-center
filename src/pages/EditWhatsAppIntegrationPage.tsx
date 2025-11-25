import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WhatsAppForm from "@/components/whatsapp/WhatsAppForm";
import { WhatsAppFormData } from "@/types/whatsapp";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyWhatsAppIntegration,
  updateWhatsAppIntegration,
} from "@/services/whatsapp";
import { useEffect } from "react";

const EditWhatsAppIntegrationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ["get-whatsapp-integration", id],
    queryFn: () => getCompanyWhatsAppIntegration(id || ""),
  });

  useEffect(() => {
    console.log("Integration data:", integration); // Debugging line to check the data in the cons
  }, [integration]);

  const updateMutation = useMutation({
    mutationFn: (data: WhatsAppFormData) =>
      updateWhatsAppIntegration(id!, {
        companyId: data.companyId || "",
        externalToken: data.externalToken,
        externalClientToken: data.externalClientToken,
        postbackUrl: data.postbackUrl,
        agentId: data.agentId,
        whatsappIntegrationName: data.whatsappIntegrationName,
      }),
    onSuccess: () => {
      toast({
        title: "Integração atualizada",
        description: "Sua integração do WhatsApp foi atualizada com sucesso.",
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
      <div>
        <div className="text-center py-12">
          <p>Carregando integração...</p>
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Integração não encontrada</h2>
          <p className="text-muted-foreground">
            A integração do WhatsApp que você procura não existe.
          </p>
          <Button onClick={() => navigate("/integrations")} className="mt-4">
            Voltar para Integrações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
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
            Editar Integração do WhatsApp
          </h1>
        </div>
        <p className="text-muted-foreground">
          Atualize sua integração do WhatsApp
        </p>

        <WhatsAppForm
          onSubmit={handleSubmit}
          initialData={integration}
          isEditMode={true}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
};

export default EditWhatsAppIntegrationPage;
