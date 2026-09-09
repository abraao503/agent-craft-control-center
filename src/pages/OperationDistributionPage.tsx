import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Info,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useOperationalDistribution } from "@/hooks/useOperationalDistribution";
import { usePermissions } from "@/hooks/usePermissions";
import {
  OperationalDistributionOption,
  OperationalDistributionQueueOption,
  OperationalDistributionSettings,
} from "@/types/operation-distribution";
import {
  getOperationalDistributionErrorMessage,
  isOperationalDistributionStaleVersion,
} from "@/utils/operationalDistributionErrors";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";

const distributionFormSchema = z.object({
  enabled: z.boolean(),
  excludedChannelIds: z.array(z.string()),
  excludedAreaIds: z.array(z.string()),
  excludedQueueIds: z.array(z.string()),
  excludedUserIds: z.array(z.string()),
});

type DistributionFormValues = z.infer<typeof distributionFormSchema>;
type SelectorField = keyof Omit<DistributionFormValues, "enabled">;

const EMPTY_FORM: DistributionFormValues = {
  enabled: false,
  excludedChannelIds: [],
  excludedAreaIds: [],
  excludedQueueIds: [],
  excludedUserIds: [],
};

export default function OperationDistributionPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManageDistribution = has("manage:operation-setup");
  const distribution = useOperationalDistribution(
    workspaceId,
    canManageDistribution,
  );
  const settings = distribution.settings.data;
  const options = distribution.options.data;
  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (settings) {
      form.reset(toFormValues(settings));
    }
  }, [form, settings]);

  const areaNames = useMemo(
    () => new Map((options?.areas ?? []).map((area) => [area.id, area.name])),
    [options?.areas],
  );
  const selectorOptions = useMemo(
    () =>
      options
        ? {
            channels: toOptions(options.channels),
            areas: toOptions(options.areas),
            queues: toQueueOptions(options.queues, areaNames),
            users: toOptions(options.users),
          }
        : null,
    [areaNames, options],
  );

  const reload = async () => {
    await Promise.all([
      distribution.settings.refetch(),
      distribution.options.refetch(),
    ]);
  };

  const handleSubmit = async (values: DistributionFormValues) => {
    if (!settings) return;

    try {
      await distribution.update.mutateAsync({
        ...values,
        strategy: "UNIFORM",
        expectedVersion: settings.version,
      });
      toast({
        title: "Distribuição atualizada",
        description: "As exceções serão aplicadas às próximas atribuições.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar a distribuição",
        description: getOperationalDistributionErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        action: isOperationalDistributionStaleVersion(error) ? (
          <ToastAction altText="Recarregar configuração" onClick={() => void reload()}>
            Recarregar
          </ToastAction>
        ) : undefined,
        variant: "destructive",
      });
    }
  };

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para administrar a distribuição.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const isLoading = distribution.settings.isLoading || distribution.options.isLoading;
  const error = distribution.settings.error || distribution.options.error;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/operation"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "-ml-3 mb-2",
            })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Configuração estrutural
          </Link>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Administração operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Distribuição uniforme
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure a roleta por fila e defina quais canais, áreas, filas ou
            operadores devem ficar fora da atribuição automática.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 px-3 py-2">
          <Settings2 className="h-4 w-4" />
          Ambiente: {currentWorkspace.name}
        </Badge>
      </header>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como a distribuição funciona</AlertTitle>
        <AlertDescription>
          Depois do encaminhamento automático, o atendimento tenta seguir a ordem
          uniforme dos operadores ativos na área e na fila. Sem operador
          elegível, ele permanece em <strong>Aguardando fila</strong> para
          atendimento manual. Presença online não altera a elegibilidade.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-52 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando configuração de distribuição...
            </span>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a distribuição</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalDistributionErrorMessage(
              error,
              "Verifique sua permissão ou tente novamente.",
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              disabled={distribution.settings.isFetching || distribution.options.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : settings && selectorOptions ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração da roleta</CardTitle>
                <CardDescription>
                  A estratégia disponível nesta etapa é uniforme e mantém um
                  cursor independente para cada fila.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Controller
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div>
                        <Label htmlFor="distribution-enabled" className="text-base">
                          Ativar distribuição automática
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          A configuração é global para este ambiente e pode ser
                          desligada sem perder as exceções salvas.
                        </p>
                      </div>
                      <Switch
                        id="distribution-enabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={distribution.update.isPending}
                        aria-label="Ativar distribuição automática"
                      />
                    </div>
                  )}
                />

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Estratégia</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uniforme (distribuição alternada por fila), com desempate pelo ID do
                    operador quando o cursor ainda não foi usado.
                  </p>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h2 className="font-semibold">Exceções</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Itens selecionados não acionam a roleta. Remova uma
                      seleção para voltar a considerar o item.
                    </p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <DistributionSelector
                      control={form.control}
                      name="excludedChannelIds"
                      id="excluded-channels"
                      label="Canais excluídos"
                      emptyLabel="Nenhum canal excluído"
                      description="A entrada por estes canais seguirá disponível para encaminhamento manual."
                      options={selectorOptions.channels}
                    />
                    <DistributionSelector
                      control={form.control}
                      name="excludedAreaIds"
                      id="excluded-areas"
                      label="Áreas excluídas"
                      emptyLabel="Nenhuma área excluída"
                      description="Todas as filas destas áreas ficam fora da distribuição automática."
                      options={selectorOptions.areas}
                    />
                    <DistributionSelector
                      control={form.control}
                      name="excludedQueueIds"
                      id="excluded-queues"
                      label="Filas excluídas"
                      emptyLabel="Nenhuma fila excluída"
                      description="A fila permanece disponível para que um operador a assuma manualmente."
                      options={selectorOptions.queues}
                    />
                    <DistributionSelector
                      control={form.control}
                      name="excludedUserIds"
                      id="excluded-users"
                      label="Operadores excluídos"
                      emptyLabel="Nenhum operador excluído"
                      description="O operador deixa de participar da roleta, sem perder seus demais vínculos."
                      options={selectorOptions.users}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Versão {settings.version} · Atualizada em {formatDateTime(settings.updatedAt)}
                </p>
                <Button
                  type="submit"
                  disabled={distribution.update.isPending || !form.formState.isDirty}
                >
                  {distribution.update.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {distribution.update.isPending ? "Salvando..." : "Salvar configuração"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      ) : null}
    </section>
  );
}

function DistributionSelector({
  control,
  name,
  id,
  label,
  emptyLabel,
  description,
  options,
}: {
  control: ReturnType<typeof useForm<DistributionFormValues>>["control"];
  name: SelectorField;
  id: string;
  label: string;
  emptyLabel: string;
  description: string;
  options: Option[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <MultiSelect
            id={id}
            aria-label={label}
            options={options}
            selected={field.value}
            onChange={field.onChange}
            placeholder={emptyLabel}
          />
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    />
  );
}

function toFormValues(settings: OperationalDistributionSettings): DistributionFormValues {
  return {
    enabled: settings.enabled,
    excludedChannelIds: settings.excludedChannelIds,
    excludedAreaIds: settings.excludedAreaIds,
    excludedQueueIds: settings.excludedQueueIds,
    excludedUserIds: settings.excludedUserIds,
  };
}

function toOptions(items: OperationalDistributionOption[]): Option[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

function toQueueOptions(
  items: OperationalDistributionQueueOption[],
  areaNames: Map<string, string>,
): Option[] {
  return items.map((item) => ({
    value: item.id,
    label: `${item.name} · ${areaNames.get(item.areaId) ?? "Área"}`,
  }));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
