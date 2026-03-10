import { Plug } from "lucide-react";
import { GoogleCalendarIntegration } from "@/components/google-calendar/GoogleCalendarIntegration";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

export default function IntegrationsPage() {
  const { workspaceId } = useWorkspaceManager();

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workspace não encontrado</h2>
          <p className="text-muted-foreground">
            Você não está vinculado a nenhum workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie suas integrações e aplicativos conectados ao workspace.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GoogleCalendarIntegration workspaceId={workspaceId} />
      </div>
    </div>
  );
}
