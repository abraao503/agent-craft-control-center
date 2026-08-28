import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Route,
  ShieldCheck,
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
  CardDescription,
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
          "O runtime operacional ainda não está disponível.",
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
          "O runtime operacional ainda não está disponível.",
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
          <AlertTitle>Workspace operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para consultar os canais.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
                <Link to="/operation">
                  <ArrowLeft className="h-4 w-4" />
                  Setup estrutural
                </Link>
              </Button>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Canais de entrada
              </p>
              <CardTitle className="mt-2 text-3xl">
                {workspaceName || "Workspace operacional"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Gerencie conexões e rotas sem expor credenciais. Cada alteração
                respeita a versão do recurso e pode ser repetida com segurança.
              </CardDescription>
            </div>
            {canConnectChannels ? (
              <Button onClick={openCreateChannel} disabled={!canOpenCreateChannel}>
                <Plus className="h-4 w-4" />
                Nova conexão
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Runtime de atendimento</AlertTitle>
        <AlertDescription>
          A configuração pode ser salva como rascunho e diagnosticada agora,
          mas o tráfego permanece bloqueado até E4. Assistants operacionais só
          serão executados quando E6 estiver disponível.
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
                : "Um administrador autorizado ainda não configurou um canal neste workspace."}
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
              Use este código somente quando o runtime operacional estiver
              liberado para o provider.
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
  const runtimeBlocked = channel.route.trafficStatus === "BLOCKED_BY_RUNTIME";
  const routeStatus = channel.route.configured
    ? channel.route.configurationStatus === "VALID"
      ? "Rota válida"
      : "Rota incompleta"
    : "Sem rota ativa";
  const channelName = channel.displayName || channel.providerAlias;
  const canOpenRoute = !channel.route.configured || Boolean(route);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-xl">{channelName}</CardTitle>
              <Badge variant={channel.active ? "default" : "outline"}>
                {channel.active ? "Ativa" : "Desativada"}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]} ·{" "}
              {channel.providerAlias} · {getOperationalStatusLabel(channel.connectionStatus)}
            </CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCell
            label="Estado do provider"
            value={getOperationalStatusLabel(channel.status)}
          />
          <InfoCell
            label="Credenciais"
            value={channel.credentialsConfigured ? "Configuradas" : "Incompletas"}
          />
          <InfoCell label="Versão" value={`v${channel.version}`} />
        </div>

        {channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId ? (
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p className="font-medium">Número Meta vinculado</p>
            <p className="text-muted-foreground">
              {channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId}
            </p>
          </div>
        ) : null}

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                <p className="font-medium">Rota de entrada</p>
                <Badge variant={channel.route.configurationStatus === "VALID" ? "default" : "outline"}>
                  {routeStatus}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
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
                title={!canOpenRoute ? "Carregue a rota completa para editá-la" : undefined}
              >
                {route ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {route ? "Editar rota" : "Configurar rota"}
              </Button>
            ) : null}
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm">
            {channel.route.configurationStatus === "VALID" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="font-medium">Diagnóstico · {channel.route.diagnostic.code}</p>
              <p className="text-muted-foreground">{channel.route.diagnostic.message}</p>
              {channel.route.missing.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Faltando: {channel.route.missing.map((item) => OPERATIONAL_CHANNEL_ROUTE_MISSING_LABELS[item]).join(", ")}.
                </p>
              ) : null}
            </div>
          </div>

          {route ? (
            <p className="mt-3 rounded-md border bg-background px-3 py-2 text-sm">
              Destinos: {describeRoute(route)}
            </p>
          ) : null}

          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              {runtimeBlocked
                ? "Tráfego bloqueado até E4; esta tela registra somente configuração e diagnóstico."
                : "Runtime operacional disponível."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {channel.connectionMode === "provisioned-number"
              ? "Número provisionado"
              : "Credenciais"}
          </Badge>
          {channel.capabilities.supportsQr ? (
            <Badge variant="outline">
              <QrCode className="mr-1 h-3 w-3" />
              QR suportado
            </Badge>
          ) : null}
          {channel.capabilities.supportsMedia ? (
            <Badge variant="outline">Mídia suportada</Badge>
          ) : null}
        </div>

        {canManageConnection ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            {channel.active ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDeactivate(channel)}
                disabled={isDeactivationPending}
              >
                <Trash2 className="h-4 w-4" />
                Desativar conexão
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onActivate(channel)}
                disabled={runtimeBlocked || isActivationPending}
                title={runtimeBlocked ? "Ativação bloqueada até E4" : undefined}
              >
                <CheckCircle2 className="h-4 w-4" />
                {runtimeBlocked ? "Ativação bloqueada até E4" : "Ativar conexão"}
              </Button>
            )}
            {channel.capabilities.supportsQr ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRequestQrCode(channel)}
                disabled={
                  !channel.active ||
                  runtimeBlocked ||
                  isQrPending
                }
                title={runtimeBlocked ? "QR Code bloqueado até E4" : undefined}
              >
                <QrCode className="h-4 w-4" />
                {runtimeBlocked ? "QR bloqueado até E4" : "Solicitar QR Code"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
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

  return `${route.destinations.assistant?.name || "Assistant indisponível"} → fallback: ${route.destinations.fallbackArea?.name || "Área indisponível"} / ${route.destinations.fallbackQueue?.name || "Fila indisponível"}`;
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
