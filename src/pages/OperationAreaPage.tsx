import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalArea } from "@/hooks/useOperationalArea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OperationalAreaDetail } from "@/components/operation/OperationalAreaDetail";

export default function OperationAreaPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const areaQuery = useOperationalArea(workspaceId, areaId);

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <SafeAreaState
        title="Workspace operacional não selecionado"
        description="Selecione um workspace operacional para abrir esta área."
      />
    );
  }

  if (areaQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-[1100px]">
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando área...
            </span>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (areaQuery.isError || !areaQuery.data || !areaId || !workspaceId) {
    return (
      <SafeAreaState
        title="Área indisponível"
        description="A área não está mais ativa, não pertence a este workspace ou não pôde ser carregada."
        onRetry={areaQuery.isError ? () => areaQuery.refetch() : undefined}
        isRetrying={areaQuery.isFetching}
      />
    );
  }

  return (
    <OperationalAreaDetail
      workspaceId={workspaceId}
      area={areaQuery.data}
      onReload={areaQuery.refetch}
    />
  );
}

function SafeAreaState({
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
