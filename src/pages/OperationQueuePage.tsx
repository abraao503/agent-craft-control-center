import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalQueue } from "@/hooks/useOperationalQueue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OperationalQueueDetail } from "@/components/operation/OperationalQueueDetail";

export default function OperationQueuePage() {
  const { areaId, queueId } = useParams<{
    areaId: string;
    queueId: string;
  }>();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const queueQuery = useOperationalQueue(workspaceId, areaId, queueId);

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <SafeQueueState
        title="Workspace operacional não selecionado"
        description="Selecione um workspace operacional para abrir esta fila."
      />
    );
  }

  if (queueQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-[1100px]">
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando fila...
            </span>
          </CardContent>
        </Card>
      </section>
    );
  }

  const detail = queueQuery.data;
  const isConsistent = detail
    ? Boolean(workspaceId && areaId && queueId) &&
      detail.area.id === areaId &&
      detail.queue.id === queueId &&
      detail.area.workspaceId === workspaceId &&
      detail.queue.workspaceId === workspaceId &&
      detail.queue.areaId === areaId
    : false;

  if (queueQuery.isError || !detail || !isConsistent) {
    return (
      <SafeQueueState
        title="Fila indisponível"
        description="A fila não está mais ativa, não pertence a este workspace ou não pôde ser carregada."
        onRetry={queueQuery.isError ? () => queueQuery.refetch() : undefined}
        isRetrying={queueQuery.isFetching}
      />
    );
  }

  return (
    <OperationalQueueDetail
      workspaceId={currentWorkspace.id}
      area={detail.area}
      queue={detail.queue}
      onReload={queueQuery.refetch}
    />
  );
}

function SafeQueueState({
  title,
  description,
  onRetry,
  isRetrying = false,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-[1100px]">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {description}
          {onRetry ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link to="/operation/structure">
              <ArrowLeft className="h-4 w-4" />
              Voltar para estrutura
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    </section>
  );
}
