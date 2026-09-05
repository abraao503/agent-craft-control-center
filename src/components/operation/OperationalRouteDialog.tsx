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
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
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
    entryMode: z.enum(["TRIAGE", "QUEUE", "ASSISTANT", "EXTERNAL_AGENT"]),
    triageAgentId: z.string().uuid("Selecione um agente de triagem").nullable(),
    assistantId: z.string().uuid("Selecione um Assistente").nullable(),
    targetAreaId: z.string().uuid("Selecione uma área").nullable(),
    targetQueueId: z.string().uuid("Selecione uma fila").nullable(),
    fallbackAreaId: z.string().uuid("Selecione uma área alternativa").nullable(),
    fallbackQueueId: z.string().uuid("Selecione uma fila alternativa").nullable(),
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
          message: "Selecione o Assistente de entrada",
        });
      }
      if (!values.fallbackAreaId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackAreaId"],
          message: "Selecione a área alternativa",
        });
      }
      if (!values.fallbackQueueId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackQueueId"],
          message: "Selecione a fila alternativa",
        });
      }
    }

    if (values.entryMode === "EXTERNAL_AGENT" && !values.triageAgentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["triageAgentId"],
        message: "Selecione o agente de triagem",
      });
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
  triageAgents: OperationalTriageAgent[];
  allowExternalAgent: boolean;
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
  triageAgents,
  allowExternalAgent,
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
  const activeTriageAgents = addCurrentOption(
    triageAgents.filter((agent) => agent.enabled),
    route?.triageAgentId,
    route?.destinations.triageAgent?.name,
  );
  const entryModeOptions = Object.entries(OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS).filter(
    ([id]) =>
      id !== "EXTERNAL_AGENT" ||
      allowExternalAgent ||
      route?.entryMode === "EXTERNAL_AGENT",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {route ? "Editar rota de entrada" : "Nova rota de entrada"}
          </DialogTitle>
          <DialogDescription>
            Salve uma rota coerente com os destinos deste ambiente. O agente
            externo só será usado quando a configuração e o recebimento de mensagens estiverem
            disponíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {optionsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar os destinos</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Atualize as áreas, filas, Assistentes e agentes antes de salvar a rota.
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
              disabled={Boolean(route) || isPending || optionsLoading || optionsError}
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
              disabled={isPending || optionsError}
              error={form.formState.errors.entryMode?.message}
              onValueChange={(value) => {
                const mode = value as OperationalChannelEntryMode;
                form.setValue("entryMode", mode, { shouldValidate: true });
                if (mode !== "ASSISTANT") {
                  form.setValue("assistantId", null);
                  form.setValue("fallbackAreaId", null);
                  form.setValue("fallbackQueueId", null);
                }
                if (mode !== "EXTERNAL_AGENT") {
                  form.setValue("triageAgentId", null);
                }
                if (mode !== "QUEUE") {
                  form.setValue("targetAreaId", null);
                  form.setValue("targetQueueId", null);
                }
              }}
              options={entryModeOptions.map(
                ([id, label]) => ({ id, label }),
              )}
            />
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            {entryMode === "TRIAGE"
              ? "A entrada será entregue para triagem. Não há um destino fixo nesta configuração."
              : entryMode === "QUEUE"
                ? "Cada entrada será encaminhada para a área e a fila selecionadas."
                : entryMode === "ASSISTANT"
                  ? "O Assistente fica registrado como destino e usa as áreas alternativas configuradas."
                  : "A mensagem será agrupada no atendimento e enviada ao agente externo configurado."}
          </div>

          {entryMode === "EXTERNAL_AGENT" ? (
            <div className="space-y-3 rounded-md border p-4">
              <SelectField
                label="Agente de triagem"
                value={form.watch("triageAgentId")}
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : optionsLoading
                    ? "Carregando agentes..."
                    : "Selecione um agente de triagem"
                }
                disabled={
                  isPending || optionsLoading || optionsError || !allowExternalAgent
                }
                unavailable={optionsError}
                error={form.formState.errors.triageAgentId?.message}
                onValueChange={(value) =>
                  form.setValue("triageAgentId", value, {
                    shouldValidate: true,
                  })
                }
                options={activeTriageAgents.map((agent) => ({
                  id: agent.id,
                  label: `${agent.name}${agent.enabled ? "" : " · desativado"}`,
                }))}
              />
              {!allowExternalAgent ? (
                <p className="text-xs text-muted-foreground">
                  Você precisa da permissão de setup para escolher agentes
                  externos.
                </p>
              ) : null}
            </div>
          ) : null}

          {entryMode === "QUEUE" ? (
            <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
              <SelectField
                label="Área de entrada"
                value={targetAreaId}
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : optionsLoading
                      ? "Carregando áreas..."
                      : "Selecione uma área"
                }
                disabled={isPending || optionsLoading || optionsError}
                unavailable={optionsError}
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
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : targetAreaId
                      ? "Selecione uma fila"
                      : "Escolha a área primeiro"
                }
                disabled={isPending || optionsLoading || optionsError || !targetAreaId}
                unavailable={optionsError}
                error={form.formState.errors.targetQueueId?.message}
                onValueChange={(value) => form.setValue("targetQueueId", value, { shouldValidate: true })}
                options={targetQueueOptions.map((queue) => ({ id: queue.id, label: queue.name }))}
              />
            </div>
          ) : null}

          {entryMode === "ASSISTANT" ? (
            <div className="space-y-4 rounded-md border p-4">
              <SelectField
                label="Assistente de entrada"
                value={form.watch("assistantId")}
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : optionsLoading
                      ? "Carregando Assistentes..."
                      : "Selecione um Assistente"
                }
                disabled={isPending || optionsLoading || optionsError}
                unavailable={optionsError}
                error={form.formState.errors.assistantId?.message}
                onValueChange={(value) => form.setValue("assistantId", value, { shouldValidate: true })}
                options={activeAssistants.map((assistant) => ({
                  id: assistant.id,
                  label: assistant.name,
                }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Área alternativa"
                  value={fallbackAreaId}
                  placeholder={
                    optionsError
                      ? "Opções indisponíveis"
                      : optionsLoading
                        ? "Carregando áreas..."
                        : "Selecione uma área"
                  }
                  disabled={isPending || optionsLoading || optionsError}
                  unavailable={optionsError}
                  error={form.formState.errors.fallbackAreaId?.message}
                  onValueChange={(value) => {
                    form.setValue("fallbackAreaId", value, { shouldValidate: true });
                    form.setValue("fallbackQueueId", null, { shouldValidate: true });
                  }}
                  options={fallbackAreaOptions.map((area) => ({ id: area.id, label: area.name }))}
                />
                <SelectField
                  label="Fila alternativa"
                  value={form.watch("fallbackQueueId")}
                  placeholder={
                    optionsError
                      ? "Opções indisponíveis"
                      : fallbackAreaId
                        ? "Selecione uma fila"
                        : "Escolha a área primeiro"
                  }
                  disabled={isPending || optionsLoading || optionsError || !fallbackAreaId}
                  unavailable={optionsError}
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
            <Button
              type="submit"
              disabled={isPending || optionsLoading || optionsError}
            >
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
    triageAgentId: route?.triageAgentId ?? null,
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
  unavailable = false,
  error,
  onValueChange,
  options,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  disabled: boolean;
  unavailable?: boolean;
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
              {unavailable ? "Opções indisponíveis" : "Nenhuma opção disponível"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
