import { useEffect, useId } from "react";
import {
  Controller,
  UseFormReturn,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelEntryMode,
  OperationalChannelMenuOptionAction,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { OperationalAssistantOption } from "@/types/operation-assistant";
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
import { ServiceArea, ServiceQueue } from "@/types/operation";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_MENU_ACTION_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
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
import { Textarea } from "@/components/ui/textarea";

const MENU_OPTION_ACTIONS = Object.keys(
  OPERATIONAL_CHANNEL_MENU_ACTION_LABELS,
) as OperationalChannelMenuOptionAction[];

const DEFAULT_MENU_GREETING =
  "Olá! Este é o nosso atendimento automático. Responda com o número de uma das opções.";

const DEFAULT_INVALID_MENU_MESSAGE =
  "Opção inválida. Responda com o número de uma das opções do menu.";

const MENU_ACTION_DEFAULT_RESPONSE: Record<
  OperationalChannelMenuOptionAction,
  string
> = {
  START_EXTERNAL_AGENT:
    "Iniciando seu atendimento com a integração de triagem.",
  ROUTE: "Encaminhando seu atendimento para a fila selecionada.",
  CLOSE: "Atendimento finalizado. Obrigado pelo contato!",
};

const MAX_MENU_OPTIONS = 9;

const menuOptionSchema = z.object({
  number: z.number().int().min(1).max(99),
  label: z
    .string()
    .trim()
    .min(1, "Informe o rótulo da opção")
    .max(160, "O rótulo deve ter no máximo 160 caracteres"),
  action: z.enum(["START_EXTERNAL_AGENT", "ROUTE", "CLOSE"]),
  responseText: z
    .string()
    .trim()
    .min(1, "Informe a mensagem enviada ao escolher esta opção")
    .max(2000, "A mensagem deve ter no máximo 2000 caracteres"),
  targetAreaId: z.string().uuid("Selecione uma área").nullable(),
  targetQueueId: z.string().uuid("Selecione uma fila").nullable(),
});

const routeFormSchema = z
  .object({
    channelId: z.string().uuid("Selecione um canal"),
    entryMode: z.enum(["TRIAGE", "QUEUE", "ASSISTANT", "EXTERNAL_AGENT"]),
    triageAgentId: z.string().uuid("Selecione uma integração de triagem").nullable(),
    assistantId: z.string().uuid("Selecione um agente de atendimento").nullable(),
    targetAreaId: z.string().uuid("Selecione uma área").nullable(),
    targetQueueId: z.string().uuid("Selecione uma fila").nullable(),
    fallbackAreaId: z.string().uuid("Selecione uma área alternativa").nullable(),
    fallbackQueueId: z.string().uuid("Selecione uma fila alternativa").nullable(),
    menuGreeting: z
      .string()
      .max(2000, "A saudação deve ter no máximo 2000 caracteres")
      .nullable(),
    invalidMenuMessage: z
      .string()
      .max(2000, "A mensagem deve ter no máximo 2000 caracteres")
      .nullable(),
    handoffAreaId: z.string().uuid("Selecione uma área").nullable(),
    handoffQueueId: z.string().uuid("Selecione uma fila").nullable(),
    menuOptions: z.array(menuOptionSchema),
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
          message: "Selecione o agente de atendimento de entrada",
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
        message: "Selecione a integração de triagem",
      });
    }

    if (values.entryMode === "EXTERNAL_AGENT") {
      if (!values.menuGreeting?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["menuGreeting"],
          message: "Informe a saudação do menu",
        });
      }

      if (!values.invalidMenuMessage?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["invalidMenuMessage"],
          message: "Informe a mensagem para opção inválida",
        });
      }

      if (!values.handoffAreaId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["handoffAreaId"],
          message: "Selecione a área de encaminhamento humano",
        });
      }

      if (!values.handoffQueueId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["handoffQueueId"],
          message: "Selecione a fila de encaminhamento humano",
        });
      }

      if (!values.menuOptions.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["menuOptions"],
          message: "Adicione pelo menos uma opção ao menu",
        });
      }

      values.menuOptions.forEach((option, index) => {
        if (option.action !== "ROUTE") {
          return;
        }

        if (!option.targetAreaId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["menuOptions", index, "targetAreaId"],
            message: "Selecione a área de destino",
          });
        }

        if (!option.targetQueueId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["menuOptions", index, "targetQueueId"],
            message: "Selecione a fila de destino",
          });
        }
      });
    }
  });

export type OperationalRouteFormValues = z.infer<typeof routeFormSchema>;

