import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { useOperationalAssistant } from "@/hooks/useOperationalAssistants";
import { OperationalAssistantSummary } from "@/types/operation-assistant";
import { IaModel } from "@/types/iaModel";
import { Content } from "@/types/content";
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
import { Checkbox } from "@/components/ui/checkbox";

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
    .min(3, "Informe a função do Assistant."),
  style: z.string().trim().min(3, "Informe o estilo de comunicação."),
  instructions: z
    .string()
    .trim()
    .min(3, "Informe as instruções do Assistant."),
  blacklist: z.string().max(20_000, "A lista de bloqueio é muito longa."),
  links: z.array(
    z.object({
      name: z.string().trim().min(3, "Informe o nome do link."),
      url: z.string().trim().url("Informe uma URL válida."),
    }),
  ),
  contentIds: z.array(z.string().uuid()),
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
};

type OperationalAssistantDialogProps = {
  open: boolean;
  workspaceId: string;
  assistant: OperationalAssistantSummary | null;
  models: IaModel[];
  contents: Content[];
  optionsLoading: boolean;
  optionsError: unknown;
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
  contents,
  optionsLoading,
  optionsError,
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
  const linksField = useFieldArray({
    control: form.control,
    name: "links",
  });
  const audioTranscriptionEnabled = form.watch("audioTranscriptionEnabled");
  const selectedContentIds = form.watch("contentIds");

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
    if (!assistant && !values.providerCredential.trim()) {
      form.setError("providerCredential", {
        type: "manual",
        message: "Informe a credencial do provider para criar o Assistant.",
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
  const availableContents = mergeCurrentContents(
    contents,
    detailsQuery.data?.contents ?? [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>
            {assistant ? "Editar Assistant operacional" : "Novo Assistant operacional"}
          </DialogTitle>
          <DialogDescription>
            A configuração pertence somente ao workspace operacional selecionado.
            Credenciais são gravadas no servidor e nunca retornam para a tela.
          </DialogDescription>
        </DialogHeader>

        {isDetailsLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando configuração do Assistant...
            </span>
          </div>
        ) : isDetailsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar o Assistant</AlertTitle>
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
            {optionsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Opções de configuração indisponíveis</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  Modelos e conteúdos não puderam ser carregados.
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
                description="Defina como o Assistant será apresentado e qual modelo usará."
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
                    placeholder="Clara operacional"
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
                        disabled={optionsLoading}
                      >
                        <SelectTrigger id="operational-assistant-model">
                          <SelectValue
                            placeholder={
                              optionsLoading
                                ? "Carregando modelos..."
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
                description="Os campos são write-only. Deixe vazio ao editar para manter a credencial existente."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Credencial do provider"
                  htmlFor="operational-assistant-provider-credential"
                  error={form.formState.errors.providerCredential?.message}
                >
                  <Input
                    id="operational-assistant-provider-credential"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      assistant && detailsQuery.data?.providerCredentialConfigured
                        ? "Credencial configurada"
                        : "Informe a credencial"
                    }
                    {...form.register("providerCredential")}
                  />
                  {assistant && detailsQuery.data?.providerCredentialConfigured ? (
                    <p className="text-xs text-muted-foreground">
                      Uma credencial já está configurada e não é exibida.
                    </p>
                  ) : null}
                </Field>
                <Field
                  label="Credencial de transcrição"
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
                      assistant &&
                      detailsQuery.data?.openAiTranscriptionCredentialConfigured
                        ? "Credencial configurada"
                        : "Opcional até ativar o áudio"
                    }
                    {...form.register("openAiTranscriptionCredential")}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Runtime operacional"
                description="Esses parâmetros controlam contexto, áudio e o perfil de resposta da Clara."
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
                title="Prompt e contexto"
                description="Mantenha as instruções operacionais e referências usadas pelo Assistant."
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
                label="Lista de bloqueio"
                htmlFor="operational-assistant-blacklist"
                error={form.formState.errors.blacklist?.message}
              >
                <Textarea
                  id="operational-assistant-blacklist"
                  className="min-h-24"
                  placeholder="Tópicos ou orientações que o Assistant deve evitar."
                  {...form.register("blacklist")}
                />
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Links de referência</Label>
                    <p className="text-sm text-muted-foreground">
                      Opcional. Adicione apenas referências públicas e relevantes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => linksField.append({ name: "", url: "" })}
                    disabled={linksField.fields.length >= 100}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar link
                  </Button>
                </div>
                {linksField.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start">
                    <Field
                      label="Nome"
                      htmlFor={`operational-assistant-link-name-${index}`}
                      error={form.formState.errors.links?.[index]?.name?.message}
                    >
                      <Input
                        id={`operational-assistant-link-name-${index}`}
                        placeholder="Central de ajuda"
                        {...form.register(`links.${index}.name`)}
                      />
                    </Field>
                    <Field
                      label="URL"
                      htmlFor={`operational-assistant-link-url-${index}`}
                      error={form.formState.errors.links?.[index]?.url?.message}
                    >
                      <Input
                        id={`operational-assistant-link-url-${index}`}
                        placeholder="https://exemplo.com/ajuda"
                        {...form.register(`links.${index}.url`)}
                      />
                    </Field>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="mt-6 text-destructive"
                      onClick={() => linksField.remove(index)}
                      aria-label={`Remover link ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <SectionHeading
                title="Conteúdo de conhecimento"
                description="Selecione conteúdos já pertencentes a este workspace."
              />
              {availableContents.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableContents.map((content) => {
                    const checked = selectedContentIds.includes(content.id);
                    const inputId = `operational-assistant-content-${content.id}`;
                    return (
                      <label
                        key={content.id}
                        htmlFor={inputId}
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/30"
                      >
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={(value) => {
                            const next = value
                              ? [...selectedContentIds, content.id]
                              : selectedContentIds.filter(
                                  (id) => id !== content.id,
                                );
                            form.setValue("contentIds", next, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium">{content.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {content.type === "file" ? "Arquivo" : "Respostas"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum conteúdo disponível para este workspace.
                </div>
              )}
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
              <Button type="submit" disabled={isPending || optionsLoading}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : assistant ? (
                  "Salvar alterações"
                ) : (
                  "Criar Assistant"
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
  label: string;
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
  };
}

function mergeCurrentContents(
  contents: Content[],
  currentContents: Array<{ id: string; name: string }>,
): Content[] {
  const knownIds = new Set(contents.map((content) => content.id));
  const missingCurrentContents = currentContents
    .filter((content) => !knownIds.has(content.id))
    .map((content) => ({
      ...content,
      type: "answersQuestions" as const,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));

  return [...contents, ...missingCurrentContents];
}

const TIME_ZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (UTC−3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
  { value: "America/Manaus", label: "Manaus (UTC−4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC−5)" },
];
