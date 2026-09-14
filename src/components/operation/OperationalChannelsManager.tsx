import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FlaskConical,
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
  useOperationalChannelRealtime,
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
import { OperationalChannelList } from "@/components/operation/OperationalChannelList";
import { OperationalChannelOnboarding } from "@/components/operation/OperationalChannelOnboarding";
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
  onOpenTestTools?: () => void;
};

type QrCodeState = {
  channelName: string;
  value: string;
};

export function OperationalChannelsManager({
  workspaceId,
  workspaceName,
  onOpenTestTools,
}: OperationalChannelsManagerProps) {
  const { has, isCompanyLevel } = usePermissions();
  const { toast } = useToast();
  const [channelsPage, setChannelsPage] = useState(1);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingChannelId, setOnboardingChannelId] = useState<string | null>(
    null,
  );
  const [onboardingChannelSnapshot, setOnboardingChannelSnapshot] =
    useState<OperationalChannel | null>(null);
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
  useOperationalChannelRealtime(workspaceId, canManageChannels);
  const canConnectChannels =
    canManageChannels && has("connect:whatsapp");
  const canManageCompanyMeta =
    isCompanyLevel() && has("manage:integrations") && canManageChannels;
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
          title: "Canal atualizado",
          description: "A lista e o diagnóstico foram atualizados.",
        });
      } else {
        const body = buildCreateChannelBody(values);
        const createdChannel = await channelMutations.create.mutateAsync({
          body,
          idempotencyKey: crypto.randomUUID(),
        });
        toast({
          title: "Canal criado",
          description: "Defina o destino das mensagens para liberar a ativação.",
        });
        setEditingRoute(null);
        setRouteChannel(createdChannel);
        setRouteDialogOpen(true);
      }

      setChannelDialogOpen(false);
      setEditingChannel(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o canal",
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
          title: "Destino atualizado",
          description: "O canal e o setup foram sincronizados.",
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
          title: "Destino definido",
          description: "O diagnóstico do destino já está disponível na lista.",
        });
      }

      setRouteDialogOpen(false);
      setEditingRoute(null);
      setRouteChannel(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o destino",
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
    const releasingMetaReservation = isHistoricalMetaReservation(
      channelToDeactivate,
    );

    try {
      await channelMutations.deactivate.mutateAsync({
        channelId: channelToDeactivate.id,
        expectedVersion: channelToDeactivate.version,
        idempotencyKey: crypto.randomUUID(),
      });
      toast({
        title: releasingMetaReservation
          ? "Vínculo Meta liberado"
          : "Canal pausado",
        description: releasingMetaReservation
          ? "O registro foi preservado para histórico e o número pode ser usado em outro canal."
          : "O histórico foi preservado e o canal saiu do tráfego de mensagens.",
        });
      setChannelToDeactivate(null);
    } catch (error) {
      toast({
        title: releasingMetaReservation
          ? "Não foi possível liberar o vínculo Meta"
          : "Não foi possível pausar o canal",
        description: getOperationalErrorMessage(
          error,
          "O canal pode ter sido alterado por outra pessoa.",
        ),
        action: staleVersionAction(error),
        variant: "destructive",
      });
    }
  };

  const handleActivateById = async (channelId: string) => {
    try {
      const response = await channelMutations.activate.mutateAsync({
        channelId,
        idempotencyKey: crypto.randomUUID(),
      });
      setWebhookUrls((current) => ({
        ...current,
        [channelId]: response.webhookUrl,
      }));
      toast({
        title: "Canal ativado",
        description: "O webhook operacional foi configurado pelo provedor.",
      });
    } catch (error) {
      toast({
        title: "Ativação bloqueada",
        description: getChannelActivationErrorMessage(
          error,
          "Não foi possível ativar este canal. Verifique o destino e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (channel: OperationalChannel) =>
    handleActivateById(channel.id);

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
    setOnboardingChannelId(null);
    setOnboardingChannelSnapshot(null);
    setOnboardingOpen(true);
  };

  const handleOnboardingCreate = async (
    body: CreateOperationalChannelBody,
  ): Promise<OperationalChannel> => {
    const createdChannel = await channelMutations.create.mutateAsync({
      body,
      idempotencyKey: crypto.randomUUID(),
    });
    setOnboardingChannelSnapshot(createdChannel);
    toast({
      title: "Canal criado",
      description: "Defina o destino das mensagens para liberar a ativação.",
    });
    return createdChannel;
  };

  const handleOnboardingSaveDestination = async (
    _channelId: string,
    values: OperationalRouteFormValues,
  ) => {
    const channelId = _channelId ?? values.channelId;
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
    await routeMutations.create.mutateAsync({
      body: { ...configuration, channelId },
      idempotencyKey: crypto.randomUUID(),
    });
    toast({
      title: "Destino definido",
      description: "A conexão do canal pode ser concluída agora.",
    });
  };

  const openEditChannel = (channel: OperationalChannel) => {
    setEditingChannel(channel);
    setChannelDialogOpen(true);
  };

  const openRouteDialog = (
    channel: OperationalChannel,
    route: OperationalChannelRoute | null,
  ) => {
    if (!route && !channel.route.configured) {
      setOnboardingChannelId(channel.id);
      setOnboardingChannelSnapshot(channel);
      setOnboardingOpen(true);
      return;
    }

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
    <section className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Canais
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Gerencie as entradas de {workspaceName || "este ambiente"} e o
            destino de cada mensagem.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <OperationalMetaManualAccountCard
            workspaceId={workspaceId}
            presentation="trigger"
          />
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
              {onOpenTestTools ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onOpenTestTools}>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Simular mensagem
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <OperationalMetaManualAccountCard
        workspaceId={workspaceId}
        presentation="notice"
      />

      {routesQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os destinos completos</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Os destinos ainda podem aparecer nos canais; tente novamente para
            editar um destino existente.
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

      <OperationalChannelList
          channels={channels}
          routesByChannelId={routesByChannelId}
          isLoading={channelsQuery.isLoading}
          isFetching={channelsQuery.isFetching}
          isError={channelsQuery.isError}
          onRetryChannels={() => channelsQuery.refetch()}
          routesIsError={routesQuery.isError}
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
          page={channelsQuery.data?.page ?? channelsPage}
          totalPages={channelsQuery.data?.totalPages ?? 1}
          onPageChange={setChannelsPage}
          canCreateChannel={canConnectChannels}
          canOpenCreateChannel={canOpenCreateChannel}
          onCreateChannel={openCreateChannel}
      />

      <OperationalChannelOnboarding
        open={onboardingOpen}
        onOpenChange={(open) => {
          setOnboardingOpen(open);
          if (!open) {
            setOnboardingChannelId(null);
            setOnboardingChannelSnapshot(null);
          }
        }}
        workspaceId={workspaceId}
        providers={providersQuery.data ?? []}
        providersLoading={providersQuery.isLoading}
        canManageCompanyMeta={canManageCompanyMeta}
        isCreating={channelMutations.create.isPending}
        channel={
          channels.find((item) => item.id === onboardingChannelId) ??
          onboardingChannelSnapshot
        }
        routeOptions={{
          areas: routeOptions.areas,
          queues: routeOptions.queues,
          assistants: routeOptions.assistants,
          triageAgents: routeOptions.triageAgents,
          isLoading: routeOptions.isLoading,
          isError: routeOptions.isError,
          refetch: routeOptions.refetch,
        }}
        allowExternalAgent={canManageTriageAgents}
        onCreateChannel={async (body) => {
          const created = await handleOnboardingCreate(body);
          setOnboardingChannelId(created.id);
          return created;
        }}
        onSaveDestination={(channelId, values) =>
          handleOnboardingSaveDestination(channelId, values)
        }
        onActivateChannel={async (channelId) => {
          await handleActivateById(channelId);
          await refreshOperationalState();
        }}
        onRequestQrCode={async (channelId) => {
          const target = channels.find((item) => item.id === channelId);
          if (!target) throw new Error("CHANNEL_NOT_FOUND");
          const response = await channelMutations.requestQrCode.mutateAsync({
            channelId,
          });
          await refreshOperationalState();
          return response.qrCode;
        }}
        onRefreshStatus={refreshOperationalState}
      />

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
            <AlertDialogTitle>
              {isHistoricalMetaReservation(channelToDeactivate)
                ? "Liberar vínculo Meta?"
                : "Pausar canal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isHistoricalMetaReservation(channelToDeactivate) ? (
                <>
                  O registro “
                  {channelToDeactivate?.displayName ||
                    channelToDeactivate?.providerAlias}
                  ” será mantido para histórico e o número Meta será liberado
                  para outro canal.
                </>
              ) : (
                <>
                  O canal “
                  {channelToDeactivate?.displayName ||
                    channelToDeactivate?.providerAlias}
                  ” ficará fora do tráfego. O histórico e a configuração serão
                  preservados para diagnóstico posterior.
                </>
              )}
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
                ? isHistoricalMetaReservation(channelToDeactivate)
                  ? "Liberando..."
                  : "Pausando..."
                : isHistoricalMetaReservation(channelToDeactivate)
                  ? "Liberar número"
                  : "Pausar"}
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

function isHistoricalMetaReservation(channel: OperationalChannel | null): boolean {
  return Boolean(
    channel &&
      !channel.active &&
      channel.provider === "meta-cloud" &&
      channel.metaPhoneNumberId,
  );
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
    return "Complete as credenciais e a URL de postback antes de ativar o canal.";
  }
  if (code === "META_PHONE_NUMBER_IN_USE") {
    return "Este número já está reservado por outro canal. Atualize a lista para retomar o canal histórico ou libere o vínculo antes de criar outro.";
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
    return "Defina um destino válido antes de ativar o canal.";
  }

  return getChannelActionErrorMessage(error, fallback);
}
