import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  OperationalChecklistTemplateItemInput,
  OperationalChecklistTemplateVisibility,
} from "@/types/operational-checklist";

const checklistItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Informe o nome da etapa.")
    .max(240, "A etapa deve ter no máximo 240 caracteres."),
  responsible: z.enum(["CUSTOMER", "TEAM"]),
  required: z.boolean(),
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

const emptyItem: OperationalChecklistTemplateItemInput = {
  label: "",
  responsible: "CUSTOMER",
  required: true,
};

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
      items: [emptyItem],
    },
  });

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: template?.name ?? "",
      active: template?.active ?? true,
      items: template?.items.length
        ? template.items.map((item) => ({
            label: item.label,
            responsible: item.responsible,
            required: item.required,
          }))
        : [emptyItem],
    });
  }, [form, open, template]);

  const visibilityLabel = visibility === "OFFICIAL" ? "oficial" : "pessoal";
  const isEditing = Boolean(template);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar modelo" : "Novo modelo de checklist"}
          </DialogTitle>
          <DialogDescription>
            Este será um modelo {visibilityLabel}. Ao aplicar um modelo a um
            atendimento, a equipe poderá editar a cópia daquele atendimento.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              name: values.name.trim(),
              active: values.active,
              items: values.items.map((item) => ({
                label: item.label.trim(),
                responsible: item.responsible,
                required: item.required,
              })),
            });
          })}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="operational-checklist-template-name">
                Nome do modelo *
              </Label>
              <Input
                id="operational-checklist-template-name"
                autoFocus
                maxLength={160}
                disabled={isPending}
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            {isEditing ? (
              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(checked) =>
                    form.setValue("active", checked, { shouldDirty: true })
                  }
                  disabled={isPending}
                />
                Modelo ativo
              </label>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Etapas do checklist</h3>
                <p className="text-xs text-muted-foreground">
                  Ordene as etapas na sequência em que o operador deve conduzir
                  o atendimento.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending || fields.length >= 50}
                onClick={() => append(emptyItem)}
              >
                <Plus className="h-4 w-4" />
                Adicionar etapa
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const labelError = form.formState.errors.items?.[index]?.label
                  ?.message;
                const responsible = form.watch(
                  `items.${index}.responsible`,
                ) as OperationalChecklistItemResponsible;

                return (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md bg-background text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`checklist-item-${field.id}`}>
                            Etapa *
                          </Label>
                          <Input
                            id={`checklist-item-${field.id}`}
                            maxLength={240}
                            disabled={isPending}
                            placeholder="Ex.: Comprovante de residência atualizado"
                            {...form.register(`items.${index}.label`)}
                          />
                          {labelError ? (
                            <p className="text-xs text-destructive">
                              {labelError}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <div className="space-y-2">
                            <Label>Responsável</Label>
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
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CUSTOMER">
                                  Cliente
                                </SelectItem>
                                <SelectItem value="TEAM">
                                  Equipe
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <label className="flex h-10 items-center gap-2 text-sm">
                            <Checkbox
                              checked={form.watch(
                                `items.${index}.required`,
                              )}
                              onCheckedChange={(checked) =>
                                form.setValue(
                                  `items.${index}.required`,
                                  checked === true,
                                  { shouldDirty: true },
                                )
                              }
                              disabled={isPending}
                            />
                            Obrigatória
                          </label>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`Mover etapa ${index + 1} para cima`}
                          disabled={isPending || index === 0}
                          onClick={() => move(index, index - 1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`Mover etapa ${index + 1} para baixo`}
                          disabled={isPending || index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Remover etapa ${index + 1}`}
                          disabled={isPending || fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {typeof form.formState.errors.items?.message === "string" ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.items.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
