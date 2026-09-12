import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Wifi } from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OperationalChannelListItem } from "@/components/operation/OperationalChannelListItem";
import {
  OperationalChannelFilterGroup,
  OperationalChannelStateSpec,
  deriveOperationalChannelStateWithActivation,
  getOperationalChannelFilterGroup,
} from "@/components/operation/operationalChannelStatus";
import { cn } from "@/lib/utils";

type OperationalChannelListProps = {
  channels: OperationalChannel[];
  routesByChannelId: Map<string, OperationalChannelRoute>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetryChannels: () => void;
  routesIsLoading: boolean;
  routesIsError: boolean;
  onRetryRoutes: () => void;
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

const FILTER_OPTIONS: Array<{
  key: OperationalChannelFilterGroup;
  label: string;
}> = [
  { key: "ALL", label: "Todos" },
  { key: "NEEDS_ACTION", label: "Precisam de ação" },
  { key: "READY", label: "Prontos" },
  { key: "PAUSED", label: "Pausados" },
];

export function OperationalChannelList({
  channels,
  routesByChannelId,
  isLoading,
  isFetching,
  isError,
  onRetryChannels,
  routesIsLoading,
  routesIsError,
  onRetryRoutes,
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
  const [filter, setFilter] = useState<OperationalChannelFilterGroup>("ALL");

  const statesByChannelId = useMemo(
    () =>
      new Map(
        channels.map((channel) => [
          channel.id,
          deriveOperationalChannelStateWithActivation({
            channel,
            route: routesByChannelId.get(channel.id) ?? null,
            routeUnavailable:
              routesIsError && channel.route.configured && !routesByChannelId.get(channel.id),
            canManageConnection,
            canManageRoute,
          }) as OperationalChannelStateSpec,
        ]),
      ),
    [channels, routesByChannelId, routesIsError, canManageConnection, canManageRoute],
  );

  const counts = useMemo(() => {
    const result: Record<OperationalChannelFilterGroup, number> = {
      ALL: channels.length,
      NEEDS_ACTION: 0,
      READY: 0,
      PAUSED: 0,
    };
    for (const state of statesByChannelId.values()) {
      result[getOperationalChannelFilterGroup(state)] += 1;
    }
    return result;
  }, [channels.length, statesByChannelId]);

  const visibleChannels = channels.filter((channel) => {
    const state = statesByChannelId.get(channel.id);
    return filter === "ALL" || (state && getOperationalChannelFilterGroup(state) === filter);
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando canais operacionais</span>
          </CardContent>
        </Card>
      ) : isError ? (
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
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : routesIsError && !channels.length ? null : (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === option.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              <span className="ml-1.5 opacity-70">{counts[option.key]}</span>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !isError && !channels.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Wifi className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhum canal configurado ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canManageConnection
                ? "Adicione o primeiro canal para começar a receber mensagens neste ambiente."
                : "Um administrador autorizado ainda não configurou canais neste ambiente."}
            </p>
            {canCreateChannel ? (
              <Button className="mt-4" onClick={onCreateChannel} disabled={!canOpenCreateChannel}>
                <Plus className="h-4 w-4" />
                Adicionar canal
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && visibleChannels.length ? (
        <div className="space-y-3">
          {visibleChannels.map((channel) => (
            <OperationalChannelListItem
              key={channel.id}
              channel={channel}
              route={routesByChannelId.get(channel.id) ?? null}
              isRouteError={routesIsError}
              canManageConnection={canManageConnection}
              canManageRoute={canManageRoute}
              isDeactivationPending={isDeactivationPending}
              isActivationPending={isActivationPending}
              isQrPending={isQrPending}
              isRefreshing={isFetching}
              webhookUrl={webhookUrls[channel.id]}
              onEditChannel={onEditChannel}
              onConfigureRoute={onConfigureRoute}
              onDeactivate={onDeactivate}
              onActivate={onActivate}
              onRequestQrCode={onRequestQrCode}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && channels.length && !visibleChannels.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum canal neste filtro.
          </CardContent>
        </Card>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isFetching}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
