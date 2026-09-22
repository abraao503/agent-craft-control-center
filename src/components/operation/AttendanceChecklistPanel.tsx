import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useOperationalAttendanceChecklist, useOperationalAttendanceChecklistMutations } from "@/hooks/useOperationalAttendanceChecklist";
import { useOperationalChecklistTemplates } from "@/hooks/useOperationalChecklistTemplates";
import { useToast } from "@/hooks/use-toast";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import { OperationalChecklistTemplate } from "@/types/operational-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceChecklistPanelProps {
  workspaceId: string;
  attendanceId: string;
  canOperate: boolean;
}

export function AttendanceChecklistPanel({
  workspaceId,
  attendanceId,
  canOperate,
}: AttendanceChecklistPanelProps) {
  const { toast } = useToast();
  const checklistQuery = useOperationalAttendanceChecklist(
    workspaceId,
    attendanceId,
  );
  const templatesQuery = useOperationalChecklistTemplates(workspaceId);
  const checklistMutations = useOperationalAttendanceChecklistMutations(
    workspaceId,
    attendanceId,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const activeTemplates = useMemo(
    () => (templatesQuery.data ?? []).filter((template) => template.active),
    [templatesQuery.data],
  );

  useEffect(() => {
    if (
      selectedTemplateId &&
      activeTemplates.some((template) => template.id === selectedTemplateId)
    ) {
      return;
    }

    setSelectedTemplateId(activeTemplates[0]?.id ?? "");
  }, [activeTemplates, selectedTemplateId]);

  const applyChecklist = async () => {
    if (!selectedTemplateId) return;

    try {
      await checklistMutations.apply.mutateAsync({
        templateId: selectedTemplateId,
      });
      toast({
        title: "Checklist aplicada",
        description: "A cópia do modelo foi vinculada a este atendimento.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível aplicar a checklist",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize o atendimento e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible defaultOpen>
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-primary" />
                  Checklist
                </span>
                <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">
                  Acompanhe documentos e etapas deste atendimento.
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 px-3 pb-3">
            {checklistQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar a checklist</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  {getOperationalAttendanceErrorMessage(
                    checklistQuery.error,
                    "Tente atualizar os dados do atendimento.",
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void checklistQuery.refetch()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </AlertDescription>
              </Alert>
            ) : checklistQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando checklist…
              </div>
            ) : checklistQuery.data ? (
              <AppliedChecklistContent checklist={checklistQuery.data} />
            ) : (
              <EmptyChecklistContent
                activeTemplates={activeTemplates}
                canOperate={canOperate}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                templatesQueryIsError={templatesQuery.isError}
                templatesQueryError={templatesQuery.error}
                templatesQueryIsLoading={templatesQuery.isLoading}
                isApplying={checklistMutations.apply.isPending}
                onApply={() => void applyChecklist()}
                onRetryTemplates={() => void templatesQuery.refetch()}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function AppliedChecklistContent({
  checklist,
}: {
  checklist: NonNullable<
    ReturnType<typeof useOperationalAttendanceChecklist>["data"]
  >;
}) {
  const { progress } = checklist;
  const percentage = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const isComplete = progress.pending === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{checklist.name}</p>
            <p className="text-xs text-muted-foreground">
              Modelo v{checklist.templateVersion} · {progress.completed} de {progress.total} concluídas
            </p>
          </div>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {isComplete ? "Concluída" : "Em andamento"}
          </Badge>
        </div>
        <Progress
          value={percentage}
          aria-label={`${percentage}% da checklist concluída`}
          className="h-2"
        />
      </div>

      <ol className="space-y-2">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-md border bg-background px-3 py-2 text-sm"
          >
            {item.completed ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span
              className={item.completed ? "min-w-0 flex-1 text-muted-foreground line-through" : "min-w-0 flex-1"}
            >
              {item.label}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {item.responsible === "CUSTOMER" ? (
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
              </span>
              {item.required ? "Obrigatória" : "Opcional"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmptyChecklistContent({
  activeTemplates,
  canOperate,
  selectedTemplateId,
  setSelectedTemplateId,
  templatesQueryIsError,
  templatesQueryError,
  templatesQueryIsLoading,
  isApplying,
  onApply,
  onRetryTemplates,
}: {
  activeTemplates: OperationalChecklistTemplate[];
  canOperate: boolean;
  selectedTemplateId: string;
  setSelectedTemplateId: (templateId: string) => void;
  templatesQueryIsError: boolean;
  templatesQueryError: unknown;
  templatesQueryIsLoading: boolean;
  isApplying: boolean;
  onApply: () => void;
  onRetryTemplates: () => void;
}) {
  if (!canOperate) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma checklist aplicada. Você pode acompanhar checklists aplicadas, mas não pode aplicar uma.
      </p>
    );
  }

  if (templatesQueryIsError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar os modelos</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {getOperationalAttendanceErrorMessage(
            templatesQueryError,
            "Tente atualizar os modelos de checklist.",
          )}
          <Button variant="outline" size="sm" onClick={onRetryTemplates}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (templatesQueryIsLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando modelos disponíveis…
      </div>
    );
  }

  if (!activeTemplates.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum modelo ativo está disponível para este ambiente.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecione um modelo oficial ou pessoal para acompanhar as etapas deste atendimento.
      </p>
      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
        <SelectTrigger aria-label="Modelo de checklist">
          <SelectValue placeholder="Selecione um modelo" />
        </SelectTrigger>
        <SelectContent>
          {activeTemplates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name} · {template.visibility === "OFFICIAL" ? "Oficial" : "Pessoal"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="w-full"
        size="sm"
        onClick={onApply}
        disabled={!selectedTemplateId || isApplying}
      >
        {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
        {isApplying ? "Aplicando…" : "Aplicar checklist"}
      </Button>
    </div>
  );
}
