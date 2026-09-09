import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Route,
  XCircle,
} from "lucide-react";
import { useOperationalTriageAgentExecutions } from "@/hooks/useOperationalTriageAgentExecutions";
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
import type { AttendanceDestinationSnapshot, AttendanceStatus } from "@/types/operation-attendance";
import type {
  OperationalTriageAgentExecutionView,
  OperationalTriageAgentHistoryContext,
  OperationalTriageAgentStage,
} from "@/types/operation-triage-agent-execution";

const STATUS_LABELS: Record<OperationalTriageAgentExecutionView["status"], string> = {
  QUEUED: "Na fila",
  PROCESSING: "Processando",
  SUCCEEDED: "Concluída",
  FAILED: "Falhou",
  STALE: "Obsoleta",
  CANCELLED: "Cancelada",
};

const STAGE_PRESENTATIONS: Record<
  OperationalTriageAgentStage,
  { label: string; description: string }
> = {
  MENU: {
    label: "MENU · Menu de entrada",
    description: "O atendimento aguarda a escolha inicial do cliente.",
  },
  WAITING_EXTERNAL_AGENT: {
    label: "Aguardando agente externo",
    description: "A solicitação foi recebida e aguarda o processamento do agente externo.",
  },
  CONVERSATION: {
    label: "CONVERSATION · Conversa com agente externo",
    description: "O agente externo conduz as perguntas e respostas da triagem.",
  },
  TRANSFER: {
    label: "TRANSFER · Transferido para fila humana",
    description: "A triagem encaminhou o atendimento para a fila configurada.",
  },
  HUMAN_QUEUE: {
    label: "Fila humana",
    description: "O atendimento aguarda um operador na fila configurada.",
  },
  HUMAN_CONTINGENCY: {
    label: "Contingência humana",
    description: "A triagem não foi concluída; o atendimento deve seguir pela equipe humana.",
  },
  HUMAN_SERVICE: {
    label: "Atendimento humano",
    description: "A conversa está sob responsabilidade da equipe humana.",
  },
  STALE: {
    label: "Triagem interrompida",
    description: "A execução perdeu validade porque o atendimento mudou de estado.",
  },
  CANCELLED: {
    label: "Triagem cancelada",
    description: "A execução foi cancelada antes de concluir esta etapa.",
  },
};

const EXECUTION_ERROR_CODE_LABELS: Record<string, string> = {
  TRIAGE_AGENT_NOT_FOUND: "Agente externo de triagem não encontrado",
  TRIAGE_AGENT_DISABLED: "Agente externo de triagem desativado",
  TRIAGE_AGENT_INVALID_REQUEST: "Pedido inválido para o agente externo",
  TRIAGE_AGENT_CREDENTIAL_INVALID: "Chave de acesso rejeitada",
  TRIAGE_AGENT_TIMEOUT: "O agente externo não respondeu a tempo",
  TRIAGE_AGENT_RATE_LIMITED: "O agente externo está sobrecarregado",
  TRIAGE_AGENT_UNAUTHORIZED: "Acesso negado pelo agente externo",
  TRIAGE_AGENT_INVALID_RESPONSE: "Resposta inválida do agente externo",
  TRIAGE_AGENT_UNAVAILABLE: "Agente externo indisponível no momento",
  CHANNEL_UNAVAILABLE: "Canal indisponível para resposta",
  TRIAGE_ROUTE_NOT_FOUND: "Destino indicado não existe",
  TRIAGE_RUNTIME_FAILED: "Falha ao processar a triagem",
  TRIAGE_AGENT_CONNECTION_FAILED: "Não foi possível conectar ao agente externo",
  TRIAGE_HANDOFF_FAILED: "Não foi possível encaminhar para atendimento humano",
  HANDOFF_ROUTE_NOT_FOUND: "Fila de atendimento não encontrada",
  HANDOFF_ROUTE_INCOMPLETE: "Área ou fila de atendimento não configurada",
  HANDOFF_AGENT_MISMATCH: "O agente externo não corresponde à rota",
  FAILED_TO_ROUTE_ATTENDANCE: "Não foi possível encaminhar o atendimento",
  DESTINATION_INACTIVE: "A fila de atendimento está inativa",
  EXECUTION_VERSION_PAYLOAD_MISMATCH: "Registro desatualizado",
  AUTOMATION_OWNERSHIP_STALE: "O atendimento mudou de estado",
  ATTENDANCE_NOT_FOUND: "Atendimento não encontrado",
  STALE_VERSION: "Registro desatualizado",
};

