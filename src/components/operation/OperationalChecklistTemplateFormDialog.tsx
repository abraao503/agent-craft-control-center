import { useEffect } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  OperationalChecklistItemResponsible,
  OperationalChecklistTemplate,
  OperationalChecklistTemplateVisibility,
} from "@/types/operational-checklist";

const checklistItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Informe o nome da etapa.")
    .max(240, "A etapa deve ter no máximo 240 caracteres."),
  responsible: z.enum(["CUSTOMER", "TEAM"]),
});

const checklistTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome para o modelo.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  active: z.boolean(),
  items: z
    .array(checklistItemSchema)
    .min(1, "Adicione pelo menos uma etapa.")
    .max(50, "O modelo pode ter no máximo 50 etapas."),
});

export type OperationalChecklistTemplateFormValues = z.infer<
  typeof checklistTemplateSchema
>;

type OperationalChecklistTemplateFormDialogProps = {
  open: boolean;
  template: OperationalChecklistTemplate | null;
  visibility: OperationalChecklistTemplateVisibility;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalChecklistTemplateFormValues) => Promise<void>;
};

const createEmptyItem = (): z.infer<typeof checklistItemSchema> => ({
  label: "",
  responsible: "CUSTOMER",
});

type SortableChecklistItemRowProps = {
  id: string;
  index: number;
  disabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
  children: ReactNode;
};

function SortableChecklistItemRow({
  id,
  index,
  disabled,
  canRemove,
  onRemove,
  children,
}: SortableChecklistItemRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : undefined,
      }}
      className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-x-2 gap-y-2 px-2.5 py-2.5 sm:grid-cols-[2rem_minmax(0,1fr)_180px_2rem] sm:gap-x-3 sm:px-3"
    >
      <div className="flex items-center gap-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="inline-flex h-8 w-6 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          aria-label={`Reordenar etapa ${index + 1}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <span
          aria-hidden="true"
          className="hidden text-xs tabular-nums text-muted-foreground sm:inline"
        >
          {index + 1}
        </span>
      </div>

      {children}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="col-start-3 row-start-1 h-8 w-8 text-muted-foreground hover:text-destructive sm:col-start-4"
        aria-label={`Remover etapa ${index + 1}`}
        title="Remover etapa"
        disabled={disabled || !canRemove}
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function OperationalChecklistTemplateFormDialog({
  open,
  template,
  visibility,
  isPending,
  onOpenChange,
  onSubmit,
}: OperationalChecklistTemplateFormDialogProps) {
  const form = useForm<OperationalChecklistTemplateFormValues>({
    resolver: zodResolver(checklistTemplateSchema),
    defaultValues: {
      name: "",
      active: true,
      items: [createEmptyItem()],
    },
  });

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: template?.name ?? "",
      active: template?.active ?? true,
      items: template?.items.length
        ? template.items.map((item) => ({
            label: item.label,
            responsible: item.responsible,
          }))
        : [createEmptyItem()],
    });
  }, [form, open, template]);

  const visibilityLabel = visibility === "OFFICIAL" ? "oficial" : "pessoal";
  const isEditing = Boolean(template);
  const description = isEditing
    ? "Vale para novos atendimentos; checklists já aplicadas mantêm sua cópia."
    : `Este será um modelo ${visibilityLabel}. Cada aplicação cria uma cópia editável para o atendimento.`;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) move(oldIndex, newIndex);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader className="shrink-0 border-b px-5 py-4 text-left sm:px-6">
          <DialogTitle>
            {isEditing ? "Editar modelo" : "Novo modelo"}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              name: values.name.trim(),
              active: values.active,
              items: values.items.map((item) => ({
                label: item.label.trim(),
                responsible: item.responsible,
              })),
            });
          })}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="operational-checklist-template-name">
                  Nome do modelo
                </Label>
                <Input
                  id="operational-checklist-template-name"
                  autoFocus
                  maxLength={160}
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              {isEditing ? (
                <div className="flex items-center gap-3 sm:border-l sm:pl-5">
                    <Switch
                      id="operational-checklist-template-active"
                      checked={form.watch("active")}
                      onCheckedChange={(checked) =>
                        form.setValue("active", checked, { shouldDirty: true })
                      }
                      disabled={isPending}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="operational-checklist-template-active"
                        className="text-sm font-medium"
                      >
                        Ativo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Disponível em novos atendimentos
                      </p>
                    </div>
                </div>
              ) : null}
            </div>

            <section className="space-y-3" aria-labelledby="checklist-template-items-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      id="checklist-template-items-title"
                      className="text-sm font-semibold"
                    >
                      Etapas
                    </h3>
                    <Badge variant="secondary" className="tabular-nums">
                      {fields.length} / 50
                    </Badge>
                  </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Arraste pelo ícone para definir a ordem.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                  disabled={isPending || fields.length >= 50}
                  onClick={() => append(createEmptyItem())}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar etapa
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y overflow-hidden rounded-xl border bg-background">
                    {fields.map((field, index) => {
                  const labelError = form.formState.errors.items?.[index]?.label
                    ?.message;
                  const responsible = form.watch(
                    `items.${index}.responsible`,
                  ) as OperationalChecklistItemResponsible;
                  const itemInputId = `checklist-item-${field.id}`;
                  const responsibleId = `checklist-item-responsible-${field.id}`;

                  return (
                    <SortableChecklistItemRow
                      key={field.id}
                      id={field.id}
                      index={index}
                      disabled={isPending}
                      canRemove={fields.length > 1}
                      onRemove={() => remove(index)}
                    >
                        <div className="col-start-2 row-start-1 min-w-0 sm:col-start-2">
                          <Label htmlFor={itemInputId} className="sr-only">
                            Etapa {index + 1}
                          </Label>
                          <Input
                            id={itemInputId}
                            className="h-9"
                            maxLength={240}
                            disabled={isPending}
                            placeholder="Descreva a etapa"
                            aria-invalid={Boolean(labelError)}
                            {...form.register(`items.${index}.label`)}
                          />
                          {labelError ? (
                            <p className="text-xs text-destructive">{labelError}</p>
                          ) : null}
                        </div>

                        <div className="col-start-2 col-span-2 row-start-2 flex min-w-0 items-center justify-between gap-3 sm:col-start-3 sm:col-span-1 sm:row-start-1 sm:justify-end">
                          <Label
                            htmlFor={responsibleId}
                            className="shrink-0 text-xs text-muted-foreground sm:sr-only"
                          >
                            Responsável
                          </Label>
                          <Select
                            value={responsible}
                            onValueChange={(value) =>
                              form.setValue(
                                `items.${index}.responsible`,
                                value as OperationalChecklistItemResponsible,
                                { shouldDirty: true, shouldValidate: true },
                              )
                            }
                            disabled={isPending}
                          >
                            <SelectTrigger
                              id={responsibleId}
                              aria-label={`Responsável pela etapa ${index + 1}`}
                              className="h-8 w-[148px] sm:w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">Cliente</SelectItem>
                              <SelectItem value="TEAM">Equipe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </SortableChecklistItemRow>
                  );
                })}
                  </div>
                </SortableContext>
              </DndContext>
              {typeof form.formState.errors.items?.message === "string" ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.items.message}
                </p>
              ) : null}
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending
                ? "Salvando…"
                : isEditing
                  ? "Salvar alterações"
                  : "Criar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
