import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  useOperationalChannelRouteMutations,
  useOperationalChannelRoutes,
} from "@/hooks/useOperationalChannelRoutes";
import {
  useOperationalChannelMutations,
  useOperationalChannelProviders,
  useOperationalChannels,
} from "@/hooks/useOperationalChannels";
import { useOperationalRouteOptions } from "@/hooks/useOperationalRouteOptions";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import {
  CreateOperationalChannelBody,
  CreateOperationalChannelRouteBody,
  OperationalChannel,
  OperationalChannelProviderName,
  OperationalChannelRoute,
  OperationalZApiCredentials,
  UpdateOperationalChannelBody,
  UpdateOperationalChannelRouteBody,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToastAction } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperationalChannelDialog, OperationalChannelFormValues } from "@/components/operation/OperationalChannelDialog";
import { OperationalMetaManualAccountCard } from "@/components/operation/OperationalMetaManualAccountCard";
import {
  OperationalRouteDialog,
  OperationalRouteFormValues,
} from "@/components/operation/OperationalRouteDialog";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  formatOperationalDateTime,
  getOperationalErrorCode,
  getOperationalErrorMessage,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";

type OperationalChannelsManagerProps = {
  workspaceId?: string;
  workspaceName?: string;
};

type QrCodeState = {
  channelName: string;
  value: string;
};

