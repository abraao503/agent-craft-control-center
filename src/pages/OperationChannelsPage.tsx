import { AlertCircle } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { OperationalChannelsManager } from "@/components/operation/OperationalChannelsManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OperationChannelsPage() {
  const { currentWorkspace } = useWorkspaceContext();

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em workspaces operacionais</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para administrar canais e rotas.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <OperationalChannelsManager
      workspaceId={currentWorkspace.id}
      workspaceName={currentWorkspace.name}
    />
  );
}
