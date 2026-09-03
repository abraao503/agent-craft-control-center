import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw, Save } from "lucide-react";
import { useOperationalClaraConfiguration, useOperationalClaraMutation } from "@/hooks/useOperationalClara";
import { getOperationalAssistantErrorMessage, isOperationalAssistantStaleVersion } from "@/utils/operationalAssistantErrors";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const claraFormSchema = z
  .object({
    enabled: z.boolean(),
    baseUrl: z.string(),
    credential: z.string(),
    clearCredential: z.boolean(),
    timeoutMs: z.coerce.number().int().min(100).max(30_000),
    maxAttempts: z.coerce.number().int().min(1).max(3),
  })
  .superRefine((values, context) => {
    if (values.enabled && !values.baseUrl.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseUrl"],
        message: "Informe a URL base para ativar a Clara.",
      });
    }

    if (values.credential.trim() && values.clearCredential) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["credential"],
        message: "Escolha entre informar uma nova credencial ou removê-la.",
      });
    }
  });

type ClaraFormValues = z.infer<typeof claraFormSchema>;

const DEFAULT_VALUES: ClaraFormValues = {
  enabled: false,
  baseUrl: "",
  credential: "",
  clearCredential: false,
  timeoutMs: 8_000,
  maxAttempts: 2,
};

export function OperationalClaraCard({ workspaceId }: { workspaceId: string }) {
  const { toast } = useToast();
  const configurationQuery = useOperationalClaraConfiguration(workspaceId);
  const updateMutation = useOperationalClaraMutation(workspaceId);
  const form = useForm<ClaraFormValues>({
    resolver: zodResolver(claraFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const enabled = form.watch("enabled");
  const hasCredential = configurationQuery.data?.credentialConfigured ?? false;

  useEffect(() => {
    if (!configurationQuery.data) return;

    form.reset({
      enabled: configurationQuery.data.enabled,
      baseUrl: configurationQuery.data.baseUrl ?? "",
      credential: "",
      clearCredential: false,
      timeoutMs: configurationQuery.data.timeoutMs,
      maxAttempts: configurationQuery.data.maxAttempts,
    });
  }, [configurationQuery.data, form]);

  const handleSubmit = async (values: ClaraFormValues) => {
    const configuration = configurationQuery.data;
    if (!configuration) return;

    try {
      await updateMutation.mutateAsync({
        enabled: values.enabled,
        baseUrl: values.baseUrl.trim() || null,
        ...(values.credential.trim()
          ? { credential: values.credential.trim() }
          : {}),
        ...(values.clearCredential ? { clearCredential: true } : {}),
        timeoutMs: values.timeoutMs,
        maxAttempts: values.maxAttempts,
        expectedVersion: configuration.version,
      });
      toast({
        title: "Configuração da Clara atualizada",
        description: "Os parâmetros foram salvos com segurança no servidor.",
      });
      form.setValue("credential", "");
      form.setValue("clearCredential", false);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a Clara",
        description: getOperationalAssistantErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const reload = () => {
    void configurationQuery.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {configurationQuery.data?.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Clara
            </CardTitle>
            <CardDescription className="mt-1">
              Configure a ferramenta server-side usada pelo runtime operacional.
            </CardDescription>
          </div>
          {configurationQuery.data ? (
            <span className="rounded-full border px-3 py-1 text-xs font-medium">
              {configurationQuery.data.enabled ? "Ativa" : "Desativada"}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {configurationQuery.isLoading ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando configuração da Clara...
          </div>
        ) : configurationQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar a Clara</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {getOperationalAssistantErrorMessage(
                configurationQuery.error,
                "Verifique sua permissão e tente novamente.",
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={reload}
                disabled={configurationQuery.isFetching}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : configurationQuery.data ? (
          <form
            id="operational-clara-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <Controller
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor="operational-clara-enabled" className="text-base">
                      Habilitar Clara
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      A ferramenta só será usada quando o runtime estiver habilitado.
                    </p>
                  </div>
                  <Switch
                    id="operational-clara-enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={updateMutation.isPending}
                    aria-label="Habilitar Clara"
                  />
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-[1fr_180px_160px]">
              <Field
                label="URL base"
                htmlFor="operational-clara-base-url"
                error={form.formState.errors.baseUrl?.message}
              >
                <Input
                  id="operational-clara-base-url"
                  type="url"
                  placeholder="https://clara.exemplo.internal"
                  {...form.register("baseUrl")}
                />
              </Field>
              <Field
                label="Timeout (ms)"
                htmlFor="operational-clara-timeout"
                error={form.formState.errors.timeoutMs?.message}
              >
                <Input
                  id="operational-clara-timeout"
                  type="number"
                  min={100}
                  max={30_000}
                  {...form.register("timeoutMs", { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="Tentativas"
                htmlFor="operational-clara-attempts"
                error={form.formState.errors.maxAttempts?.message}
              >
                <Input
                  id="operational-clara-attempts"
                  type="number"
                  min={1}
                  max={3}
                  {...form.register("maxAttempts", { valueAsNumber: true })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Credencial"
                htmlFor="operational-clara-credential"
                error={form.formState.errors.credential?.message}
              >
                <Input
                  id="operational-clara-credential"
                  type="password"
                  autoComplete="new-password"
                  placeholder={hasCredential ? "Credencial configurada" : "Informe a credencial"}
                  {...form.register("credential")}
                />
                <p className="text-xs text-muted-foreground">
                  O segredo é write-only e não é exibido novamente.
                </p>
              </Field>
              {hasCredential ? (
                <Controller
                  control={form.control}
                  name="clearCredential"
                  render={({ field }) => (
                    <label
                      htmlFor="operational-clara-clear-credential"
                      className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm"
                    >
                      <Checkbox
                        id="operational-clara-clear-credential"
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                      <span>
                        <span className="block font-medium">Remover credencial</span>
                        <span className="text-xs text-muted-foreground">
                          Desative a Clara antes de remover o segredo.
                        </span>
                      </span>
                    </label>
                  )}
                />
              ) : null}
            </div>

            <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                A URL é validada pela política do ambiente e cada atualização usa a
                versão atual para evitar sobrescrever alterações concorrentes.
              </span>
            </div>
          </form>
        ) : null}
      </CardContent>
      {configurationQuery.data ? (
        <CardFooter className="flex-col items-stretch gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Versão {configurationQuery.data.version}
            {configurationQuery.data.updatedAt
              ? ` · Atualizada em ${formatDateTime(configurationQuery.data.updatedAt)}`
              : " · Ainda não configurada"}
          </p>
          <Button
            type="submit"
            form="operational-clara-form"
            disabled={updateMutation.isPending || !form.formState.isDirty}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? "Salvando..." : "Salvar Clara"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
