import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";
import { OperationWebhookStatusBadge } from "@/components/operation-webhooks/OperationWebhookStatusBadge";
import type {
  OperationalWebhookExecution,
  OperationalWebhookExecutionPage,
  OperationalWebhookExecutionStatus,
} from "@/types/operational-webhook";

interface Props {
  data?: OperationalWebhookExecutionPage;
  isLoading: boolean;
  isError: boolean;
  page: number;
  status?: OperationalWebhookExecutionStatus;
  onPageChange: (page: number) => void;
  onStatusChange: (status?: OperationalWebhookExecutionStatus) => void;
  onRetry: () => void;
  onOpen: (execution: OperationalWebhookExecution) => void;
}

export function OperationWebhookExecutions({
  data,
  isLoading,
  isError,
  page,
  status,
  onPageChange,
  onStatusChange,
  onRetry,
  onOpen,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Execuções do webhook</CardTitle>
        <Select value={status ?? "ALL"} onValueChange={(value) => onStatusChange(value === "ALL" ? undefined : value as OperationalWebhookExecutionStatus)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar execuções">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDING">Aguardando</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="ACCEPTED">Aceito</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="UNKNOWN">Indefinido</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico.</p>
            <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>
          </div>
        ) : !data?.items.length ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma execução encontrada.</p>
        ) : (
          <>
            <div className="divide-y rounded-md border">
              {data.items.map((execution) => (
                <button
                  key={execution.id}
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/50"
                  onClick={() => onOpen(execution)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <OperationWebhookStatusBadge status={execution.status} />
                      <span className="text-sm font-medium">{execution.kind === "TEMPLATE" ? "Template Meta" : "Texto"}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(execution.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · telefone final {execution.phone.slice(-4)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            {data.totalPages > 1 && (
              <div className="mt-4">
                <SmartPagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={onPageChange}
                  showItemCount
                  itemsPerPage={data.limit}
                  totalItems={data.total}
                  itemLabel="execuções"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
