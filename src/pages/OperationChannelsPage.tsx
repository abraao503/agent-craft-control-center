import { AlertCircle } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { OperationalChannelsManager } from "@/components/operation/OperationalChannelsManager";
import { OperationalSyntheticConsole } from "@/components/operation/OperationalSyntheticConsole";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OperationChannelsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para administrar canais e rotas.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <OperationalChannelsManager
        workspaceId={currentWorkspace.id}
        workspaceName={currentWorkspace.name}
      />
      {has("manage:operation-channels") ? (
        <div className="mx-auto w-full max-w-6xl">
          <OperationalSyntheticConsole workspaceId={currentWorkspace.id} />
        </div>
      ) : null}
    </div>
  );
}
