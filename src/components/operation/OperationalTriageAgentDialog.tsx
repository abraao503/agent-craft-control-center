import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";

const MAX_TIMEOUT_MS = 90_000;

const formSchema = z.object({
    name: z.string().trim().min(1, "Informe um nome").max(120),
    baseUrl: z.string().trim().url("Informe uma URL válida").max(2_048),
    credential: z.string().max(5_000),
    timeoutMs: z.coerce.number().int().min(100).max(MAX_TIMEOUT_MS),
    maxAttempts: z.coerce.number().int().min(1).max(3),
    enabled: z.boolean(),
  });

export type OperationalTriageAgentFormValues = z.infer<typeof formSchema>;

type OperationalTriageAgentDialogProps = {
  open: boolean;
  agent: OperationalTriageAgent | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalTriageAgentFormValues) => Promise<void>;
};

export function OperationalTriageAgentDialog({
  open,
  agent,
  isPending,
  onOpenChange,
  onSubmit,
}: OperationalTriageAgentDialogProps) {
  const form = useForm<OperationalTriageAgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(agent),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(agent));
    }
  }, [agent, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>
            {agent
              ? "Editar integração de triagem"
              : "Nova integração de triagem"}
          </DialogTitle>
          <DialogDescription>
            Configure um serviço externo para analisar as entradas da operação.
            A chave de acesso é somente para gravação e nunca pode ser lida depois.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => {
            if (!agent && !values.credential.trim()) {
              form.setError("credential", {
                type: "custom",
                message: "Informe a chave de acesso para criar uma integração.",
              });
              return;
            }

            return onSubmit(values);
          })}
          className="space-y-5"
        >
          <Field
            label="Nome"
            htmlFor="operational-triage-agent-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="operational-triage-agent-name"
              placeholder="Integração principal"
              {...form.register("name")}
            />
          </Field>

          <Field
            label="Endereço do serviço"
            htmlFor="operational-triage-agent-base-url"
            error={form.formState.errors.baseUrl?.message}
          >
            <Input
              id="operational-triage-agent-base-url"
              type="url"
              placeholder="https://servico.exemplo.internal"
              {...form.register("baseUrl")}
            />
          </Field>

          <Field
            label="Chave de acesso"
            htmlFor="operational-triage-agent-credential"
            error={form.formState.errors.credential?.message}
          >
            <Input
              id="operational-triage-agent-credential"
              type="password"
              autoComplete="new-password"
              placeholder={
                agent?.credentialConfigured
                  ? "Chave configurada; informe apenas para substituir"
                  : "Chave de acesso do serviço"
              }
              {...form.register("credential")}
            />
            <p className="text-xs text-muted-foreground">
              {agent
                ? "Deixe em branco para manter o segredo atual."
                : "A chave nunca será exibida novamente."}
            </p>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tempo máximo de resposta (ms)"
              htmlFor="operational-triage-agent-timeout"
              error={form.formState.errors.timeoutMs?.message}
            >
              <Input
                id="operational-triage-agent-timeout"
                type="number"
                min={100}
                max={MAX_TIMEOUT_MS}
                {...form.register("timeoutMs", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Até 90 segundos, conforme o limite da API.
              </p>
            </Field>
            <Field
              label="Número de tentativas"
              htmlFor="operational-triage-agent-attempts"
              error={form.formState.errors.maxAttempts?.message}
            >
              <Input
                id="operational-triage-agent-attempts"
                type="number"
                min={1}
                max={3}
                {...form.register("maxAttempts", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <Controller
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="operational-triage-agent-enabled">
                    Integração ativa
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Integrações inativas não podem ser selecionadas em novas rotas.
                  </p>
                </div>
                <Switch
                  id="operational-triage-agent-enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </div>
            )}
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O serviço precisa responder ao teste de conexão e seguir o formato
              esperado pela operação.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Salvando..." : "Salvar integração"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultValues(
  agent: OperationalTriageAgent | null,
): OperationalTriageAgentFormValues {
  return {
    name: agent?.name ?? "",
    baseUrl: agent?.baseUrl ?? "",
    credential: "",
    timeoutMs: agent?.timeoutMs ?? MAX_TIMEOUT_MS,
    maxAttempts: agent?.maxAttempts ?? 2,
    enabled: agent?.enabled ?? true,
  };
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
