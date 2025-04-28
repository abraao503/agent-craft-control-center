import { useState } from "react";
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
import MainLayout from "@/components/layout/MainLayout";
import WhatsAppIntegrationCard from "@/components/whatsapp/WhatsAppIntegrationCard";
import { WHATSAPP_INTEGRATIONS } from "@/services/mockData";
import { WhatsAppIntegration } from "@/types/whatsapp";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const WhatsAppIntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<WhatsAppIntegration[]>(
    WHATSAPP_INTEGRATIONS
  );
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  const handleDeleteClick = (id: string) => {
    setIntegrationToDelete(id);
  };

  const confirmDelete = () => {
    if (integrationToDelete) {
      // deleteWhatsAppIntegration(integrationToDelete);
      setIntegrations(WHATSAPP_INTEGRATIONS);
      toast({
        title: "Integration deleted",
        description: "The WhatsApp integration has been successfully deleted.",
      });
      setIntegrationToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              WhatsApp Integrations
            </h1>
            <p className="text-muted-foreground">
              Connect your AI agents to WhatsApp
            </p>
          </div>
          <Link to="/integrations/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              New Integration
            </Button>
          </Link>
        </div>

        {integrations.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="font-medium text-lg">
              No WhatsApp integrations yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Connect your AI agents to WhatsApp to start interacting with users
            </p>
            <Link to="/integrations/new">
              <Button>Create Integration</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <WhatsAppIntegrationCard
                key={integration.id}
                integration={integration}
                onDelete={handleDeleteClick}
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              WhatsApp integration and disconnect it from your agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default WhatsAppIntegrationsPage;
