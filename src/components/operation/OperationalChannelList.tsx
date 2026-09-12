import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Inbox, Loader2, Plus, RefreshCw } from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OperationalChannelListItem } from "@/components/operation/OperationalChannelListItem";
import { OperationalChannelDetail } from "@/components/operation/OperationalChannelDetail";
import {
  OperationalChannelStateSpec,
  deriveOperationalChannelStateWithActivation,
} from "@/components/operation/operationalChannelStatus";
import { useIsMobile } from "@/hooks/use-mobile";

type OperationalChannelListProps = {
  channels: OperationalChannel[];
  routesByChannelId: Map<string, OperationalChannelRoute>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetryChannels: () => void;
  routesIsError: boolean;
  canManageConnection: boolean;
  canManageRoute: boolean;
  isDeactivationPending: boolean;
  isActivationPending: boolean;
  isQrPending: boolean;
  webhookUrls: Record<string, string>;
  onEditChannel: (channel: OperationalChannel) => void;
  onConfigureRoute: (
    channel: OperationalChannel,
    route: OperationalChannelRoute | null,
  ) => void;
  onDeactivate: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canCreateChannel: boolean;
  canOpenCreateChannel: boolean;
  onCreateChannel: () => void;
};

export function OperationalChannelList({
  channels,
  routesByChannelId,
  isLoading,
  isFetching,
  isError,
  onRetryChannels,
  routesIsError,
  canManageConnection,
  canManageRoute,
  isDeactivationPending,
  isActivationPending,
  isQrPending,
  webhookUrls,
  onEditChannel,
  onConfigureRoute,
  onDeactivate,
  onActivate,
  onRequestQrCode,
  onRefresh,
  page,
  totalPages,
  onPageChange,
  canCreateChannel,
  canOpenCreateChannel,
  onCreateChannel,
}: OperationalChannelListProps) {
  const isMobile = useIsMobile();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    if (!channels.length) {
      setSelectedChannelId(null);
      return;
    }

    if (!selectedChannelId || !channels.some((item) => item.id === selectedChannelId)) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const statesByChannelId = useMemo(
    () =>
      new Map(
        channels.map((channel) => [
          channel.id,
          deriveOperationalChannelStateWithActivation({
            channel,
            route: routesByChannelId.get(channel.id) ?? null,
            routeUnavailable:
              routesIsError &&
              channel.route.configured &&
              !routesByChannelId.get(channel.id),
            canManageConnection,
            canManageRoute,
          }) as OperationalChannelStateSpec,
        ]),
      ),
    [
      channels,
      routesByChannelId,
      routesIsError,
      canManageConnection,
      canManageRoute,
    ],
  );

  const selectedChannel =
    channels.find((channel) => channel.id === selectedChannelId) ??
    channels[0] ??
    null;
  const selectedRoute = selectedChannel
    ? routesByChannelId.get(selectedChannel.id) ?? null
    : null;

  const selectChannel = (channel: OperationalChannel) => {
    setSelectedChannelId(channel.id);
    if (isMobile) setMobileDetailOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Carregando canais operacionais</span>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Não foi possível carregar os canais</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          Verifique sua permissão ou tente novamente.
          <Button
            size="sm"
            variant="outline"
            onClick={onRetryChannels}
            disabled={isFetching}
          >
            <RefreshCw
              className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!channels.length) {
    return (
      <Card>
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="mt-4 font-semibold">Nenhum canal configurado</p>
          <p className="mt-1 max-w-md text-sm leading-5 text-muted-foreground">
            {canManageConnection
              ? "Adicione um canal para receber mensagens e encaminhá-las para a operação."
              : "Um administrador autorizado ainda não configurou canais neste ambiente."}
          </p>
          {canCreateChannel ? (
            <Button
              className="mt-5"
              onClick={onCreateChannel}
              disabled={!canOpenCreateChannel}
            >
              <Plus className="h-4 w-4" />
              Adicionar canal
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const detailProps = {
    channel: selectedChannel,
    route: selectedRoute,
    isRouteError: routesIsError,
    canManageConnection,
    canManageRoute,
    isDeactivationPending,
    isActivationPending,
    isQrPending,
    isRefreshing: isFetching,
    webhookUrl: selectedChannel ? webhookUrls[selectedChannel.id] : undefined,
    onEditChannel,
    onEditDestination: (channel: OperationalChannel) =>
      onConfigureRoute(channel, routesByChannelId.get(channel.id) ?? null),
    onActivate,
    onDeactivate,
    onRequestQrCode,
    onRefresh,
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="grid min-h-[560px] lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
          <aside className="border-r-0 bg-muted/10 lg:border-r">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Seus canais</p>
                <p className="text-xs text-muted-foreground">
                  {channels.length} {channels.length === 1 ? "canal" : "canais"}
                </p>
              </div>
              {isFetching ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            <nav aria-label="Canais deste ambiente">
              {channels.map((channel) => (
                <OperationalChannelListItem
                  key={channel.id}
                  channel={channel}
                  route={routesByChannelId.get(channel.id) ?? null}
                  state={statesByChannelId.get(channel.id)!}
                  selected={selectedChannel?.id === channel.id}
                  onSelect={() => selectChannel(channel)}
                />
              ))}
            </nav>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 border-t px-3 py-3 text-xs">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || isFetching}
                >
                  Anterior
                </Button>
                <span className="text-muted-foreground">
                  {page} de {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || isFetching}
                >
                  Próxima
                </Button>
              </div>
            ) : null}
          </aside>

          <div className="hidden min-w-0 lg:block">
            <OperationalChannelDetail presentation="inline" {...detailProps} />
          </div>
        </div>
      </Card>

      <OperationalChannelDetail
        presentation="sheet"
        open={mobileDetailOpen}
        onOpenChange={setMobileDetailOpen}
        {...detailProps}
      />
    </>
  );
}
