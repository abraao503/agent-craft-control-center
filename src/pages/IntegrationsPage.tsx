import { GoogleCalendarIntegration } from "@/components/google-calendar/GoogleCalendarIntegration";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { MetaIntegrationCard } from "@/components/meta/MetaIntegrationCard";

export default function IntegrationsPage() {
  const { workspaceId } = useWorkspaceManager();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie integrações da empresa e dos workspaces autorizados.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetaIntegrationCard workspaceId={workspaceId} />
        {workspaceId && <GoogleCalendarIntegration workspaceId={workspaceId} />}
      </div>
    </div>
  );
}