export function OperationalChannelsManager({
  workspaceId,
  workspaceName,
}: OperationalChannelsManagerProps) {
  const { has } = usePermissions();
  const { toast } = useToast();
  const [channelsPage, setChannelsPage] = useState(1);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<OperationalChannel | null>(
    null,
  );
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OperationalChannelRoute | null>(
    null,
  );
  const [routeChannel, setRouteChannel] = useState<OperationalChannel | null>(
    null,
  );
  const [channelToDeactivate, setChannelToDeactivate] =
    useState<OperationalChannel | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeState | null>(null);
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({});

  const canManageChannels = has("manage:operation-channels");
  const canManageTriageAgents = has("manage:operation-setup");
  const canConnectChannels =
    canManageChannels && has("connect:whatsapp");
  const channelsQuery = useOperationalChannels(workspaceId, channelsPage, true, true);
  const routesQuery = useOperationalChannelRoutes(workspaceId);
  const providersQuery = useOperationalChannelProviders(
    workspaceId,
    canConnectChannels,
  );
  const routeOptions = useOperationalRouteOptions(
    workspaceId,
    canManageChannels,
    canManageTriageAgents,
  );
  const channelMutations = useOperationalChannelMutations(workspaceId);
  const routeMutations = useOperationalChannelRouteMutations(workspaceId);

  useEffect(() => {
    setChannelsPage(1);
  }, [workspaceId]);

  const routesByChannelId = useMemo(
    () =>
      new Map(
        (routesQuery.data?.items ?? []).map((route) => [route.channelId, route]),
      ),
    [routesQuery.data?.items],
  );
  const channels = channelsQuery.data?.items ?? [];
  const defaultProvider: OperationalChannelProviderName =
    providersQuery.data?.[0]?.name ?? "z-api";
  const channelDialogPending =
    channelMutations.create.isPending || channelMutations.update.isPending;
  const routeDialogPending =
    routeMutations.create.isPending || routeMutations.update.isPending;
  const canOpenCreateChannel =
    canConnectChannels &&
    !providersQuery.isLoading &&
    !providersQuery.isError &&
    Boolean(providersQuery.data?.length);

  const reloadOperationalState = async () => {
    setChannelDialogOpen(false);
    setEditingChannel(null);
    setRouteDialogOpen(false);
    setEditingRoute(null);
    setRouteChannel(null);
    await Promise.all([channelsQuery.refetch(), routesQuery.refetch()]);
  };

  const refreshOperationalState = async () => {
    await Promise.all([channelsQuery.refetch(), routesQuery.refetch()]);
  };

  const staleVersionAction = (error: unknown) =>
    getOperationalErrorCode(error) === "STALE_VERSION" ? (
      <ToastAction
        altText="Recarregar estado"
        onClick={() => void reloadOperationalState()}
      >
        Recarregar
      </ToastAction>
    ) : undefined;

  const handleChannelSubmit = async (values: OperationalChannelFormValues) => {
    try {
      if (editingChannel) {
        const body = buildUpdateChannelBody(values, editingChannel);
        await channelMutations.update.mutateAsync({
          channelId: editingChannel.id,
          body,
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Conexão atualizada",
          description: "A lista e o diagnóstico foram atualizados.",
        });
      } else {
        const body = buildCreateChannelBody(values);
        const createdChannel = await channelMutations.create.mutateAsync({
          body,
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Conexão criada",
          description: "Agora configure a rota de entrada desta conexão.",
        });
        setEditingRoute(null);
        setRouteChannel(createdChannel);
        setRouteDialogOpen(true);
      }

      setChannelDialogOpen(false);
      setEditingChannel(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a conexão",
        description: getChannelActionErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        action: staleVersionAction(error),
        variant: "destructive",
      });
    }
  };

  const handleRouteSubmit = async (values: OperationalRouteFormValues) => {
    try {
      const channelId = editingRoute?.channelId ?? routeChannel?.id ?? values.channelId;
      const configuration = {
        entryMode: values.entryMode,
        triageAgentId: values.triageAgentId,
        assistantId: values.assistantId,
        targetAreaId: values.targetAreaId,
        targetQueueId: values.targetQueueId,
        fallbackAreaId: values.fallbackAreaId,
        fallbackQueueId: values.fallbackQueueId,
        ...buildRouteMenuConfiguration(values),
      };

      if (editingRoute) {
        await routeMutations.update.mutateAsync({
          routeId: editingRoute.id,
          body: {
            ...configuration,
            active: values.active,
            expectedVersion: editingRoute.version,
          },
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Rota atualizada",
          description: "A conexão e o setup foram sincronizados.",
        });
      } else {
        await routeMutations.create.mutateAsync({
          body: {
            ...configuration,
            channelId,
          },
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Rota criada",
          description: "O diagnóstico da rota já está disponível na lista.",
        });
      }

      setRouteDialogOpen(false);
      setEditingRoute(null);
      setRouteChannel(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a rota",
        description: getOperationalErrorMessage(
          error,
          "Verifique os destinos e tente novamente.",
        ),
        action: staleVersionAction(error),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!channelToDeactivate) return;

    try {
      await channelMutations.deactivate.mutateAsync({
        channelId: channelToDeactivate.id,
        expectedVersion: channelToDeactivate.version,
        idempotencyKey: crypto.randomUUID(),
      });
      toast({
        title: "Conexão desativada",
        description:
          "O histórico foi preservado e a conexão saiu da lista de canais ativos.",
      });
      setChannelToDeactivate(null);
    } catch (error) {
      toast({
        title: "Não foi possível desativar a conexão",
        description: getOperationalErrorMessage(
          error,
          "A conexão pode ter sido alterada por outra pessoa.",
        ),
        action: staleVersionAction(error),
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (channel: OperationalChannel) => {
    try {
      const response = await channelMutations.activate.mutateAsync({
        channelId: channel.id,
        idempotencyKey: crypto.randomUUID(),
      });
      setWebhookUrls((current) => ({
        ...current,
        [channel.id]: response.webhookUrl,
      }));
      toast({
        title: "Conexão ativada",
        description: "O webhook operacional foi configurado pelo provedor.",
      });
    } catch (error) {
      toast({
        title: "Ativação bloqueada",
        description: getChannelActivationErrorMessage(
          error,
          "Não foi possível ativar este provedor. Verifique a rota e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleRequestQrCode = async (channel: OperationalChannel) => {
    try {
      const response = await channelMutations.requestQrCode.mutateAsync({
        channelId: channel.id,
      });
      setQrCode({
        channelName: channel.displayName || channel.providerAlias,
        value: response.qrCode,
      });
    } catch (error) {
      toast({
        title: "Não foi possível solicitar o QR Code",
        description: getOperationalErrorMessage(
          error,
          "A execução de mensagens ainda não está disponível.",
        ),
        variant: "destructive",
      });
    }
  };

  const openCreateChannel = () => {
    setEditingChannel(null);
    setChannelDialogOpen(true);
  };

  const openEditChannel = (channel: OperationalChannel) => {
    setEditingChannel(channel);
    setChannelDialogOpen(true);
  };

  const openRouteDialog = (
    channel: OperationalChannel,
    route: OperationalChannelRoute | null,
  ) => {
    setEditingRoute(route);
    setRouteChannel(channel);
    setRouteDialogOpen(true);
  };

  if (!workspaceId) {
    return (
      <section className="mx-auto w-full max-w-5xl p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ambiente operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para consultar os canais.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Ambiente operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Canais de entrada
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure as conexões e escolha para onde as mensagens de {workspaceName || "este ambiente"} serão direcionadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void refreshOperationalState()}
            disabled={channelsQuery.isFetching || routesQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                channelsQuery.isFetching || routesQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />
            Atualizar tudo
          </Button>
          {canConnectChannels ? (
            <Button
              onClick={openCreateChannel}
              disabled={!canOpenCreateChannel}
            >
              <Plus className="h-4 w-4" />
              Nova conexão
            </Button>
          ) : null}
        </div>
      </header>

      {routesQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar as rotas completas</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Os resumos ainda podem aparecer nas conexões; tente novamente para
            editar uma rota existente.
            <Button
              size="sm"
              variant="outline"
              onClick={() => routesQuery.refetch()}
              disabled={routesQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Configuração da empresa
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Credenciais compartilhadas pelos ambientes operacionais.
          </p>
        </div>
        <OperationalMetaManualAccountCard workspaceId={workspaceId} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Conexões deste ambiente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os canais e defina para onde as mensagens de entrada serão direcionadas.
          </p>
        </div>

        {channelsQuery.isLoading ? (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="sr-only">Carregando conexões operacionais</span>
            </CardContent>
          </Card>
        ) : channelsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar os canais</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Verifique sua permissão ou tente novamente.
              <Button
                size="sm"
                variant="outline"
                onClick={() => channelsQuery.refetch()}
                disabled={channelsQuery.isFetching}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : !channels.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wifi className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhuma conexão ativa</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {canConnectChannels
                  ? "As conexões desativadas ficam fora desta lista. Crie uma nova conexão para configurar a entrada."
                  : "Um administrador autorizado ainda não configurou uma conexão ativa neste ambiente."}
              </p>
              {canConnectChannels ? (
                <Button
                  className="mt-4"
                  onClick={openCreateChannel}
                  disabled={!canOpenCreateChannel}
                >
                  <Plus className="h-4 w-4" />
                  Criar conexão
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {channels.map((channel) => {
              const route = routesByChannelId.get(channel.id) ?? null;
              return (
                <OperationalChannelCard
                  key={channel.id}
                  channel={channel}
                  route={route}
                  canManageRoute={canManageChannels}
                  canManageConnection={canConnectChannels}
                  isRouteLoading={routesQuery.isLoading}
                  isRouteError={routesQuery.isError}
                  isDeactivationPending={channelMutations.deactivate.isPending}
                  isActivationPending={channelMutations.activate.isPending}
                  isQrPending={channelMutations.requestQrCode.isPending}
                  isRefreshing={channelsQuery.isFetching}
                  webhookUrl={webhookUrls[channel.id]}
                  onEditChannel={openEditChannel}
                  onConfigureRoute={openRouteDialog}
                  onDeactivate={setChannelToDeactivate}
                  onActivate={(item) => void handleActivate(item)}
                  onRequestQrCode={(item) => void handleRequestQrCode(item)}
                  onRefresh={() => void refreshOperationalState()}
                />
              );
            })}
          </div>
        )}
      </div>

      {channelsQuery.data && channelsQuery.data.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">
            Página {channelsQuery.data.page} de {channelsQuery.data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChannelsPage((page) => page - 1)}
              disabled={channelsPage <= 1 || channelsQuery.isFetching}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChannelsPage((page) => page + 1)}
              disabled={
                channelsPage >= channelsQuery.data.totalPages ||
                channelsQuery.isFetching
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      <OperationalChannelDialog
        open={channelDialogOpen}
        channel={editingChannel}
        workspaceId={workspaceId}
        defaultProvider={defaultProvider}
        providers={providersQuery.data ?? []}
        providersLoading={providersQuery.isLoading}
        canManageConnection={canConnectChannels}
        isPending={channelDialogPending}
        onOpenChange={(open) => {
          setChannelDialogOpen(open);
          if (!open) setEditingChannel(null);
        }}
        onSubmit={handleChannelSubmit}
      />

      <OperationalRouteDialog
        open={routeDialogOpen}
        route={editingRoute}
        channel={routeChannel}
        defaultChannelId={routeChannel?.id ?? ""}
        areas={routeOptions.areas}
        queues={routeOptions.queues}
        assistants={routeOptions.assistants}
        triageAgents={routeOptions.triageAgents}
        allowExternalAgent={canManageTriageAgents}
        optionsLoading={routeOptions.isLoading}
        optionsError={routeOptions.isError}
        isPending={routeDialogPending}
        onRetryOptions={routeOptions.refetch}
        onOpenChange={(open) => {
          setRouteDialogOpen(open);
          if (!open) {
            setEditingRoute(null);
            setRouteChannel(null);
          }
        }}
        onSubmit={handleRouteSubmit}
      />

      <AlertDialog
        open={Boolean(channelToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !channelMutations.deactivate.isPending) {
            setChannelToDeactivate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              A conexão “{channelToDeactivate?.displayName || channelToDeactivate?.providerAlias}”
              ficará fora do tráfego. O histórico e a configuração serão
              preservados para diagnóstico posterior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={channelMutations.deactivate.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
              disabled={channelMutations.deactivate.isPending}
            >
              {channelMutations.deactivate.isPending
                ? "Desativando..."
                : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(qrCode)} onOpenChange={(open) => !open && setQrCode(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>QR Code · {qrCode?.channelName}</DialogTitle>
            <DialogDescription>
              Use este código somente quando o recebimento de mensagens estiver
              liberado para o provedor.
            </DialogDescription>
          </DialogHeader>
          {qrCode?.value.startsWith("data:image/") ? (
            <img
              src={qrCode.value}
              alt="QR Code da conexão operacional"
              className="mx-auto max-h-80 w-auto rounded-md border p-2"
            />
          ) : (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/30 p-3 text-xs">
              {qrCode?.value}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OperationalChannelCard({
  channel,
  route,
  canManageRoute,
  canManageConnection,
  isRouteLoading,
  isRouteError,
  isDeactivationPending,
  isActivationPending,
  isQrPending,
  isRefreshing,
  webhookUrl,
  onEditChannel,
  onConfigureRoute,
  onDeactivate,
  onActivate,
  onRequestQrCode,
  onRefresh,
}: {
  channel: OperationalChannel;
  route: OperationalChannelRoute | null;
  canManageRoute: boolean;
  canManageConnection: boolean;
  isRouteLoading: boolean;
  isRouteError: boolean;
  isDeactivationPending: boolean;
  isActivationPending: boolean;
  isQrPending: boolean;
  isRefreshing: boolean;
  webhookUrl?: string;
  onEditChannel: (channel: OperationalChannel) => void;
  onConfigureRoute: (
    channel: OperationalChannel,
    route: OperationalChannelRoute | null,
  ) => void;
  onDeactivate: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
}) {
  const routeUnavailable = isRouteError && channel.route.configured && !route;
  const routeIsValid =
    !routeUnavailable &&
    channel.route.configured &&
    channel.route.configurationStatus === "VALID";
  const routeStatus = routeUnavailable
    ? "Indisponível"
    : routeIsValid
      ? "Configurada"
      : channel.route.configured
        ? "Incompleta"
        : "Não configurada";
  const channelName = channel.displayName || channel.providerAlias;
  const canOpenRoute = !channel.route.configured || Boolean(route);
  const connectionReady = ["CONNECTED", "OPEN"].includes(
    channel.connectionStatus.toUpperCase(),
  );
  const channelReady = channel.active && routeIsValid && connectionReady;
  const connectionDetail = !channel.active
    ? "Conexão desativada"
    : connectionReady
      ? "Conectada ao provedor"
      : channel.credentialsConfigured
        ? "Credenciais configuradas · aguardando conexão"
        : "Credenciais incompletas";
  const availabilityMessage = channelReady
    ? "Conexão pronta para tráfego"
    : !channel.active
      ? routeIsValid
        ? "Conexão desativada. Ative quando estiver pronta."
        : "Próximo passo: configure uma rota válida."
      : routeUnavailable
        ? "Não foi possível confirmar a rota."
      : !routeIsValid
        ? "Próximo passo: configure uma rota válida."
        : `Aguardando conexão: ${getOperationalStatusLabel(channel.connectionStatus)}`;
  const routeSummary = routeIsValid && route ? describeRoute(route) : routeStatus;
  const channelState: {
    icon: ReactNode;
    label: string;
    detail: string;
    tone: OperationalStatusTone;
  } = routeUnavailable
    ? {
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Rota indisponível",
        detail: "Não foi possível verificar a rota. Atualize o canal para tentar novamente.",
        tone: "danger",
      }
    : !routeIsValid
      ? {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Rota de entrada pendente",
          detail: canManageRoute
            ? "Defina uma rota de entrada para liberar o canal."
            : "A rota de entrada ainda não está pronta neste ambiente.",
          tone: "warning",
        }
      : !channel.active
        ? {
            icon: <XCircle className="h-4 w-4" />,
            label: "Conexão desativada",
            detail: canManageConnection
              ? "Ative a conexão para começar a receber mensagens."
              : "A conexão está desativada neste ambiente.",
            tone: "muted",
          }
        : !channel.credentialsConfigured
          ? {
              icon: <AlertCircle className="h-4 w-4" />,
              label: "Credenciais incompletas",
              detail: canManageConnection
                ? "Atualize as credenciais para conectar o provedor."
                : "As credenciais da conexão ainda não estão completas.",
              tone: "warning",
            }
          : !connectionReady
            ? {
                icon: <AlertCircle className="h-4 w-4" />,
                label: channel.capabilities.supportsQr
                  ? "Aguardando conexão com o WhatsApp"
                  : "Aguardando conexão",
                detail: channel.capabilities.supportsQr
                  ? "O provedor ainda não está conectado. Gere o QR Code para concluir."
                  : "O provedor ainda está conectando. Atualize o status quando houver mudança.",
                tone: "warning",
              }
            : {
                icon: <CheckCircle2 className="h-4 w-4" />,
                label: "Pronto para receber mensagens",
                detail: "A entrada está liberada e a rota está definida para este ambiente.",
                tone: "success",
              };
  const canActivate =
    canManageConnection &&
    !channel.active &&
    routeIsValid &&
    !isRouteLoading &&
    !isActivationPending;
  const channelStateAction = routeUnavailable ? (
    <Button
      size="sm"
      variant="default"
      onClick={onRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      Atualizar conexão
    </Button>
  ) : !routeIsValid ? (
    canManageRoute ? (
      <Button
        size="sm"
        variant="default"
        className="w-full sm:w-auto"
        onClick={() => onConfigureRoute(channel, route)}
        disabled={isRouteLoading || !canOpenRoute}
      >
        {route ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {route ? "Editar rota" : "Configurar rota"}
      </Button>
    ) : null
  ) : !channel.active ? (
    canManageConnection ? (
      <Button
        size="sm"
        variant="default"
        onClick={() => onActivate(channel)}
        disabled={!canActivate}
      >
        <CheckCircle2 className="h-4 w-4" />
        Ativar conexão
      </Button>
    ) : null
  ) : !channel.credentialsConfigured ? (
    canManageConnection ? (
      <Button
        size="sm"
        variant="default"
        onClick={() => onEditChannel(channel)}
      >
        <Pencil className="h-4 w-4" />
        Atualizar credenciais
      </Button>
    ) : null
  ) : !connectionReady && channel.capabilities.supportsQr ? (
    canManageConnection ? (
      <Button
        size="sm"
        variant="default"
        onClick={() => onRequestQrCode(channel)}
        disabled={isQrPending}
      >
        <QrCode className="h-4 w-4" />
        Gerar QR Code
      </Button>
    ) : null
  ) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-lg">{channelName}</CardTitle>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar status da conexão"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="sr-only sm:not-sr-only">Atualizar conexão</span>
            </Button>
            {canManageConnection ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditChannel(channel)}
              >
                <Pencil className="h-4 w-4" />
                Editar conexão
              </Button>
            ) : null}
            {canManageConnection && channel.active ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    aria-label={`Mais ações para ${channelName}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onDeactivate(channel)}
                    disabled={isDeactivationPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desativar conexão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <OperationalChannelStateCard
          icon={channelState.icon}
          label="Status do canal"
          status={channelState.label}
          detail={channelState.detail}
          tone={channelState.tone}
          action={channelStateAction}
          routeSummary={routeSummary}
          provider={OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
        />
      </CardHeader>

      <CardContent className="border-t p-4 sm:p-5">
        <Collapsible className="rounded-lg border bg-muted/30 px-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-left text-sm font-medium [&[data-state=open]>svg]:rotate-180">
            Ver detalhes técnicos
            <ChevronDown className="h-4 w-4 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t pb-3">
            <div className="divide-y">
              <PropertyRow label="Status" value={channel.active ? getOperationalStatusLabel(channel.connectionStatus) : "Desativada"} />
              <PropertyRow label="Conexão" value={connectionDetail} />
              <PropertyRow
                label="Credenciais"
                value={channel.credentialsConfigured ? "Configuradas" : "Incompletas"}
                attention={!channel.credentialsConfigured}
              />
              {channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId ? (
                <PropertyRow
                  label="Número"
                  value={channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId || "—"}
                />
              ) : null}
              {webhookUrl ? (
                <PropertyRow label="Webhook operacional" value={webhookUrl} code />
              ) : null}
              <PropertyRow label="Rota" value={routeStatus} attention={!routeIsValid} />
              <PropertyRow
                label="Modo de entrada"
                value={channel.route.entryMode
                  ? OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS[channel.route.entryMode]
                  : "Ainda não definido"}
              />
              <PropertyRow label="Destino" value={route ? describeRoute(route) : "Ainda não definido"} />
              {route ? (
                <PropertyRow
                  label="Rota atualizada em"
                  value={formatOperationalDateTime(route.updatedAt)}
                />
              ) : null}
              <PropertyRow label="Provedor" value={`${channel.providerAlias} · ${getOperationalStatusLabel(channel.status)}`} />
              <PropertyRow label="Versão" value={`v${channel.version}`} />
              <PropertyRow label="Diagnóstico" value={channel.route.diagnostic.code} code />
              <PropertyRow label="Mensagem do diagnóstico" value={channel.route.diagnostic.message} />
              <PropertyRow label="Modo de conexão" value={channel.connectionMode === "provisioned-number" ? "Número provisionado" : "Credenciais próprias"} />
              <PropertyRow label="Mídia" value={channel.capabilities.supportsMedia ? "Suportada" : "Não suportada"} />
              <PropertyRow label="QR Code" value={channel.capabilities.supportsQr ? "Suportado" : "Não suportado"} />
              <PropertyRow label="Disponibilidade" value={availabilityMessage} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

type OperationalStatusTone = "success" | "warning" | "danger" | "muted";

function OperationalChannelStateCard({
  icon,
  label,
  status,
  detail,
  tone,
  action,
  routeSummary,
  provider,
}: {
  icon: ReactNode;
  label: string;
  status: string;
  detail: string;
  tone: OperationalStatusTone;
  action?: ReactNode;
  routeSummary: string;
  provider: string;
}) {
  const toneClasses: Record<
    OperationalStatusTone,
    { container: string; icon: string; status: string }
  > = {
    success: {
      container: "border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      status: "text-emerald-800 dark:text-emerald-200",
    },
    warning: {
      container: "border-amber-200/80 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      status: "text-amber-800 dark:text-amber-200",
    },
    danger: {
      container: "border-destructive/30 bg-destructive/5",
      icon: "bg-destructive/10 text-destructive",
      status: "text-destructive",
    },
    muted: {
      container: "border-border bg-muted/10",
      icon: "bg-muted text-muted-foreground",
      status: "text-foreground",
    },
  };
  const classes = toneClasses[tone];

  return (
    <div className={`rounded-lg border p-4 ${classes.container}`} aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${classes.icon}`}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-1 font-semibold ${classes.status}`}>{status}</p>
            <p className="mt-1 break-words text-sm text-muted-foreground">{detail}</p>
          </div>
        </div>
        {action ? <div className="w-full sm:w-auto sm:shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-sm">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-muted-foreground">Rota</span>
          <span className="break-words font-medium">{routeSummary}</span>
        </div>
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-muted-foreground">Provedor</span>
          <span className="break-words font-medium">{provider}</span>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({
  label,
  value,
  attention = false,
  code = false,
}: {
  label: string;
  value: string;
  attention?: boolean;
  code?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      {code ? (
        <code className="break-all rounded bg-background px-2 py-1 text-xs font-medium sm:max-w-[70%] sm:text-right">
          {value}
        </code>
      ) : (
        <span className={attention ? "font-medium text-amber-700 dark:text-amber-300" : "font-medium"}>{value}</span>
      )}
    </div>
  );
}

function describeRoute(route: OperationalChannelRoute): string {
  if (route.entryMode === "TRIAGE") {
    return "Triagem operacional";
  }

  if (route.entryMode === "QUEUE") {
    return `${route.destinations.targetArea?.name || "Área indisponível"} → ${route.destinations.targetQueue?.name || "Fila indisponível"}`;
  }

  if (route.entryMode === "EXTERNAL_AGENT") {
    const handoff = route.destinations.handoffArea?.name &&
      route.destinations.handoffQueue?.name
      ? ` · encaminhamento: ${route.destinations.handoffArea.name} → ${route.destinations.handoffQueue.name}`
      : "";
    return `Integração de triagem: ${route.destinations.triageAgent?.name || "integração indisponível"}${handoff}`;
  }

  return `${route.destinations.assistant?.name || "Agente de atendimento indisponível"} → alternativa: ${route.destinations.fallbackArea?.name || "Área indisponível"} / ${route.destinations.fallbackQueue?.name || "Fila indisponível"}`;
}

function buildRouteMenuConfiguration(
  values: OperationalRouteFormValues,
): Partial<CreateOperationalChannelRouteBody> &
  Partial<UpdateOperationalChannelRouteBody> {
  if (values.entryMode !== "EXTERNAL_AGENT") {
    return {};
  }

  return {
    menuGreeting: values.menuGreeting?.trim() || null,
    invalidMenuMessage: values.invalidMenuMessage?.trim() || null,
    handoffAreaId: values.handoffAreaId,
    handoffQueueId: values.handoffQueueId,
    menuOptions: values.menuOptions.map((option, index) => ({
      number: index + 1,
      label: option.label.trim(),
      action: option.action,
      responseText: option.responseText.trim(),
      targetAreaId: option.action === "ROUTE" ? option.targetAreaId : null,
      targetQueueId: option.action === "ROUTE" ? option.targetQueueId : null,
    })),
  };
}

function buildCreateChannelBody(
  values: OperationalChannelFormValues,
): CreateOperationalChannelBody {
  const displayName = values.displayName.trim();
  const common = displayName ? { displayName } : {};

  if (values.provider === "z-api") {
    return {
      provider: "z-api",
      ...common,
      credentials: {
        externalToken: values.externalToken.trim(),
        externalClientToken: values.externalClientToken.trim(),
        postbackUrl: values.postbackUrl?.trim() || "",
      },
    };
  }

  if (values.provider === "meta-cloud") {
    return {
      provider: "meta-cloud",
      ...common,
      metaPhoneNumberId: values.metaPhoneNumberId.trim(),
    };
  }

  return { provider: "evolux", ...common };
}

function buildUpdateChannelBody(
  values: OperationalChannelFormValues,
  channel: OperationalChannel,
): UpdateOperationalChannelBody {
  const credentials: Partial<OperationalZApiCredentials> = {};
  if (channel.provider === "z-api") {
    if (values.externalToken.trim()) {
      credentials.externalToken = values.externalToken.trim();
    }
    if (values.externalClientToken.trim()) {
      credentials.externalClientToken = values.externalClientToken.trim();
    }
    if (values.postbackUrl?.trim()) {
      credentials.postbackUrl = values.postbackUrl.trim();
    }
  }

  return {
    displayName: values.displayName.trim() || null,
    expectedVersion: channel.version,
    ...(Object.keys(credentials).length ? { credentials } : {}),
  };
}

function getChannelActionErrorMessage(error: unknown, fallback: string): string {
  const code = getOperationalErrorCode(error);
  if (code === "PROVIDER_CREDENTIALS_INCOMPLETE") {
    return "Complete as credenciais e a URL de postback antes de ativar a conexão.";
  }
  if (code === "META_PHONE_NUMBER_IN_USE") {
    return "Este número já está vinculado a outro canal operacional.";
  }
  if (code === "PROVIDER_UNAVAILABLE") {
    return "O provedor não respondeu. Aguarde alguns instantes e tente novamente.";
  }
  return getOperationalErrorMessage(error, fallback);
}

function getChannelActivationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (getOperationalErrorCode(error) === "ROUTE_INCOMPLETE") {
    return "Configure uma rota válida antes de ativar a conexão.";
  }

  return getChannelActionErrorMessage(error, fallback);
}
