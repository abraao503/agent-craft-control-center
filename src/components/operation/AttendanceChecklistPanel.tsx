import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useOperationalAttendanceChecklist,
  useOperationalAttendanceChecklistMutations,
} from "@/hooks/useOperationalAttendanceChecklist";
import { useOperationalChecklistTemplates } from "@/hooks/useOperationalChecklistTemplates";
import { useToast } from "@/hooks/use-toast";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import {
  OperationalAttendanceChecklistItem,
  OperationalAttendanceChecklistView,
  OperationalChecklistTemplate,
} from "@/types/operational-checklist";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="p-3 pb-3">
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
          <CardContent className="space-y-3 px-3 pb-3">
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
              <AppliedChecklistContent
                checklist={checklistQuery.data}
                canOperate={canOperate}
                isRefreshing={checklistQuery.isFetching}
                onRefresh={() => checklistQuery.refetch()}
              />
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

type ChecklistDraftItem = Omit<OperationalAttendanceChecklistItem, "id"> & {
  id?: string;
  clientId: string;
};

function AppliedChecklistContent({
  checklist,
  canOperate,
  isRefreshing,
  onRefresh,
}: {
  checklist: OperationalAttendanceChecklistView;
  canOperate: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<unknown>;
}) {
  const { toast } = useToast();
  const checklistMutations = useOperationalAttendanceChecklistMutations(
    checklist.workspaceId,
    checklist.attendanceId,
  );
  const [draftItems, setDraftItems] = useState<ChecklistDraftItem[]>(() =>
    toDraftItems(checklist.items),
  );
  const [conflictDetected, setConflictDetected] = useState(false);

  useEffect(() => {
    setDraftItems(toDraftItems(checklist.items));
  }, [checklist.id, checklist.updatedAt, checklist.version]);

  const isDirty = useMemo(
    () => serializeChecklistItems(draftItems) !== serializeChecklistItems(checklist.items),
    [checklist.items, draftItems],
  );
  const progress = canOperate
    ? {
        total: draftItems.length,
        completed: draftItems.filter((item) => item.completed).length,
        pending: draftItems.filter((item) => !item.completed).length,
      }
    : checklist.progress;
  const percentage = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const isComplete = progress.pending === 0;

  const updateItem = (
    clientId: string,
    changes: Partial<ChecklistDraftItem>,
  ) => {
    setDraftItems((current) =>
      current.map((item) =>
        item.clientId === clientId ? { ...item, ...changes } : item,
      ),
    );
  };

  const addItem = () => {
    if (draftItems.length >= 50) {
      toast({
        title: "Limite de itens atingido",
        description: "Uma checklist pode ter no máximo 50 itens.",
        variant: "destructive",
      });
      return;
    }

    setDraftItems((current) => [
      ...current,
      {
        clientId: `new-${Date.now()}-${current.length}`,
        checklistId: checklist.id,
        position: current.length + 1,
        label: "",
        responsible: "CUSTOMER",
        required: true,
        completed: false,
        completedAt: null,
        completedByUserId: null,
      },
    ]);
  };

  const removeItem = (clientId: string) => {
    if (draftItems.length <= 1) {
      toast({
        title: "A checklist precisa de um item",
        description: "Mantenha ao menos um item antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setDraftItems((current) =>
      current
        .filter((item) => item.clientId !== clientId)
        .map((item, index) => ({ ...item, position: index + 1 })),
    );
  };

  const saveChanges = async () => {
    const invalidItem = draftItems.find((item) => !item.label.trim());
    if (invalidItem) {
      toast({
        title: "Preencha os itens da checklist",
        description: "Cada etapa precisa ter uma descrição antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await checklistMutations.update.mutateAsync({
        expectedVersion: checklist.version,
        name: checklist.name,
        items: draftItems.map((item, index) => ({
          ...(item.id ? { id: item.id } : {}),
          position: index + 1,
          label: item.label.trim(),
          responsible: item.responsible,
          required: item.required,
          completed: item.completed,
        })),
      });
      setConflictDetected(false);
      toast({
        title: "Checklist atualizada",
        description: "As alterações foram salvas neste atendimento.",
      });
    } catch (error) {
      if (isChecklistVersionConflict(error)) {
        setConflictDetected(true);
        await onRefresh();
        toast({
          title: "Checklist atualizada por outra pessoa",
          description:
            "Os dados mais recentes foram carregados. Revise as alterações antes de salvar novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Não foi possível atualizar a checklist",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize os dados e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {conflictDetected ? (
        <Alert variant="destructive">
          <AlertTitle>Os dados foram atualizados durante a edição</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            A cópia atual já foi recarregada. Faça uma nova revisão antes de salvar.
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConflictDetected(false)}
            >
              Entendi
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{checklist.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Modelo v{checklist.templateVersion} · {progress.completed} de {progress.total} concluídas
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-muted-foreground">
            {percentage}% concluída
          </span>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className="shrink-0 whitespace-nowrap"
          >
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
        {canOperate
          ? draftItems.map((item, index) => (
              <EditableChecklistItem
                key={item.clientId}
                item={item}
                index={index}
                canRemove={draftItems.length > 1}
                onChange={updateItem}
                onRemove={removeItem}
              />
            ))
          : checklist.items.map((item) => (
              <ReadOnlyChecklistItem key={item.id} item={item} />
            ))}
      </ol>

      {canOperate ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addItem}
            disabled={draftItems.length >= 50 || checklistMutations.update.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar item
          </Button>
          <Button
            size="sm"
            className="w-full"
            onClick={() => void saveChanges()}
            disabled={!isDirty || checklistMutations.update.isPending}
          >
            {checklistMutations.update.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {checklistMutations.update.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      ) : null}

      {canOperate && isRefreshing ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Atualizando dados…
        </p>
      ) : null}
    </div>
  );
}

function EditableChecklistItem({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  item: ChecklistDraftItem;
  index: number;
  canRemove: boolean;
  onChange: (clientId: string, changes: Partial<ChecklistDraftItem>) => void;
  onRemove: (clientId: string) => void;
}) {
  return (
    <li className="space-y-3 rounded-md border bg-background px-3 py-3 text-sm">
      <div className="flex min-w-0 items-start gap-2">
        <Checkbox
          checked={item.completed}
          onCheckedChange={(checked) =>
            onChange(item.clientId, { completed: checked === true })
          }
          aria-label={`Marcar item ${index + 1} como concluído`}
          className="mt-2"
        />
        <Input
          value={item.label}
          onChange={(event) =>
            onChange(item.clientId, { label: event.target.value })
          }
          placeholder="Descreva a etapa"
          aria-label={`Descrição do item ${index + 1}`}
          className="min-w-0 flex-1"
          maxLength={300}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.clientId)}
          disabled={!canRemove}
          aria-label={`Remover item ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {item.responsible === "CUSTOMER" ? (
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
        </span>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={item.required}
            onCheckedChange={(checked) =>
              onChange(item.clientId, { required: checked === true })
            }
            aria-label={`Item ${index + 1} obrigatório`}
          />
          Obrigatória
        </label>
      </div>
    </li>
  );
}

function ReadOnlyChecklistItem({
  item,
}: {
  item: OperationalAttendanceChecklistItem;
}) {
  return (
    <li className="min-w-0 space-y-2 rounded-md border bg-background px-3 py-2 text-sm">
      <div className="flex min-w-0 items-start gap-3">
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
          className={
            item.completed
              ? "min-w-0 flex-1 break-words text-muted-foreground line-through"
              : "min-w-0 flex-1 break-words"
          }
        >
          {item.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {item.responsible === "CUSTOMER" ? (
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
        </span>
        <span>{item.required ? "Obrigatória" : "Opcional"}</span>
      </div>
    </li>
  );
}

function toDraftItems(items: OperationalAttendanceChecklistItem[]): ChecklistDraftItem[] {
  return items.map((item) => ({ ...item, clientId: item.id }));
}

function serializeChecklistItems(
  items: Array<OperationalAttendanceChecklistItem | ChecklistDraftItem>,
) {
  return items
    .map((item, index) =>
      JSON.stringify({
        id: item.id,
        position: index + 1,
        label: item.label,
        responsible: item.responsible,
        required: item.required,
        completed: item.completed,
      }),
    )
    .join("|");
}

function isChecklistVersionConflict(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 409;
  }

  return (
    error instanceof Error &&
    error.message === "STALE_ATTENDANCE_CHECKLIST_VERSION"
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
