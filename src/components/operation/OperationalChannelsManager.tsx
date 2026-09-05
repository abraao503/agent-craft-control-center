import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Route,
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
  OperationalChannel,
  OperationalChannelProviderName,
  OperationalChannelRoute,
  OperationalZApiCredentials,
  UpdateOperationalChannelBody,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  OperationalRouteDialog,
  OperationalRouteFormValues,
} from "@/components/operation/OperationalRouteDialog";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  OPERATIONAL_CHANNEL_ROUTE_MISSING_LABELS,
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
  const [routeChannelId, setRouteChannelId] = useState("");
  const [channelToDeactivate, setChannelToDeactivate] =
    useState<OperationalChannel | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeState | null>(null);

  const canManageChannels = has("manage:operation-channels");
  const canManageTriageAgents = has("manage:operation-setup");
  const canConnectChannels =
    canManageChannels && has("connect:whatsapp");
  const channelsQuery = useOperationalChannels(workspaceId, channelsPage);
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
  const defaultRouteChannelId =
    channels.find((channel) => channel.active)?.id ?? "";
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
    setRouteChannelId("");
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
        await channelMutations.create.mutateAsync({
          body,
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Conexão criada",
          description: "Configure uma rota válida antes de solicitar ativação.",
        });
      }

      setChannelDialogOpen(false);
      setEditingChannel(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a conexão",
        description: getOperationalErrorMessage(
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
      const configuration = {
        entryMode: values.entryMode,
        triageAgentId: values.triageAgentId,
        assistantId: values.assistantId,
        targetAreaId: values.targetAreaId,
        targetQueueId: values.targetQueueId,
        fallbackAreaId: values.fallbackAreaId,
        fallbackQueueId: values.fallbackQueueId,
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
            channelId: values.channelId,
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
      setRouteChannelId("");
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
        description: "O histórico foi preservado e o canal saiu do tráfego.",
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
      await channelMutations.activate.mutateAsync({
        channelId: channel.id,
        idempotencyKey: crypto.randomUUID(),
      });
      toast({ title: "Conexão ativada" });
    } catch (error) {
      toast({
        title: "Ativação bloqueada",
        description: getOperationalErrorMessage(
          error,
          "A execução de mensagens ainda não está disponível.",
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
    setRouteChannelId(channel.id);
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
        {canConnectChannels ? (
          <Button onClick={openCreateChannel} disabled={!canOpenCreateChannel}>
            <Plus className="h-4 w-4" />
            Nova conexão
          </Button>
        ) : null}
      </header>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Recebimento de mensagens ainda indisponível</AlertTitle>
        <AlertDescription className="mt-1">
          <p>
            As conexões podem ser configuradas e validadas, mas o recebimento de mensagens ainda não está habilitado.
          </p>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="mt-1 h-auto px-0 text-muted-foreground">
                Ver detalhes técnicos
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1 text-xs text-muted-foreground">
              O recebimento e o envio de mensagens permanecem bloqueados por enquanto; Assistentes operacionais estarão disponíveis em uma etapa futura.
            </CollapsibleContent>
          </Collapsible>
        </AlertDescription>
      </Alert>

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
            <p className="mt-3 font-medium">Nenhuma conexão operacional</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canConnectChannels
                ? "Crie a primeira conexão para começar a configurar a entrada."
                : "Um administrador autorizado ainda não configurou um canal neste ambiente."}
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
                onEditChannel={openEditChannel}
                onConfigureRoute={openRouteDialog}
                onDeactivate={setChannelToDeactivate}
                onActivate={(item) => void handleActivate(item)}
                onRequestQrCode={(item) => void handleRequestQrCode(item)}
              />
            );
          })}
        </div>
      )}

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
        defaultProvider={defaultProvider}
        providers={providersQuery.data ?? []}
        providersLoading={providersQuery.isLoading}
        canViewIntegrations={has("view:integrations")}
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
        defaultChannelId={routeChannelId || defaultRouteChannelId}
        channels={channels}
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
            setRouteChannelId("");
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
  onEditChannel,
  onConfigureRoute,
  onDeactivate,
  onActivate,
  onRequestQrCode,
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
  onEditChannel: (channel: OperationalChannel) => void;
  onConfigureRoute: (
    channel: OperationalChannel,
    route: OperationalChannelRoute | null,
  ) => void;
  onDeactivate: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const runtimeBlocked = channel.route.trafficStatus === "BLOCKED_BY_RUNTIME";
  const routeUnavailable = isRouteError && channel.route.configured && !route;
  const routeStatus = routeUnavailable
    ? "Rota indisponível"
    : channel.route.configured
    ? channel.route.configurationStatus === "VALID"
      ? "Rota configurada"
      : "Rota incompleta"
    : "Sem rota ativa";
  const channelName = channel.displayName || channel.providerAlias;
  const canOpenRoute = !channel.route.configured || Boolean(route);
  const routeIsValid = !routeUnavailable && channel.route.configurationStatus === "VALID";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="truncate text-lg">{channelName}</CardTitle>
                <Badge variant="outline">
                  {channel.active ? "Ativa" : "Desativada"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]} · {getOperationalStatusLabel(channel.connectionStatus)}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {!channel.credentialsConfigured ? (
                  <Badge className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    Credenciais incompletas
                  </Badge>
                ) : (
                  <Badge variant="secondary">Credenciais configuradas</Badge>
                )}
                <Badge variant={routeIsValid ? "secondary" : "outline"}>
                  {routeStatus}
                </Badge>
              </div>

              <div className="mt-3 flex items-start gap-2 text-sm">
                {runtimeBlocked ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                )}
                <span className="font-medium">
                  {runtimeBlocked
                    ? "Configurado, mas ainda não recebe atendimentos"
                    : "Disponível para receber atendimentos"}
                </span>
              </div>

              {route ? (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Destino:</span>{" "}
                  <span className="font-medium">{describeRoute(route)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageConnection ? (
                <Button size="sm" variant="outline" onClick={() => onEditChannel(channel)}>
                  <Pencil className="h-4 w-4" />
                  Editar conexão
                </Button>
              ) : null}
              {canManageConnection && channel.active ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9" aria-label={`Mais ações para ${channelName}`}>
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
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" aria-expanded={isOpen}>
                  {isOpen ? "Recolher" : "Gerenciar"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 border-t p-4 sm:p-5">
            <section>
              <h3 className="text-sm font-semibold">Conexão</h3>
              <div className="mt-2 divide-y rounded-md border px-3">
                <PropertyRow label="Status" value={getOperationalStatusLabel(channel.connectionStatus)} />
                <PropertyRow label="Credenciais" value={channel.credentialsConfigured ? "Configuradas" : "Incompletas"} attention={!channel.credentialsConfigured} />
                {channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId ? (
                  <PropertyRow label="Número" value={channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId || "—"} />
                ) : null}
              </div>
            </section>

            <section className="border-t pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Route className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Rota de entrada</h3>
                    <Badge variant={routeIsValid ? "secondary" : "outline"}>{routeStatus}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {channel.route.entryMode
                      ? OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS[channel.route.entryMode]
                      : "Nenhum modo selecionado"}
                    {route ? ` · atualizada em ${formatOperationalDateTime(route.updatedAt)}` : ""}
                  </p>
                </div>
                {canManageRoute ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onConfigureRoute(channel, route)}
                    disabled={isRouteLoading || !canOpenRoute}
                    title={
                      routeUnavailable
                        ? "Não foi possível carregar a rota. Tente novamente acima."
                        : !canOpenRoute
                          ? "Carregue a rota completa para editá-la"
                          : undefined
                    }
                  >
                    {route ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {route ? "Editar rota" : "Configurar rota"}
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm">
                {routeIsValid ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-medium">
                    {routeUnavailable
                      ? "Detalhes da rota indisponíveis"
                      : routeIsValid
                        ? "Rota configurada corretamente"
                        : "Rota incompleta"}
                  </p>
                  {routeUnavailable ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Não foi possível consultar o destino completo. Tente
                      novamente no aviso acima antes de editar a rota.
                    </p>
                  ) : channel.route.missing.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Faltando: {channel.route.missing.map((item) => OPERATIONAL_CHANNEL_ROUTE_MISSING_LABELS[item]).join(", ")}.
                    </p>
                  ) : null}
                </div>
              </div>

              {route ? (
                <div className="mt-4 border-l-2 border-primary/30 pl-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destino</p>
                  <p className="mt-1 text-sm font-medium">{describeRoute(route)}</p>
                </div>
              ) : null}
            </section>

            <Collapsible className="rounded-md bg-muted/30 px-3">
              <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-left text-sm font-medium [&[data-state=open]>svg]:rotate-180">
                Detalhes técnicos
                <ChevronDown className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t pb-3">
                <div className="divide-y">
                  <PropertyRow label="Provedor" value={`${channel.providerAlias} · ${getOperationalStatusLabel(channel.status)}`} />
                  <PropertyRow label="Versão" value={`v${channel.version}`} />
                  <PropertyRow label="Diagnóstico" value={channel.route.diagnostic.code} code />
                  <PropertyRow label="Mensagem do diagnóstico" value={channel.route.diagnostic.message} />
                  <PropertyRow label="Modo de conexão" value={channel.connectionMode === "provisioned-number" ? "Número provisionado" : "Credenciais próprias"} />
                  <PropertyRow label="Mídia" value={channel.capabilities.supportsMedia ? "Suportada" : "Não suportada"} />
                  <PropertyRow label="QR Code" value={channel.capabilities.supportsQr ? "Suportado" : "Não suportado"} />
                  <PropertyRow label="Execução" value={runtimeBlocked ? "Bloqueada por enquanto; Assistentes em etapa futura" : "Disponível"} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {canManageConnection && (!channel.active || channel.capabilities.supportsQr) ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                {!channel.active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActivate(channel)}
                    disabled={runtimeBlocked || isActivationPending}
                    title={runtimeBlocked ? "Ativação bloqueada por enquanto" : undefined}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {runtimeBlocked ? "Ativação indisponível" : "Ativar conexão"}
                  </Button>
                ) : null}
                {channel.capabilities.supportsQr ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestQrCode(channel)}
                    disabled={!channel.active || runtimeBlocked || isQrPending}
                    title={runtimeBlocked ? "QR Code indisponível por enquanto" : undefined}
                  >
                    <QrCode className="h-4 w-4" />
                    {runtimeBlocked ? "QR Code indisponível" : "Solicitar QR Code"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
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
        <code className="select-all rounded bg-background px-2 py-1 text-xs font-medium">{value}</code>
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
    return `Agente externo: ${route.destinations.triageAgent?.name || "agente indisponível"}`;
  }

  return `${route.destinations.assistant?.name || "Assistente indisponível"} → alternativa: ${route.destinations.fallbackArea?.name || "Área indisponível"} / ${route.destinations.fallbackQueue?.name || "Fila indisponível"}`;
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
