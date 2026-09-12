import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { OperationalChannelsManager } from "@/components/operation/OperationalChannelsManager";
import { OperationalSyntheticConsole } from "@/components/operation/OperationalSyntheticConsole";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlaskConical } from "lucide-react";

export default function OperationChannelsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
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
    <div className="space-y-6">
      <OperationalChannelsManager
        workspaceId={currentWorkspace.id}
        workspaceName={currentWorkspace.name}
      />
      {canOpenTestTools ? (
        <TestToolsSection workspaceId={currentWorkspace.id} />
      ) : null}
    </div>
  );
}

function TestToolsSection({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-8">
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <FlaskConical className="h-4 w-4" />
        Ferramentas de teste
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Ferramentas de teste</DialogTitle>
            <DialogDescription>
              Console sintético restrito ao desenvolvimento local; não faz parte
              da configuração de canais.
            </DialogDescription>
          </DialogHeader>
          <OperationalSyntheticConsole workspaceId={workspaceId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