function formatExecutionErrorCode(errorCode: string | null): string {
  if (!errorCode) return "Sem erro";

  return (
    EXECUTION_ERROR_CODE_LABELS[errorCode] ??
    "Não foi possível concluir a triagem"
  );
}

function formatDestinationLabel(
  destination?: AttendanceDestinationSnapshot | null,
): string | null {
  const label = [destination?.areaName, destination?.queueName]
    .filter(Boolean)
    .join(" · ");

  return label || null;
}

function getExecutionStage(
  execution: OperationalTriageAgentExecutionView,
): OperationalTriageAgentStage {
  if (execution.status === "QUEUED") return "WAITING_EXTERNAL_AGENT";
  if (execution.status === "PROCESSING") return "CONVERSATION";
  if (execution.status === "FAILED") return "HUMAN_CONTINGENCY";
  if (execution.status === "STALE") return "STALE";
  if (execution.status === "CANCELLED") return "CANCELLED";
  return execution.destination ? "TRANSFER" : "CONVERSATION";
}

function getLatestExecution(
  executions: OperationalTriageAgentExecutionView[],
): OperationalTriageAgentExecutionView | null {
  return executions.reduce<OperationalTriageAgentExecutionView | null>(
    (latest, execution) =>
      !latest || execution.createdAt > latest.createdAt ? execution : latest,
    null,
  );
}

function getCurrentStage(
  executions: OperationalTriageAgentExecutionView[],
  context: OperationalTriageAgentHistoryContext,
): OperationalTriageAgentStage {
  const latest = getLatestExecution(executions);

  if (latest?.status === "QUEUED" || latest?.status === "PROCESSING") {
    return getExecutionStage(latest);
  }

  if (latest?.status === "FAILED") return "HUMAN_CONTINGENCY";

  if (latest?.status === "SUCCEEDED") {
    const hasTransfer = Boolean(
      latest.destination ||
        context.hasExternalHandoff ||
        (context.attendanceStatus !== "TRIAGE" && context.destinationLabel),
    );

    return hasTransfer ? "TRANSFER" : "CONVERSATION";
  }

  if (context.attendanceStatus === "TRIAGE") {
    if (latest?.status === "STALE") return "STALE";
    if (latest?.status === "CANCELLED") return "CANCELLED";
    return "MENU";
  }

  if (context.attendanceStatus === "WAITING_QUEUE") {
    return context.destinationLabel || context.hasExternalHandoff
      ? "TRANSFER"
      : "HUMAN_QUEUE";
  }

  return "HUMAN_SERVICE";
}

export function OperationalTriageAgentHistory({
  workspaceId,
  attendanceId,
  attendanceStatus,
  destination,
  hasExternalHandoff = false,
  enabled = true,
}: {
  workspaceId: string;
  attendanceId: string;
  attendanceStatus: AttendanceStatus;
  destination?: AttendanceDestinationSnapshot | null;
  hasExternalHandoff?: boolean;
  enabled?: boolean;
}) {
  const query = useOperationalTriageAgentExecutions(
    workspaceId,
    attendanceId,
    enabled,
  );
  const destinationLabel = formatDestinationLabel(destination);
  const context: OperationalTriageAgentHistoryContext = {
    attendanceStatus,
    destinationLabel,
    hasExternalHandoff,
  };
  const executions = query.data?.items ?? [];
  const currentStage = getCurrentStage(executions, context);
  const currentStagePresentation = STAGE_PRESENTATIONS[currentStage];

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-5 w-5 text-primary" />
          Agente externo
        </CardTitle>
        <CardDescription>
          Etapa atual e histórico das execuções do agente externo neste atendimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="mb-3 rounded-md border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Etapa atual
            </span>
            <Badge variant="outline">{currentStagePresentation.label}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentStagePresentation.description}
          </p>
          {destinationLabel ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Fila configurada: <span className="font-medium text-foreground">{destinationLabel}</span>
            </p>
          ) : null}
        </div>
        {query.isLoading ? (
          <div className="flex min-h-16 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando histórico do agente externo...
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
            Nenhuma execução do agente externo registrada neste atendimento.
            {currentStage === "MENU" ? " O atendimento permanece no MENU de entrada." : ""}
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
          label="Etapa"
          value={STAGE_PRESENTATIONS[getExecutionStage(execution)].label}
        />
        <HistoryField
          label="Fila"
          value={
            execution.destination
              ? `${execution.destination.area} → ${execution.destination.queue}`
              : "Ainda não definida"
          }
        />
        <HistoryField label="Situação" value={STATUS_LABELS[execution.status]} />
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
