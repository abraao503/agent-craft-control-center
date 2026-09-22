import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Loader2,
  MoreHorizontal,
  Pencil,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [itemEditorOpen, setItemEditorOpen] = useState(false);
  const [editingItemClientId, setEditingItemClientId] = useState<string | null>(
    null,
  );
  const [itemDraftLabel, setItemDraftLabel] = useState("");
  const [itemToRemove, setItemToRemove] =
    useState<ChecklistDraftItem | null>(null);
  const isUpdating = checklistMutations.update.isPending;

  useEffect(() => {
    setDraftItems(toDraftItems(checklist.items));
  }, [checklist.id, checklist.updatedAt, checklist.version]);

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

  const persistItems = async (
    nextItems: ChecklistDraftItem[],
    successMessage?: string,
  ) => {
    setDraftItems(nextItems);

    try {
      await checklistMutations.update.mutateAsync({
        expectedVersion: checklist.version,
        name: checklist.name,
        items: nextItems.map((item, index) => ({
          ...(item.id ? { id: item.id } : {}),
          position: index + 1,
          label: item.label.trim(),
          responsible: item.responsible,
          required: item.required,
          completed: item.completed,
        })),
      });
      setConflictDetected(false);
      if (successMessage) {
        toast({
          title: "Checklist atualizada",
          description: successMessage,
        });
      }
      return true;
    } catch (error) {
      if (isChecklistVersionConflict(error)) {
        setConflictDetected(true);
        await onRefresh();
        toast({
          title: "Checklist atualizada por outra pessoa",
          description:
            "Os dados mais recentes foram carregados. Revise a etapa antes de tentar novamente.",
          variant: "destructive",
        });
        return false;
      }

      await onRefresh();
      toast({
        title: "Não foi possível atualizar a checklist",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize os dados e tente novamente.",
        ),
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleItem = (clientId: string) => {
    if (isUpdating) return;

    const nextItems = draftItems.map((item) =>
      item.clientId === clientId
        ? { ...item, completed: !item.completed }
        : item,
    );
    void persistItems(nextItems);
  };

  const openAddItem = () => {
    if (isUpdating) return;
    setEditingItemClientId(null);
    setItemDraftLabel("");
    setItemEditorOpen(true);
  };

  const openEditItem = (clientId: string) => {
    const item = draftItems.find((candidate) => candidate.clientId === clientId);
    if (!item || isUpdating) return;

    setEditingItemClientId(clientId);
    setItemDraftLabel(item.label);
    setItemEditorOpen(true);
  };

  const saveItem = async () => {
    const label = itemDraftLabel.trim();
    if (!label) {
      toast({
        title: "Descreva a etapa",
        description: "A checklist precisa de uma descrição para cada item.",
        variant: "destructive",
      });
      return;
    }

    if (!editingItemClientId && draftItems.length >= 50) {
      toast({
        title: "Limite de itens atingido",
        description: "Uma checklist pode ter no máximo 50 itens.",
        variant: "destructive",
      });
      return;
    }

    const nextItems = editingItemClientId
      ? draftItems.map((item) =>
          item.clientId === editingItemClientId ? { ...item, label } : item,
        )
      : [
          ...draftItems,
          {
            clientId: `new-${Date.now()}-${draftItems.length}`,
            checklistId: checklist.id,
            position: draftItems.length + 1,
            label,
            responsible: "CUSTOMER" as const,
            required: true,
            completed: false,
            completedAt: null,
            completedByUserId: null,
          },
        ];

    const saved = await persistItems(
      nextItems,
      editingItemClientId
        ? "A descrição da etapa foi atualizada."
        : "A nova etapa foi adicionada.",
    );
    if (saved) {
      setItemEditorOpen(false);
      setItemDraftLabel("");
      setEditingItemClientId(null);
    }
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    if (draftItems.length <= 1) {
      toast({
        title: "A checklist precisa de um item",
        description: "Mantenha ao menos um item antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const nextItems = draftItems
      .filter((item) => item.clientId !== itemToRemove.clientId)
      .map((item, index) => ({ ...item, position: index + 1 }));
    const saved = await persistItems(
      nextItems,
      "A etapa foi removida da cópia deste atendimento.",
    );
    if (saved) {
      setItemToRemove(null);
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
            {progress.completed} de {progress.total} concluídas
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

      {canOperate ? (
        <p className="text-xs text-muted-foreground">
          Clique em uma etapa para marcar ou desmarcar.
        </p>
      ) : null}

      <ol className="space-y-2">
        {(canOperate ? draftItems : checklist.items).map((item, index) => (
          <ChecklistItemRow
            key={item.id ?? (item as ChecklistDraftItem).clientId}
            item={item}
            index={index}
            canOperate={canOperate}
            isUpdating={isUpdating}
            canRemove={draftItems.length > 1}
            onToggle={toggleItem}
            onEdit={openEditItem}
            onRemove={setItemToRemove}
          />
        ))}
      </ol>

      {canOperate ? (
        <div className="border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={openAddItem}
            disabled={draftItems.length >= 50 || isUpdating}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar etapa
          </Button>
        </div>
      ) : null}

      {canOperate && isRefreshing ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Atualizando dados…
        </p>
      ) : null}

      <Dialog
        open={itemEditorOpen}
        onOpenChange={(open) => {
          setItemEditorOpen(open);
          if (!open) {
            setItemDraftLabel("");
            setEditingItemClientId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItemClientId ? "Editar etapa" : "Adicionar etapa"}
            </DialogTitle>
            <DialogDescription>
              Descreva a etapa que ficará visível para quem acompanha este atendimento.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={itemDraftLabel}
            onChange={(event) => setItemDraftLabel(event.target.value)}
            placeholder="Ex.: Enviar comprovante de residência"
            maxLength={300}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemEditorOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void saveItem()}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdating ? "Salvando…" : "Salvar etapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(itemToRemove)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setItemToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{itemToRemove?.label}” será removida apenas da cópia deste atendimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdating}
              onClick={(event) => {
                event.preventDefault();
                void confirmRemoveItem();
              }}
            >
              {isUpdating ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChecklistItemRow({
  item,
  index,
  canOperate,
  isUpdating,
  canRemove,
  onToggle,
  onEdit,
  onRemove,
}: {
  item: OperationalAttendanceChecklistItem | ChecklistDraftItem;
  index: number;
  canOperate: boolean;
  isUpdating: boolean;
  canRemove: boolean;
  onToggle: (clientId: string) => void;
  onEdit: (clientId: string) => void;
  onRemove: (item: ChecklistDraftItem) => void;
}) {
  const clientId = "clientId" in item ? item.clientId : item.id;
  const isCompleted = item.completed;
  const itemLabel = isCompleted
    ? `Desmarcar etapa ${index + 1}`
    : `Marcar etapa ${index + 1} como concluída`;
  const itemContent = (
    <>
      <span
        className={
          isCompleted
            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary transition-colors group-hover:bg-primary/10"
        }
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Circle className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
      <span
        className={
          isCompleted
            ? "min-w-0 flex-1 break-words text-left text-muted-foreground line-through"
            : "min-w-0 flex-1 break-words text-left"
        }
      >
        {item.label}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        {item.responsible === "CUSTOMER" ? (
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
        </span>
        <span className="sr-only">
          {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
        </span>
      </span>
    </>
  );

  return (
    <li
      className={
        isCompleted
          ? "flex min-w-0 items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 p-2 text-sm"
          : "group flex min-w-0 items-center gap-1 rounded-lg border bg-background p-2 text-sm transition-colors hover:border-primary/40"
      }
    >
      {canOperate ? (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onToggle(clientId)}
          disabled={isUpdating}
          aria-label={itemLabel}
          aria-pressed={isCompleted}
        >
          {itemContent}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 p-1">
          {itemContent}
        </div>
      )}
      {canOperate ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              disabled={isUpdating}
              aria-label={`Mais ações para etapa ${index + 1}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(clientId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar etapa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={!canRemove}
              onSelect={() => onRemove(item as ChecklistDraftItem)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover etapa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}

function toDraftItems(items: OperationalAttendanceChecklistItem[]): ChecklistDraftItem[] {
  return items.map((item) => ({ ...item, clientId: item.id }));
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
