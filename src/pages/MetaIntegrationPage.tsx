import { Link } from "react-router-dom";
import { ArrowLeft, Facebook } from "lucide-react";
import { MetaIntegrationCard } from "@/components/meta/MetaIntegrationCard";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

export default function MetaIntegrationPage() {
  const { workspaceId } = useWorkspaceManager();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Link
        to="/integrations"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Todas as integrações
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Facebook className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Marketing e aquisição</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Meta Ads e Lead Ads
          </h1>
        </div>
      </div>
      <MetaIntegrationCard workspaceId={workspaceId} showHeader={false} />
    </div>
  );
}
