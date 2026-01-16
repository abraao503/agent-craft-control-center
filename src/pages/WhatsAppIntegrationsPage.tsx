import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import WhatsAppIntegrationCard from "@/components/whatsapp/WhatsAppIntegrationCard";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCompanyWhatsAppIntegrations,
  deleteWhatsAppIntegration,
} from "@/services/whatsapp";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePermissions } from "@/hooks/usePermissions";

const WhatsAppIntegrationsPage = () => {
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { has } = usePermissions();

  // Usar o hook de gerenciamento de workspace
  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["company-whatsapp-integrations"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const token = localStorage.getItem("token") || "";
  const { socket, connected, joinedWorkspace } = useWebSocket({
    workspaceId: workspaceId || "",
    token,
    enabled: !!workspaceId,
  });

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["company-whatsapp-integrations", workspaceId],
    queryFn: () => listCompanyWhatsAppIntegrations(workspaceId || ""),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWhatsAppIntegration(id),
    onSuccess: () => {
      toast({
        title: "Integração excluída",
        description: "A integração do WhatsApp foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["company-whatsapp-integrations"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the WhatsApp integration.",
        variant: "destructive",
      });
      console.error("Error deleting WhatsApp integration:", error);
    },
  });

  const handleDeleteClick = (id: string) => {
    setIntegrationToDelete(id);
  };

  const confirmDelete = () => {
    if (integrationToDelete) {
      deleteMutation.mutate(integrationToDelete);
      setIntegrationToDelete(null);
    }
  };

  // Verifica se o usuário tem permissão para gerenciar integrações
  const canManageIntegrations = has("manage:integrations");

  const IntegrationSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Integrações do WhatsApp
            </h1>
            <p className="text-muted-foreground">
              Conecte seus agentes de IA ao WhatsApp
            </p>
          </div>
          {canManageIntegrations && (
            <Link to="/integrations/new">
              <Button className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Nova Integração
              </Button>
            </Link>
          )}
        </div>

        {isLoading || isChangingWorkspace ? (
          <IntegrationSkeletons />
        ) : integrations.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="font-medium text-lg">
              Nenhuma integração do WhatsApp ainda
            </h3>
            <p className="text-muted-foreground mb-4">
              Conecte seus agentes de IA ao WhatsApp para começar a interagir
              com usuários
            </p>
            {canManageIntegrations && (
              <Link to="/integrations/new">
                <Button>Criar Integração</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <WhatsAppIntegrationCard
                key={integration.id}
                workspaceId={workspaceId || ""}
                integration={integration}
                onDelete={handleDeleteClick}
                canEdit={canManageIntegrations}
                canDelete={canManageIntegrations}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!integrationToDelete}
        onOpenChange={() => setIntegrationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              integração do WhatsApp e a desconectará do seu agente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WhatsAppIntegrationsPage;
