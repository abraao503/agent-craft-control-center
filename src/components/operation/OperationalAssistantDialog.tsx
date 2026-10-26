import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Info,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { useOperationalAssistant } from "@/hooks/useOperationalAssistants";
import {
  OperationalAssistantAbilities,
  OperationalAssistantAbilityAreaOption,
  OperationalAssistantConfiguredDestination,
  OperationalAssistantSummary,
} from "@/types/operation-assistant";
import { IaModel } from "@/types/iaModel";
import { getOperationalAssistantErrorMessage } from "@/utils/operationalAssistantErrors";
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

const abilityBaseSchema = z.object({
  enabled: z.boolean(),
  instructions: z.string().max(4_000),
  confirmationMessage: z.string().max(1_000),
});

const routedAbilitySchema = abilityBaseSchema.extend({
  destination: z.object({
    areaId: z.string().uuid().nullable(),
    queueId: z.string().uuid().nullable(),
  }),
});

const abilitiesFormSchema = z
  .object({
    humanHandoff: routedAbilitySchema,
    transfer: routedAbilitySchema,
    pending: abilityBaseSchema,
    close: abilityBaseSchema,
  })
  .superRefine((abilities, context) => {
    for (const name of ["humanHandoff", "transfer"] as const) {
      const ability = abilities[name];
      if (!ability.enabled) continue;
      if (ability.instructions.trim().length < 3) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, "instructions"],
          message: "Informe instruções para a habilidade ativa.",
        });
      }
      if (!ability.confirmationMessage.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, "confirmationMessage"],
          message: "Informe a mensagem de confirmação.",
        });
      }
      if (!ability.destination.areaId || !ability.destination.queueId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, "destination"],
          message: "Selecione a área e a fila de destino.",
        });
      }
    }

    for (const name of ["pending", "close"] as const) {
      const ability = abilities[name];
      if (!ability.enabled) continue;
      if (ability.instructions.trim().length < 3) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, "instructions"],
          message: "Informe instruções para a habilidade ativa.",
        });
      }
      if (!ability.confirmationMessage.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, "confirmationMessage"],
          message: "Informe a mensagem de confirmação.",
        });
      }
    }
  });

const assistantFormSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres."),
  description: z
    .string()
    .trim()
    .min(3, "Informe uma descrição com pelo menos 3 caracteres."),
  timeZone: z.string().min(1, "Selecione o fuso horário."),
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  iaModelId: z.string().uuid("Selecione um modelo de IA."),
  providerCredential: z.string(),
  openAiTranscriptionCredential: z.string(),
  audioTranscriptionEnabled: z.boolean(),
  contextWindowTurns: z.enum(["10", "20", "40"]),
  claudeResponseProfile: z.enum(["fast", "balanced", "deep"]),
  function: z
    .string()
    .trim()
    .min(3, "Informe a função do agente."),
  style: z.string().trim().min(3, "Informe o estilo de comunicação."),
  instructions: z
    .string()
    .trim()
    .min(3, "Informe as instruções do agente."),
  blacklist: z.string().max(20_000, "A lista de bloqueio é muito longa."),
  links: z.array(
    z.object({
      name: z.string().trim().min(3, "Informe o nome do link."),
      url: z.string().trim().url("Informe uma URL válida."),
    }),
  ),
  contentIds: z.array(z.string().uuid()),
  abilities: abilitiesFormSchema,
  abilitiesVersion: z.number().int().positive().optional(),
});

export type OperationalAssistantFormValues = z.infer<
  typeof assistantFormSchema
>;

const EMPTY_FORM: OperationalAssistantFormValues = {
  name: "",
  description: "",
  timeZone: "America/Sao_Paulo",
  language: "pt-BR",
  iaModelId: "",
  providerCredential: "",
  openAiTranscriptionCredential: "",
  audioTranscriptionEnabled: false,
  contextWindowTurns: "20",
  claudeResponseProfile: "balanced",
  function: "",
  style: "",
  instructions: "",
  blacklist: "",
  links: [],
  contentIds: [],
  abilities: createEmptyAbilities(),
  abilitiesVersion: undefined,
};

