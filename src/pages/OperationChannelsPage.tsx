import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { OperationalChannelsManager } from "@/components/operation/OperationalChannelsManager";
import { OperationalSyntheticConsole } from "@/components/operation/OperationalSyntheticConsole";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OperationChannelsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const [testToolsOpen, setTestToolsOpen] = useState(false);
  const isLocalEnvironment =
    import.meta.env.DEV && import.meta.env.VITE_APP_ENV === "development";
  const canOpenTestTools =
    isLocalEnvironment && has("manage:operation-channels");

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para administrar canais e destinos.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <>
      <OperationalChannelsManager
        workspaceId={currentWorkspace.id}
        workspaceName={currentWorkspace.name}
        onOpenTestTools={
          canOpenTestTools ? () => setTestToolsOpen(true) : undefined
        }
      />
      <Dialog open={testToolsOpen} onOpenChange={setTestToolsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Simular mensagem de entrada</DialogTitle>
            <DialogDescription>
              Ferramenta exclusiva do ambiente de desenvolvimento. A simulação
              não envia mensagens a um provedor real.
            </DialogDescription>
          </DialogHeader>
          <OperationalSyntheticConsole
            workspaceId={currentWorkspace.id}
            embedded
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
