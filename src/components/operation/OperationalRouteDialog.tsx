import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelEntryMode,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { OperationalAssistantOption } from "@/types/operation-assistant";
import { ServiceArea, ServiceQueue } from "@/types/operation";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
} from "@/components/operation/operationalChannelLabels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const routeFormSchema = z
  .object({
    channelId: z.string().uuid("Selecione um canal"),
    entryMode: z.enum(["TRIAGE", "QUEUE", "ASSISTANT"]),
    assistantId: z.string().uuid("Selecione um Assistant").nullable(),
    targetAreaId: z.string().uuid("Selecione uma área").nullable(),
    targetQueueId: z.string().uuid("Selecione uma fila").nullable(),
    fallbackAreaId: z.string().uuid("Selecione uma área de fallback").nullable(),
    fallbackQueueId: z.string().uuid("Selecione uma fila de fallback").nullable(),
    active: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.entryMode === "QUEUE") {
      if (!values.targetAreaId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetAreaId"],
          message: "Selecione a área de entrada",
        });
      }
      if (!values.targetQueueId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetQueueId"],
          message: "Selecione a fila de entrada",
        });
      }
    }

    if (values.entryMode === "ASSISTANT") {
      if (!values.assistantId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assistantId"],
          message: "Selecione o Assistant de entrada",
        });
      }
      if (!values.fallbackAreaId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackAreaId"],
          message: "Selecione a área de fallback",
        });
      }
      if (!values.fallbackQueueId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackQueueId"],
          message: "Selecione a fila de fallback",
        });
      }
    }
  });

export type OperationalRouteFormValues = z.infer<typeof routeFormSchema>;

type OperationalRouteDialogProps = {
  open: boolean;
  route: OperationalChannelRoute | null;
  defaultChannelId: string;
  channels: OperationalChannel[];
  areas: ServiceArea[];
  queues: ServiceQueue[];
  assistants: OperationalAssistantOption[];
  optionsLoading: boolean;
  optionsError: boolean;
  isPending: boolean;
  onRetryOptions: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalRouteFormValues) => Promise<void>;
};