type OperationalAssistantDialogProps = {
  open: boolean;
  workspaceId: string;
  assistant: OperationalAssistantSummary | null;
  models: IaModel[];
  abilityAreas: OperationalAssistantAbilityAreaOption[];
  optionsLoading: boolean;
  modelsError: unknown;
  abilityOptionsError: unknown;
  isPending: boolean;
  onRetryOptions: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalAssistantFormValues) => Promise<void>;
};

export function OperationalAssistantDialog({
  open,
  workspaceId,
  assistant,
  models,
  abilityAreas,
  optionsLoading,
  modelsError,
  abilityOptionsError,
  isPending,
  onRetryOptions,
  onOpenChange,
  onSubmit,
}: OperationalAssistantDialogProps) {
  const detailsQuery = useOperationalAssistant(
    workspaceId,
    assistant?.id,
    open && Boolean(assistant),
  );
  const form = useForm<OperationalAssistantFormValues>({
    resolver: zodResolver(assistantFormSchema),
    defaultValues: EMPTY_FORM,
  });
  const audioTranscriptionEnabled = form.watch("audioTranscriptionEnabled");

  useEffect(() => {
    if (!open) return;

    if (!assistant) {
      form.reset(EMPTY_FORM);
      return;
    }

    if (detailsQuery.data) {
      form.reset(toFormValues(detailsQuery.data));
    }
  }, [assistant, detailsQuery.data, form, open]);

  const handleValidSubmit = async (values: OperationalAssistantFormValues) => {
    if (modelsError) return;

    if (!assistant && !values.providerCredential.trim()) {
      form.setError("providerCredential", {
        type: "manual",
        message: "Informe a chave do serviço de IA para criar o agente.",
      });
      return;
    }

    if (
      values.audioTranscriptionEnabled &&
      !values.openAiTranscriptionCredential.trim() &&
      !detailsQuery.data?.openAiTranscriptionCredentialConfigured
    ) {
      form.setError("openAiTranscriptionCredential", {
        type: "manual",
        message:
          "Informe a credencial de transcrição para ativar o áudio.",
      });
      return;
    }

    await onSubmit(values);
  };

  const isDetailsLoading = Boolean(assistant) && detailsQuery.isLoading;
  const isDetailsError = Boolean(assistant) && detailsQuery.isError;
  const availableAbilityAreas = mergeCurrentAbilityAreas(
    abilityAreas,
    detailsQuery.data?.abilityDestinations,
  );
  const providerCredentialConfigured = Boolean(
    assistant && detailsQuery.data?.providerCredentialConfigured,
  );
  const transcriptionCredentialConfigured = Boolean(
    assistant && detailsQuery.data?.openAiTranscriptionCredentialConfigured,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>
            {assistant
              ? "Editar agente de atendimento"
              : "Novo agente de atendimento"}
          </DialogTitle>
          <DialogDescription>
            A configuração pertence somente ao ambiente operacional selecionado.
            Credenciais são gravadas no servidor e nunca retornam para a tela.
          </DialogDescription>
        </DialogHeader>

        {isDetailsLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando configuração do agente...
            </span>
          </div>
        ) : isDetailsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar o agente</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {getOperationalAssistantErrorMessage(
                detailsQuery.error,
                "Atualize os dados e tente novamente.",
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void detailsQuery.refetch()}
                disabled={detailsQuery.isFetching}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleValidSubmit)}
            className="space-y-6"
          >
            {modelsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível carregar os modelos</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  {getOperationalAssistantErrorMessage(
                    modelsError,
                    "Atualize para carregar os modelos de IA e continuar.",
                  )}
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
            {abilityOptionsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível carregar os destinos</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  {getOperationalAssistantErrorMessage(
                    abilityOptionsError,
                    "Atualize para carregar as áreas e filas antes de configurar habilidades.",
                  )}
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

            <section className="space-y-4">
              <SectionHeading
                title="Identidade e modelo"
                description="Defina como o agente será apresentado e qual modelo usará."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome"
                  htmlFor="operational-assistant-name"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="operational-assistant-name"
                    autoComplete="off"
                    placeholder="Agente de atendimento"
                    {...form.register("name")}
                  />
                </Field>
                <Controller
                  control={form.control}
                  name="iaModelId"
                  render={({ field }) => (
                    <Field
                      label="Modelo de IA"
                      htmlFor="operational-assistant-model"
                      error={form.formState.errors.iaModelId?.message}
                    >
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={optionsLoading || Boolean(modelsError)}
                      >
                        <SelectTrigger id="operational-assistant-model">
                          <SelectValue
                            placeholder={
                              optionsLoading
                                ? "Carregando modelos..."
                                : modelsError
                                  ? "Modelos indisponíveis"
                                  : "Selecione um modelo"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {models.length ? (
                            models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : modelsError ? (
                            <SelectItem value="__error__" disabled>
                              Não foi possível carregar os modelos
                            </SelectItem>
                          ) : (
                            <SelectItem value="__empty__" disabled>
                              Nenhum modelo disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
              <Field
                label="Descrição"
                htmlFor="operational-assistant-description"
                error={form.formState.errors.description?.message}
              >
                <Textarea
                  id="operational-assistant-description"
                  placeholder="Atende e direciona clientes no fluxo operacional."
                  className="min-h-24"
                  {...form.register("description")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="timeZone"
                  render={({ field }) => (
                    <Field
                      label="Fuso horário"
                      htmlFor="operational-assistant-timezone"
                      error={form.formState.errors.timeZone?.message}
                    >
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="operational-assistant-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_ZONES.map((zone) => (
                            <SelectItem key={zone.value} value={zone.value}>
                              {zone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <Field
                      label="Idioma"
                      htmlFor="operational-assistant-language"
                      error={form.formState.errors.language?.message}
                    >
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="operational-assistant-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português</SelectItem>
                          <SelectItem value="en-US">Inglês</SelectItem>
                          <SelectItem value="es-ES">Espanhol</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Credenciais"
                description="Suas chaves não são exibidas. Deixe os campos vazios para manter as atuais."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      Chave do serviço de IA
                      {providerCredentialConfigured && <CredentialConfiguredLabel />}
                    </span>
                  }
                  htmlFor="operational-assistant-provider-credential"
                  error={form.formState.errors.providerCredential?.message}
                >
                  <Input
                    id="operational-assistant-provider-credential"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      providerCredentialConfigured
                        ? "Nova chave (opcional)"
                        : "Informe a credencial"
                    }
                    {...form.register("providerCredential")}
                  />
                </Field>
                <Field
                  label={
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      Chave de transcrição
                      {transcriptionCredentialConfigured && <CredentialConfiguredLabel />}
                    </span>
                  }
                  htmlFor="operational-assistant-transcription-credential"
                  error={
                    form.formState.errors.openAiTranscriptionCredential?.message
                  }
                >
                  <Input
                    id="operational-assistant-transcription-credential"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      transcriptionCredentialConfigured
                        ? "Nova chave (opcional)"
                        : "Opcional até ativar o áudio"
                    }
                    {...form.register("openAiTranscriptionCredential")}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Comportamento e resposta"
                description="Defina contexto, áudio e o perfil de resposta do agente."
              />
              <Controller
                control={form.control}
                name="audioTranscriptionEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                      <Label htmlFor="operational-assistant-audio">
                        Transcrição de áudio
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Requer uma credencial OpenAI de transcrição configurada.
                      </p>
                    </div>
                    <Switch
                      id="operational-assistant-audio"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      aria-label="Ativar transcrição de áudio"
                    />
                  </div>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="contextWindowTurns"
                  render={({ field }) => (
                    <Field label="Janela de contexto" htmlFor="operational-assistant-context">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="operational-assistant-context">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 turnos</SelectItem>
                          <SelectItem value="20">20 turnos</SelectItem>
                          <SelectItem value="40">40 turnos</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="claudeResponseProfile"
                  render={({ field }) => (
                    <Field label="Perfil de resposta" htmlFor="operational-assistant-profile">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="operational-assistant-profile">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">Rápido</SelectItem>
                          <SelectItem value="balanced">Balanceado</SelectItem>
                          <SelectItem value="deep">Profundo</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
              {audioTranscriptionEnabled ? (
                <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    A API valida novamente a credencial antes de ativar a
                    transcrição. O segredo nunca é retornado no detalhe.
                  </span>
                </div>
              ) : null}
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Habilidades do agente"
                description="Habilite apenas as ações que o agente pode executar. A API valida novamente permissões, destinos e a versão da configuração."
              />
              <div className="grid gap-4">
                <AbilityEditor
                  form={form}
                  name="humanHandoff"
                  title="Chamar uma pessoa"
                  description="Suspende a IA e encaminha o atendimento para a fila humana configurada."
                  routed
                  areas={availableAbilityAreas}
                  abilityOptionsError={abilityOptionsError}
                  optionsLoading={optionsLoading}
                  disabled={isPending}
                  configuredDestination={detailsQuery.data?.abilityDestinations.humanHandoff}
                />
                <AbilityEditor
                  form={form}
                  name="transfer"
                  title="Transferir para outra área ou fila"
                  description="Mantém o agente e a sessão ativos, alterando apenas o destino operacional."
                  routed
                  areas={availableAbilityAreas}
                  abilityOptionsError={abilityOptionsError}
                  optionsLoading={optionsLoading}
                  disabled={isPending}
                  configuredDestination={detailsQuery.data?.abilityDestinations.transfer}
                />
                <AbilityEditor
                  form={form}
                  name="pending"
                  title="Colocar em pendência"
                  description="Marca o atendimento como pendente até uma nova mensagem do cliente."
                  areas={availableAbilityAreas}
                  abilityOptionsError={abilityOptionsError}
                  optionsLoading={optionsLoading}
                  disabled={isPending}
                />
                <AbilityEditor
                  form={form}
                  name="close"
                  title="Encerrar atendimento"
                  description="Encerra a sessão quando o agente concluir o atendimento."
                  areas={availableAbilityAreas}
                  abilityOptionsError={abilityOptionsError}
                  optionsLoading={optionsLoading}
                  disabled={isPending}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Instruções e contexto"
                description="Mantenha as instruções operacionais e referências usadas pelo agente."
              />
              <Field
                label="Função"
                htmlFor="operational-assistant-function"
                error={form.formState.errors.function?.message}
              >
                <Textarea
                  id="operational-assistant-function"
                  className="min-h-24"
                  placeholder="Realizar a triagem inicial do atendimento."
                  {...form.register("function")}
                />
              </Field>
              <Field
                label="Estilo"
                htmlFor="operational-assistant-style"
                error={form.formState.errors.style?.message}
              >
                <Textarea
                  id="operational-assistant-style"
                  className="min-h-24"
                  placeholder="Objetivo, cordial e direto."
                  {...form.register("style")}
                />
              </Field>
              <Field
                label="Instruções"
                htmlFor="operational-assistant-instructions"
                error={form.formState.errors.instructions?.message}
              >
                <Textarea
                  id="operational-assistant-instructions"
                  className="min-h-32"
                  placeholder="Use somente as informações disponíveis no contexto."
                  {...form.register("instructions")}
                />
              </Field>
              <Field
                label="Assuntos a evitar"
                htmlFor="operational-assistant-blacklist"
                error={form.formState.errors.blacklist?.message}
              >
                <Textarea
                  id="operational-assistant-blacklist"
                  className="min-h-24"
                  placeholder="Tópicos ou orientações que o agente deve evitar."
                  {...form.register("blacklist")}
                />
              </Field>
            </section>

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
                disabled={
                  isPending ||
                  optionsLoading ||
                  Boolean(modelsError) ||
                  Boolean(abilityOptionsError)
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : assistant ? (
                  "Salvar alterações"
                ) : (
                    "Criar agente de atendimento"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CredentialConfiguredLabel() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-normal text-muted-foreground">
      <span className="mr-1" aria-hidden="true">·</span>
      <LockKeyhole className="h-3 w-3" aria-hidden="true" />
      Configurada
    </span>
  );
}

type AbilityName = keyof OperationalAssistantAbilities;
type RoutedAbilityName = "humanHandoff" | "transfer";
type AbilityEnabledPath = `abilities.${AbilityName}.enabled`;
type AbilityInstructionsPath = `abilities.${AbilityName}.instructions`;
type AbilityConfirmationPath = `abilities.${AbilityName}.confirmationMessage`;
type RoutedAbilityAreaPath = `abilities.${RoutedAbilityName}.destination.areaId`;
type RoutedAbilityQueuePath = `abilities.${RoutedAbilityName}.destination.queueId`;
type RoutedAbilityDestinationPath =
  `abilities.${RoutedAbilityName}.destination`;

function AbilityEditor({
  form,
  name,
  title,
  description,
  routed = false,
  areas,
  abilityOptionsError,
  optionsLoading,
  disabled,
  configuredDestination,
}: {
  form: UseFormReturn<OperationalAssistantFormValues>;
  name: AbilityName;
  title: string;
  description: string;
  routed?: boolean;
  areas: OperationalAssistantAbilityAreaOption[];
  abilityOptionsError: unknown;
  optionsLoading: boolean;
  disabled: boolean;
  configuredDestination?: OperationalAssistantConfiguredDestination | null;
}) {
  const enabled = form.watch(
    `abilities.${name}.enabled` as AbilityEnabledPath,
  );
  const areaId = routed
    ? form.watch(
        `abilities.${name as RoutedAbilityName}.destination.areaId` as RoutedAbilityAreaPath,
      )
    : null;
  const queueId = routed
    ? form.watch(
        `abilities.${name as RoutedAbilityName}.destination.queueId` as RoutedAbilityQueuePath,
      )
    : null;
  const errors = form.formState.errors.abilities?.[name];
  const destinationError = getFormErrorMessage(
    (
      errors as
        | { destination?: { message?: unknown } }
        | undefined
    )?.destination?.message,
  );
  const selectedArea = areas.find((area) => area.id === areaId);
  const destinationUnavailable = Boolean(
    routed &&
      enabled &&
      configuredDestination &&
      (!configuredDestination.areaActive || !configuredDestination.queueActive),
  );

  const setEnabled = (value: boolean) => {
    form.setValue(`abilities.${name}.enabled` as AbilityEnabledPath, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!value && routed) {
      form.setValue(
        `abilities.${name as RoutedAbilityName}.destination` as RoutedAbilityDestinationPath,
        { areaId: null, queueId: null },
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor={`operational-assistant-ability-${name}`}>
            {title}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={`operational-assistant-ability-${name}`}
          checked={Boolean(enabled)}
          onCheckedChange={(value) => setEnabled(value === true)}
          disabled={disabled}
          aria-label={`${enabled ? "Desativar" : "Ativar"} habilidade: ${title}`}
        />
      </div>

      {enabled ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Orientação para o agente"
              htmlFor={`operational-assistant-ability-${name}-instructions`}
              error={getFormErrorMessage(errors?.instructions)}
            >
              <Textarea
                id={`operational-assistant-ability-${name}-instructions`}
                className="min-h-24"
                placeholder="Explique quando e como usar esta habilidade."
                disabled={disabled}
                {...form.register(
                  `abilities.${name}.instructions` as AbilityInstructionsPath,
                )}
              />
            </Field>
            <Field
              label="Mensagem de confirmação"
              htmlFor={`operational-assistant-ability-${name}-confirmation`}
              error={getFormErrorMessage(errors?.confirmationMessage)}
            >
              <Textarea
                id={`operational-assistant-ability-${name}-confirmation`}
                className="min-h-24"
                placeholder="Mensagem enviada após a ação ser confirmada."
                disabled={disabled}
                {...form.register(
                  `abilities.${name}.confirmationMessage` as AbilityConfirmationPath,
                )}
              />
            </Field>
          </div>

          {routed ? (
            <div className="space-y-3">
              {destinationUnavailable ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Destino configurado indisponível</AlertTitle>
                  <AlertDescription>
                    Escolha uma área e uma fila ativas para salvar esta habilidade.
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Área de destino"
                  htmlFor={`operational-assistant-ability-${name}-area`}
                  error={destinationError}
                >
                  <Select
                    value={areaId ?? undefined}
                    onValueChange={(value) => {
                      form.setValue(
                        `abilities.${name as RoutedAbilityName}.destination.areaId` as RoutedAbilityAreaPath,
                        value,
                        { shouldDirty: true, shouldValidate: true },
                      );
                      form.setValue(
                        `abilities.${name as RoutedAbilityName}.destination.queueId` as RoutedAbilityQueuePath,
                        null,
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }}
                    disabled={
                      disabled || optionsLoading || Boolean(abilityOptionsError)
                    }
                  >
                    <SelectTrigger
                      id={`operational-assistant-ability-${name}-area`}
                    >
                      <SelectValue
                        placeholder={
                          optionsLoading
                            ? "Carregando áreas..."
                            : abilityOptionsError
                              ? "Áreas indisponíveis"
                              : "Selecione uma área"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.length ? (
                        areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty__" disabled>
                          Nenhuma área ativa disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Fila de destino"
                  htmlFor={`operational-assistant-ability-${name}-queue`}
                  error={destinationError}
                >
                  <Select
                    value={queueId ?? undefined}
                    onValueChange={(value) =>
                      form.setValue(
                        `abilities.${name as RoutedAbilityName}.destination.queueId` as RoutedAbilityQueuePath,
                        value,
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                    disabled={
                      disabled ||
                      optionsLoading ||
                      Boolean(abilityOptionsError) ||
                      !areaId
                    }
                  >
                    <SelectTrigger
                      id={`operational-assistant-ability-${name}-queue`}
                    >
                      <SelectValue
                        placeholder={
                          optionsLoading
                            ? "Carregando filas..."
                            : abilityOptionsError
                              ? "Filas indisponíveis"
                              : areaId
                                ? "Selecione uma fila"
                                : "Escolha a área primeiro"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedArea?.queues.length ? (
                        selectedArea.queues.map((queue) => (
                          <SelectItem key={queue.id} value={queue.id}>
                            {queue.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty__" disabled>
                          Nenhuma fila ativa disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function getFormErrorMessage(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return undefined;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function toFormValues(
  assistant: NonNullable<ReturnType<typeof useOperationalAssistant>["data"]>,
): OperationalAssistantFormValues {
  return {
    name: assistant.name,
    description: assistant.description,
    timeZone: assistant.timeZone,
    language: assistant.language,
    iaModelId: assistant.iaModel.id,
    providerCredential: "",
    openAiTranscriptionCredential: "",
    audioTranscriptionEnabled: assistant.audioTranscriptionEnabled,
    contextWindowTurns: String(assistant.contextWindowTurns) as "10" | "20" | "40",
    claudeResponseProfile: assistant.claudeResponseProfile,
    function: assistant.prompt.function,
    style: assistant.prompt.style,
    instructions: assistant.prompt.instructions,
    blacklist: assistant.prompt.blacklist ?? "",
    links: assistant.prompt.links ?? [],
    contentIds: assistant.contents.map((content) => content.id),
    abilities: assistant.abilities,
    abilitiesVersion: assistant.abilitiesVersion,
  };
}

function createEmptyAbilities(): OperationalAssistantAbilities {
  return {
    humanHandoff: {
      enabled: false,
      instructions: "",
      confirmationMessage: "",
      destination: { areaId: null, queueId: null },
    },
    transfer: {
      enabled: false,
      instructions: "",
      confirmationMessage: "",
      destination: { areaId: null, queueId: null },
    },
    pending: {
      enabled: false,
      instructions: "",
      confirmationMessage: "",
    },
    close: {
      enabled: false,
      instructions: "",
      confirmationMessage: "",
    },
  };
}

function mergeCurrentAbilityAreas(
  areas: OperationalAssistantAbilityAreaOption[],
  destinations:
    | {
        humanHandoff: OperationalAssistantConfiguredDestination | null;
        transfer: OperationalAssistantConfiguredDestination | null;
      }
    | undefined,
): OperationalAssistantAbilityAreaOption[] {
  const merged = areas.map((area) => ({
    ...area,
    queues: [...area.queues],
  }));

  for (const destination of [
    destinations?.humanHandoff,
    destinations?.transfer,
  ]) {
    if (!destination?.areaId) continue;

    let area = merged.find((candidate) => candidate.id === destination.areaId);
    if (!area) {
      area = {
        id: destination.areaId,
        name: destination.areaName ?? "Área configurada indisponível",
        queues: [],
      };
      merged.push(area);
    }

    if (
      destination.queueId &&
      !area.queues.some((queue) => queue.id === destination.queueId)
    ) {
      area.queues.push({
        id: destination.queueId,
        name: destination.queueName ?? "Fila configurada indisponível",
      });
    }
  }

  return merged;
}

const TIME_ZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (UTC−3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
  { value: "America/Manaus", label: "Manaus (UTC−4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC−5)" },
];
