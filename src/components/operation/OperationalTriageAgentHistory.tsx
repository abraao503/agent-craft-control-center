import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Route,
  XCircle,
} from "lucide-react";
import { useOperationalTriageAgentExecutions } from "@/hooks/useOperationalTriageAgentExecutions";
import { OperationalTriageAgentExecutionView } from "@/types/operation-triage-agent-execution";
import { getOperationalTriageAgentErrorMessage } from "@/utils/operationalTriageAgentErrors";
import { formatOperationalDateTime } from "@/components/operation/operationalChannelLabels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABELS: Record<OperationalTriageAgentExecutionView["status"], string> = {
  QUEUED: "Na fila",
  PROCESSING: "Processando",
  SUCCEEDED: "Concluída",
  FAILED: "Falhou",
  STALE: "Obsoleta",
  CANCELLED: "Cancelada",
};

const EXECUTION_ERROR_CODE_LABELS: Record<string, string> = {
  TRIAGE_AGENT_NOT_FOUND: "Agente de triagem não encontrado",
  TRIAGE_AGENT_DISABLED: "Agente de triagem desativado",
  TRIAGE_AGENT_INVALID_REQUEST: "Pedido inválido para o agente",
  TRIAGE_AGENT_CREDENTIAL_INVALID: "Credencial do agente rejeitada",
  TRIAGE_AGENT_TIMEOUT: "O agente não respondeu a tempo",
  TRIAGE_AGENT_RATE_LIMITED: "O agente está sobrecarregado",
  TRIAGE_AGENT_UNAUTHORIZED: "Acesso negado pelo agente",
  TRIAGE_AGENT_INVALID_RESPONSE: "Resposta inválida do agente",
  TRIAGE_AGENT_UNAVAILABLE: "Agente indisponível no momento",
  CHANNEL_UNAVAILABLE: "Canal indisponível para resposta",
  TRIAGE_ROUTE_NOT_FOUND: "Destino indicado não existe",
  TRIAGE_RUNTIME_FAILED: "Falha ao processar a triagem",
  EXECUTION_VERSION_PAYLOAD_MISMATCH: "Registro desatualizado",
  AUTOMATION_OWNERSHIP_STALE: "O atendimento mudou de estado",
  ATTENDANCE_NOT_FOUND: "Atendimento não encontrado",
  STALE_VERSION: "Registro desatualizado",
};

function formatExecutionErrorCode(errorCode: string | null): string {
  if (!errorCode) return "Nenhum";

  return (
    EXECUTION_ERROR_CODE_LABELS[errorCode] ??
    "Não foi possível concluir a triagem"
  );
}

export function OperationalTriageAgentHistory({
  workspaceId,
  attendanceId,
  enabled = true,
}: {
  workspaceId: string;
  attendanceId: string;
  enabled?: boolean;
}) {
  const query = useOperationalTriageAgentExecutions(
    workspaceId,
    attendanceId,
    enabled,
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-5 w-5 text-primary" />
          Triagem externa
        </CardTitle>
        <CardDescription>
          Histórico resumido das execuções do agente neste atendimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {query.isLoading ? (
          <div className="flex min-h-16 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando execuções...
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Histórico indisponível</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {getOperationalTriageAgentErrorMessage(
                  query.error,
                  "Não foi possível consultar o histórico da triagem.",
                )}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : query.data?.items.length ? (
          <div className="space-y-3">
            {query.data.items.map((execution) => (
              <ExecutionRow key={execution.id} execution={execution} />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma execução de agente registrada neste atendimento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ExecutionRow({
  execution,
}: {
  execution: OperationalTriageAgentExecutionView;
}) {
  const isProcessing =
    execution.status === "QUEUED" || execution.status === "PROCESSING";

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {execution.status === "SUCCEEDED" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : execution.status === "FAILED" || execution.status === "STALE" ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          ) : (
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{STATUS_LABELS[execution.status]}</span>
          <Badge variant="outline">{execution.attempts} tentativa(s)</Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatOperationalDateTime(execution.createdAt)}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <HistoryField
          label="Decisão"
          value={
            execution.decision === "ROUTE"
              ? "Encaminhar"
              : execution.decision === "ASK_CLARIFICATION"
                ? "Pedir esclarecimento"
                : "Não disponível"
          }
        />
        <HistoryField
          label="Confiança"
          value={
            execution.confidence === null
              ? "Não disponível"
              : `${Math.round(execution.confidence * 100)}%`
          }
        />
        <HistoryField
          label="Destino"
          value={
            execution.destination
              ? `${execution.destination.area} → ${execution.destination.queue}`
              : "Não definido"
          }
        />
        <HistoryField
          label="Erro"
          value={formatExecutionErrorCode(execution.errorCode)}
          attention={Boolean(execution.errorCode)}
        />
      </div>
      {execution.completedAt ? (
        <p className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">
          Concluída em {formatOperationalDateTime(execution.completedAt)}
        </p>
      ) : null}
    </div>
  );
}

function HistoryField({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: string;
  attention?: boolean;
}) {
  return (
    <div className="flex min-w-0 justify-between gap-3 rounded bg-muted/30 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={attention ? "font-medium text-destructive" : "text-right font-medium"}>
        {value}
      </span>
    </div>
  );
}
