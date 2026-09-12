import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperationalChannelDialog, OperationalChannelFormValues } from "@/components/operation/OperationalChannelDialog";
import { OperationalChannelDetail } from "@/components/operation/OperationalChannelDetail";
import { OperationalChannelList } from "@/components/operation/OperationalChannelList";
import { OperationalMetaManualAccountCard } from "@/components/operation/OperationalMetaManualAccountCard";
import {
  OperationalRouteDialog,
  OperationalRouteFormValues,
} from "@/components/operation/OperationalRouteDialog";
import {
  getOperationalErrorCode,
  getOperationalErrorMessage,
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
  const [detailChannelId, setDetailChannelId] = useState<string | null>(null);
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
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Ambiente operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Canais de entrada
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Veja os canais de {workspaceName || "este ambiente"}, o destino das
            mensagens e o próximo passo de cada canal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canConnectChannels ? (
            <Button onClick={openCreateChannel} disabled={!canOpenCreateChannel}>
              <Plus className="h-4 w-4" />
              Adicionar canal
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Mais ações dos canais"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => void refreshOperationalState()}
                disabled={channelsQuery.isFetching || routesQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    channelsQuery.isFetching || routesQuery.isFetching
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Atualizar canais
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            Canais deste ambiente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada canal mostra o status de prontidão e o próximo passo necessário.
          </p>
        </div>

        <OperationalChannelList
          channels={channels}
          routesByChannelId={routesByChannelId}
          isLoading={channelsQuery.isLoading}
          isFetching={channelsQuery.isFetching}
          isError={channelsQuery.isError}
          onRetryChannels={() => channelsQuery.refetch()}
          routesIsLoading={routesQuery.isLoading}
          routesIsError={routesQuery.isError}
          onRetryRoutes={() => routesQuery.refetch()}
          canManageConnection={canConnectChannels}
          canManageRoute={canManageChannels}
          isDeactivationPending={channelMutations.deactivate.isPending}
          isActivationPending={channelMutations.activate.isPending}
          isQrPending={channelMutations.requestQrCode.isPending}
          webhookUrls={webhookUrls}
          onEditChannel={openEditChannel}
          onConfigureRoute={openRouteDialog}
          onDeactivate={setChannelToDeactivate}
          onActivate={(item) => void handleActivate(item)}
          onRequestQrCode={(item) => void handleRequestQrCode(item)}
          onRefresh={() => void refreshOperationalState()}
          onOpenDetails={(item) => setDetailChannelId(item.id)}
          page={channelsQuery.data?.page ?? channelsPage}
          totalPages={channelsQuery.data?.totalPages ?? 1}
          onPageChange={setChannelsPage}
          canCreateChannel={canConnectChannels}
          canOpenCreateChannel={canOpenCreateChannel}
          onCreateChannel={openCreateChannel}
        />
      </div>

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

      <OperationalChannelDetail
        open={Boolean(detailChannelId)}
        channel={
          channels.find((item) => item.id === detailChannelId) ?? null
        }
        route={
          detailChannelId
            ? routesByChannelId.get(detailChannelId) ?? null
            : null
        }
        isRouteError={routesQuery.isError}
        canManageConnection={canConnectChannels}
        canManageRoute={canManageChannels}
        isDeactivationPending={channelMutations.deactivate.isPending}
        isActivationPending={channelMutations.activate.isPending}
        isQrPending={channelMutations.requestQrCode.isPending}
        isRefreshing={channelsQuery.isFetching || routesQuery.isFetching}
        webhookUrl={
          detailChannelId ? webhookUrls[detailChannelId] : undefined
        }
        onOpenChange={(open) => {
          if (!open) setDetailChannelId(null);
        }}
        onEditChannel={(item) => {
          setDetailChannelId(null);
          openEditChannel(item);
        }}
        onEditDestination={(item) => {
          setDetailChannelId(null);
          openRouteDialog(item, routesByChannelId.get(item.id) ?? null);
        }}
        onActivate={(item) => void handleActivate(item)}
        onDeactivate={(item) => setChannelToDeactivate(item)}
        onRequestQrCode={(item) => void handleRequestQrCode(item)}
        onRefresh={() => void refreshOperationalState()}
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