export function OperationalRouteDialog({
  open,
  route,
  defaultChannelId,
  channels,
  areas,
  queues,
  assistants,
  optionsLoading,
  optionsError,
  isPending,
  onRetryOptions,
  onOpenChange,
  onSubmit,
}: OperationalRouteDialogProps) {
  const form = useForm<OperationalRouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: getDefaultValues(route, defaultChannelId),
  });
  const entryMode = form.watch("entryMode");
  const targetAreaId = form.watch("targetAreaId");
  const fallbackAreaId = form.watch("fallbackAreaId");

  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(route, defaultChannelId));
  }, [defaultChannelId, form, open, route]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const channelOptions = addCurrentOption(
    channels
      .filter((channel) => channel.active)
      .map((channel) => ({
        id: channel.id,
        name: channel.displayName || channel.providerAlias,
        active: channel.active,
      })),
    route?.channelId,
    channels.find((channel) => channel.id === route?.channelId)?.displayName ||
      "Canal atual (desativado)",
  );
  const areaOptions = addCurrentOption(
    areas.filter((area) => area.active),
    route?.targetAreaId,
    route?.destinations.targetArea?.name,
  );
  const fallbackAreaOptions = addCurrentOption(
    areas.filter((area) => area.active),
    route?.fallbackAreaId,
    route?.destinations.fallbackArea?.name,
  );
  const targetQueueOptions = addCurrentOption(
    queues.filter((queue) => queue.active && queue.areaId === targetAreaId),
    route?.targetQueueId,
    route?.destinations.targetQueue?.name,
  );
  const fallbackQueueOptions = addCurrentOption(
    queues.filter((queue) => queue.active && queue.areaId === fallbackAreaId),
    route?.fallbackQueueId,
    route?.destinations.fallbackQueue?.name,
  );
  const activeAssistants = addCurrentOption(
    assistants,
    route?.assistantId,
    route?.destinations.assistant?.name,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {route ? "Editar rota de entrada" : "Nova rota de entrada"}
          </DialogTitle>
          <DialogDescription>
            Salve um rascunho coerente com áreas, filas e Assistants deste
            workspace. O tráfego continuará bloqueado até E4.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {optionsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar os destinos</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Atualize as áreas, filas e Assistants para continuar.
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRetryOptions}
                  disabled={optionsLoading}
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Canal"
              value={form.watch("channelId")}
              placeholder={optionsLoading ? "Carregando canais..." : "Selecione um canal"}
              disabled={Boolean(route) || isPending || optionsLoading}
              error={form.formState.errors.channelId?.message}
              onValueChange={(value) => form.setValue("channelId", value, { shouldValidate: true })}
              options={channelOptions.map((channel) => ({
                id: channel.id,
                label: `${channel.name}${channel.active ? "" : " · desativado"}`,
              }))}
            />
            <SelectField
              label="Modo de entrada"
              value={entryMode}
              placeholder="Selecione o modo"
              disabled={isPending}
              error={form.formState.errors.entryMode?.message}
              onValueChange={(value) => {
                const mode = value as OperationalChannelEntryMode;
                form.setValue("entryMode", mode, { shouldValidate: true });
                if (mode !== "ASSISTANT") {
                  form.setValue("assistantId", null);
                  form.setValue("fallbackAreaId", null);
                  form.setValue("fallbackQueueId", null);
                }
                if (mode !== "QUEUE") {
                  form.setValue("targetAreaId", null);
                  form.setValue("targetQueueId", null);
                }
              }}
              options={Object.entries(OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS).map(
                ([id, label]) => ({ id, label }),
              )}
            />
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            {entryMode === "TRIAGE"
              ? "A entrada será entregue para triagem. Não há um destino fixo nesta configuração."
              : entryMode === "QUEUE"
                ? "Cada entrada será encaminhada para a área e a fila selecionadas."
                : "O Assistant fica registrado como destino, mas sua execução operacional só será habilitada em E6."}
          </div>

          {entryMode === "QUEUE" ? (
            <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
              <SelectField
                label="Área de entrada"
                value={targetAreaId}
                placeholder={optionsLoading ? "Carregando áreas..." : "Selecione uma área"}
                disabled={isPending || optionsLoading}
                error={form.formState.errors.targetAreaId?.message}
                onValueChange={(value) => {
                  form.setValue("targetAreaId", value, { shouldValidate: true });
                  form.setValue("targetQueueId", null, { shouldValidate: true });
                }}
                options={areaOptions.map((area) => ({ id: area.id, label: area.name }))}
              />
              <SelectField
                label="Fila de entrada"
                value={form.watch("targetQueueId")}
                placeholder={targetAreaId ? "Selecione uma fila" : "Escolha a área primeiro"}
                disabled={isPending || optionsLoading || !targetAreaId}
                error={form.formState.errors.targetQueueId?.message}
                onValueChange={(value) => form.setValue("targetQueueId", value, { shouldValidate: true })}
                options={targetQueueOptions.map((queue) => ({ id: queue.id, label: queue.name }))}
              />
            </div>
          ) : null}

          {entryMode === "ASSISTANT" ? (
            <div className="space-y-4 rounded-md border p-4">
              <SelectField
                label="Assistant de entrada"
                value={form.watch("assistantId")}
                placeholder={optionsLoading ? "Carregando Assistants..." : "Selecione um Assistant"}
                disabled={isPending || optionsLoading}
                error={form.formState.errors.assistantId?.message}
                onValueChange={(value) => form.setValue("assistantId", value, { shouldValidate: true })}
                options={activeAssistants.map((assistant) => ({
                  id: assistant.id,
                  label: assistant.name,
                }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Área de fallback"
                  value={fallbackAreaId}
                  placeholder={optionsLoading ? "Carregando áreas..." : "Selecione uma área"}
                  disabled={isPending || optionsLoading}
                  error={form.formState.errors.fallbackAreaId?.message}
                  onValueChange={(value) => {
                    form.setValue("fallbackAreaId", value, { shouldValidate: true });
                    form.setValue("fallbackQueueId", null, { shouldValidate: true });
                  }}
                  options={fallbackAreaOptions.map((area) => ({ id: area.id, label: area.name }))}
                />
                <SelectField
                  label="Fila de fallback"
                  value={form.watch("fallbackQueueId")}
                  placeholder={fallbackAreaId ? "Selecione uma fila" : "Escolha a área primeiro"}
                  disabled={isPending || optionsLoading || !fallbackAreaId}
                  error={form.formState.errors.fallbackQueueId?.message}
                  onValueChange={(value) => form.setValue("fallbackQueueId", value, { shouldValidate: true })}
                  options={fallbackQueueOptions.map((queue) => ({ id: queue.id, label: queue.name }))}
                />
              </div>
            </div>
          ) : null}

          {route ? (
            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="operational-route-active">Rota ativa</Label>
                    <p className="text-xs text-muted-foreground">
                      Desativar preserva o histórico e deixa o canal sem uma rota configurada.
                    </p>
                  </div>
                  <Switch
                    id="operational-route-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </div>
              )}
            />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || optionsLoading}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : route ? (
                "Salvar alterações"
              ) : (
                "Criar rota"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultValues(
  route: OperationalChannelRoute | null,
  defaultChannelId: string,
): OperationalRouteFormValues {
  return {
    channelId: route?.channelId ?? defaultChannelId,
    entryMode: route?.entryMode ?? "TRIAGE",
    assistantId: route?.assistantId ?? null,
    targetAreaId: route?.targetAreaId ?? null,
    targetQueueId: route?.targetQueueId ?? null,
    fallbackAreaId: route?.fallbackAreaId ?? null,
    fallbackQueueId: route?.fallbackQueueId ?? null,
    active: route?.active ?? true,
  };
}

type SelectOption = {
  id: string;
  name: string;
  active?: boolean;
};

function addCurrentOption<T extends SelectOption>(
  options: T[],
  currentId: string | null | undefined,
  currentName: string | undefined,
): T[] {
  if (!currentId || options.some((option) => option.id === currentId)) {
    return options;
  }

  return [
    ...options,
    {
      id: currentId,
      name: currentName || "Destino atual (indisponível)",
    } as T,
  ];
}

function SelectField({
  label,
  value,
  placeholder,
  disabled,
  error,
  onValueChange,
  options,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  disabled: boolean;
  error?: string;
  onValueChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  const fieldId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={fieldId} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length ? (
            options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__empty__" disabled>
              Nenhuma opção disponível
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