type OperationalRouteDialogProps = {
  open: boolean;
  route: OperationalChannelRoute | null;
  channel: OperationalChannel | null;
  defaultChannelId: string;
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
  channel,
  defaultChannelId,
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
  const handoffAreaId = form.watch("handoffAreaId");
  const menuGreeting = form.watch("menuGreeting");
  const menuOptions = form.watch("menuOptions");
  const { fields: optionFields, append, remove } = useFieldArray({
    control: form.control,
    name: "menuOptions",
  });

  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(route, defaultChannelId));
  }, [defaultChannelId, form, open, route]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleEntryModeChange = (mode: OperationalChannelEntryMode) => {
    form.setValue("entryMode", mode, { shouldValidate: true });
    if (mode !== "ASSISTANT") {
      form.setValue("assistantId", null);
      form.setValue("fallbackAreaId", null);
      form.setValue("fallbackQueueId", null);
    }
    if (mode !== "EXTERNAL_AGENT") {
      form.setValue("triageAgentId", null);
      form.setValue("menuGreeting", null);
      form.setValue("invalidMenuMessage", null);
      form.setValue("handoffAreaId", null);
      form.setValue("handoffQueueId", null);
      form.setValue("menuOptions", []);
    }
    if (mode === "EXTERNAL_AGENT") {
      const values = form.getValues();
      if (!values.menuGreeting) {
        form.setValue("menuGreeting", DEFAULT_MENU_GREETING);
      }
      if (!values.invalidMenuMessage) {
        form.setValue("invalidMenuMessage", DEFAULT_INVALID_MENU_MESSAGE);
      }
      if (!values.menuOptions.length) {
        append({
          number: 1,
          label: "",
          action: "START_EXTERNAL_AGENT",
          responseText: MENU_ACTION_DEFAULT_RESPONSE.START_EXTERNAL_AGENT,
          targetAreaId: null,
          targetQueueId: null,
        });
      }
    }
    if (mode !== "QUEUE") {
      form.setValue("targetAreaId", null);
      form.setValue("targetQueueId", null);
    }
  };

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
  const handoffQueueOptions = addCurrentOption(
    queues.filter((queue) => queue.active && queue.areaId === handoffAreaId),
    route?.handoffQueueId,
    route?.destinations.handoffQueue?.name,
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
            {route
              ? "Atualize o destino e o modo de entrada desta conexão."
              : "Defina como as mensagens desta conexão entrarão na operação."} A
            integração de triagem só será usada quando a configuração e o
            recebimento de mensagens estiverem disponíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" {...form.register("channelId")} />

          {optionsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar os destinos</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Atualize as áreas, filas, agentes e integrações antes de salvar a rota.
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
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Canal da rota
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {channel?.displayName || channel?.providerAlias || "Canal selecionado"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {channel
                  ? `${OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]} · esta rota será vinculada a este canal`
                  : "A rota será vinculada ao canal selecionado."}
              </p>
            </div>
            <SelectField
              label="Modo de entrada"
              value={entryMode}
              placeholder="Selecione o modo"
              disabled={isPending || optionsError}
              error={form.formState.errors.entryMode?.message}
              onValueChange={(value) => {
                const mode = value as OperationalChannelEntryMode;
                handleEntryModeChange(mode);
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
                  ? "O agente de atendimento fica registrado como destino e usa as áreas alternativas configuradas."
                  : "O chatbot apresenta um menu de entrada com as opções configuradas e usa a integração de triagem na conversa; o encaminhamento humano recebe as falhas e os destinos de fila."}
          </div>

          {entryMode === "EXTERNAL_AGENT" ? (
            <div className="space-y-4 rounded-md border p-4">
              <SelectField
                label="Integração de triagem"
                value={form.watch("triageAgentId")}
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : optionsLoading
                    ? "Carregando integrações..."
                    : "Selecione uma integração de triagem"
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
                  Você precisa da permissão de configuração para escolher uma
                  integração de triagem.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Área de encaminhamento humano"
                  value={handoffAreaId}
                  placeholder={
                    optionsError
                      ? "Opções indisponíveis"
                      : optionsLoading
                        ? "Carregando áreas..."
                        : "Selecione uma área"
                  }
                  disabled={isPending || optionsLoading || optionsError}
                  unavailable={optionsError}
                  error={form.formState.errors.handoffAreaId?.message}
                  onValueChange={(value) => {
                    form.setValue("handoffAreaId", value, {
                      shouldValidate: true,
                    });
                    form.setValue("handoffQueueId", null, {
                      shouldValidate: true,
                    });
                  }}
                  options={areaOptions.map((area) => ({ id: area.id, label: area.name }))}
                />
                <SelectField
                  label="Fila de encaminhamento humano"
                  value={form.watch("handoffQueueId")}
                  placeholder={
                    optionsError
                      ? "Opções indisponíveis"
                      : handoffAreaId
                        ? "Selecione uma fila"
                        : "Escolha a área primeiro"
                  }
                  disabled={isPending || optionsLoading || optionsError || !handoffAreaId}
                  unavailable={optionsError}
                  error={form.formState.errors.handoffQueueId?.message}
                  onValueChange={(value) =>
                    form.setValue("handoffQueueId", value, { shouldValidate: true })
                  }
                  options={handoffQueueOptions.map((queue) => ({ id: queue.id, label: queue.name }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational-route-menu-greeting">Saudação do menu</Label>
                <Textarea
                  id="operational-route-menu-greeting"
                  value={menuGreeting ?? ""}
                  onChange={(event) =>
                    form.setValue("menuGreeting", event.target.value, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="Primeira mensagem enviada ao iniciar a conversa"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.menuGreeting)}
                  maxLength={2000}
                />
                {form.formState.errors.menuGreeting ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.menuGreeting.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational-route-invalid-menu-message">
                  Mensagem para opção inválida
                </Label>
                <Textarea
                  id="operational-route-invalid-menu-message"
                  value={form.watch("invalidMenuMessage") ?? ""}
                  onChange={(event) =>
                    form.setValue("invalidMenuMessage", event.target.value, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="Enviada quando a resposta não corresponde a uma opção"
                  disabled={isPending}
                  aria-invalid={Boolean(form.formState.errors.invalidMenuMessage)}
                  maxLength={2000}
                />
                {form.formState.errors.invalidMenuMessage ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.invalidMenuMessage.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Opções do menu</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      append({
                        number: form.getValues("menuOptions").length + 1,
                        label: "",
                        action: "ROUTE",
                        responseText: MENU_ACTION_DEFAULT_RESPONSE.ROUTE,
                        targetAreaId: null,
                        targetQueueId: null,
                      })
                    }
                    disabled={isPending || menuOptions.length >= MAX_MENU_OPTIONS}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar opção
                  </Button>
                </div>
                {menuOptions.length >= MAX_MENU_OPTIONS ? (
                  <p className="text-xs text-muted-foreground">
                    O menu pode ter no máximo {MAX_MENU_OPTIONS} opções.
                  </p>
                ) : null}
                {form.formState.errors.menuOptions?.root?.message ||
                form.formState.errors.menuOptions?.message ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.menuOptions?.root?.message ??
                      form.formState.errors.menuOptions?.message}
                  </p>
                ) : null}
                <div className="space-y-3">
                  {optionFields.map((field, index) => (
                    <MenuOptionItem
                      key={field.id}
                      form={form}
                      index={index}
                      areas={areas}
                      queues={queues}
                      optionsLoading={optionsLoading}
                      optionsError={optionsError}
                      isPending={isPending}
                      canRemove={menuOptions.length > 1}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </div>
              </div>

              <MenuPreview greeting={menuGreeting} options={menuOptions} />
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
                label="Agente de atendimento de entrada"
                value={form.watch("assistantId")}
                placeholder={
                  optionsError
                    ? "Opções indisponíveis"
                    : optionsLoading
                      ? "Carregando agentes..."
                      : "Selecione um agente de atendimento"
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
    menuGreeting: route?.menuGreeting ?? null,
    invalidMenuMessage: route?.invalidMenuMessage ?? null,
    handoffAreaId: route?.handoffAreaId ?? null,
    handoffQueueId: route?.handoffQueueId ?? null,
    menuOptions: (route?.menuOptions ?? []).map((option) => ({
      number: option.number,
      label: option.label,
      action: option.action,
      responseText: option.responseText,
      targetAreaId: option.targetAreaId,
      targetQueueId: option.targetQueueId,
    })),
    active: route?.active ?? true,
  };
}

type MenuOptionItemProps = {
  form: UseFormReturn<OperationalRouteFormValues>;
  index: number;
  areas: ServiceArea[];
  queues: ServiceQueue[];
  optionsLoading: boolean;
  optionsError: boolean;
  isPending: boolean;
  canRemove: boolean;
  onRemove: () => void;
};

function MenuOptionItem({
  form,
  index,
  areas,
  queues,
  optionsLoading,
  optionsError,
  isPending,
  canRemove,
  onRemove,
}: MenuOptionItemProps) {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const responseId = `${fieldId}-response`;
  const option = form.watch(`menuOptions.${index}`);
  const optionAreaId = option.targetAreaId;
  const optionQueueOptions = queues.filter(
    (queue) => queue.active && queue.areaId === optionAreaId,
  );
  const errors = form.formState.errors.menuOptions?.[index];

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold"
          aria-label={`Opção ${index + 1}`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={labelId} className="sr-only">
            Rótulo da opção {index + 1}
          </Label>
          <Input
            id={labelId}
            value={option.label}
            onChange={(event) =>
              form.setValue(`menuOptions.${index}.label`, event.target.value, {
                shouldValidate: true,
              })
            }
            placeholder="Texto da opção apresentada no menu"
            disabled={isPending}
            aria-invalid={Boolean(errors?.label)}
            maxLength={160}
          />
          {errors?.label ? (
            <p className="text-xs text-destructive">{errors.label.message}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={!canRemove || isPending}
          aria-label={`Remover opção ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Ação da opção"
          value={option.action}
          placeholder="Selecione a ação"
          disabled={isPending}
          onValueChange={(value) => {
            const action = value as OperationalChannelMenuOptionAction;
            form.setValue(`menuOptions.${index}.action`, action, {
              shouldValidate: true,
            });
            form.setValue(
              `menuOptions.${index}.responseText`,
              MENU_ACTION_DEFAULT_RESPONSE[action],
              { shouldValidate: true },
            );
            if (action !== "ROUTE") {
              form.setValue(`menuOptions.${index}.targetAreaId`, null, {
                shouldValidate: true,
              });
              form.setValue(`menuOptions.${index}.targetQueueId`, null, {
                shouldValidate: true,
              });
            }
          }}
          options={MENU_OPTION_ACTIONS.map((action) => ({
            id: action,
            label: OPERATIONAL_CHANNEL_MENU_ACTION_LABELS[action],
          }))}
        />
        {option.action === "ROUTE" ? (
          <>
            <SelectField
              label="Área de destino"
              value={optionAreaId}
              placeholder={
                optionsError
                  ? "Opções indisponíveis"
                  : optionsLoading
                    ? "Carregando áreas..."
                    : "Selecione uma área"
              }
              disabled={isPending || optionsLoading || optionsError}
              unavailable={optionsError}
              error={errors?.targetAreaId?.message}
              onValueChange={(value) => {
                form.setValue(`menuOptions.${index}.targetAreaId`, value, {
                  shouldValidate: true,
                });
                form.setValue(`menuOptions.${index}.targetQueueId`, null, {
                  shouldValidate: true,
                });
              }}
              options={areas
                .filter((area) => area.active)
                .map((area) => ({ id: area.id, label: area.name }))}
            />
            <SelectField
              label="Fila de destino"
              value={option.targetQueueId}
              placeholder={
                optionsError
                  ? "Opções indisponíveis"
                  : optionAreaId
                    ? "Selecione uma fila"
                    : "Escolha a área primeiro"
              }
              disabled={isPending || optionsLoading || optionsError || !optionAreaId}
              unavailable={optionsError}
              error={errors?.targetQueueId?.message}
              onValueChange={(value) =>
                form.setValue(`menuOptions.${index}.targetQueueId`, value, {
                  shouldValidate: true,
                })
              }
              options={optionQueueOptions.map((queue) => ({
                id: queue.id,
                label: queue.name,
              }))}
            />
          </>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor={responseId} className="text-xs text-muted-foreground">
          Mensagem enviada ao escolher esta opção
        </Label>
        <Textarea
          id={responseId}
          value={option.responseText}
          onChange={(event) =>
            form.setValue(
              `menuOptions.${index}.responseText`,
              event.target.value,
              { shouldValidate: true },
            )
          }
          disabled={isPending}
          aria-invalid={Boolean(errors?.responseText)}
          maxLength={2000}
          rows={2}
        />
        {errors?.responseText ? (
          <p className="text-xs text-destructive">{errors.responseText.message}</p>
        ) : null}
      </div>
    </div>
  );
}

function MenuPreview({
  greeting,
  options,
}: {
  greeting: string | null;
  options: Array<{ label: string }>;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Prévia para o cliente
      </p>
      <div className="mt-2 space-y-2">
        <p className="whitespace-pre-wrap rounded-md border bg-background p-2">
          {greeting?.trim()
            ? `${greeting.trim()}\n\nResponda com o número da opção desejada.`
            : "A saudação do menu aparece aqui."}
        </p>
        <p className="whitespace-pre-wrap rounded-md border bg-background p-2">
          {options.length
            ? options
                .map((option, index) => `${index + 1}. ${option.label || "Rótulo da opção"}`)
                .join("\n")
            : "As opções do menu aparecem aqui."}
        </p>
      </div>
    </div>
  );
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
