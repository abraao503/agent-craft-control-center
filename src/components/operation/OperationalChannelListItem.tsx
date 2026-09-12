import { type ReactNode, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  Pause,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  formatOperationalDateTime,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import {
  OperationalChannelStateAction,
  OperationalChannelStateSpec,
  describeOperationalChannelDestination,
  deriveOperationalChannelStateWithActivation,
} from "@/components/operation/operationalChannelStatus";

type OperationalChannelListItemProps = {
  channel: OperationalChannel;
  route: OperationalChannelRoute | null;
  isRouteError: boolean;
  canManageConnection: boolean;
  canManageRoute: boolean;
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
};

export function OperationalChannelListItem({
  channel,
  route,
  isRouteError,
  canManageConnection,
  canManageRoute,
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
}: OperationalChannelListItemProps) {
  const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState(false);
  const routeUnavailable = isRouteError && channel.route.configured && !route;
  const routeIsValid =
    !routeUnavailable &&
    channel.route.configured &&
    channel.route.configurationStatus === "VALID";
  const connectionReady = ["CONNECTED", "OPEN"].includes(
    channel.connectionStatus.toUpperCase(),
  );
  const channelName = channel.displayName || channel.providerAlias;
  const canOpenRoute = !channel.route.configured || Boolean(route);
  const routeStatus = routeUnavailable
    ? "Indisponível"
    : routeIsValid
      ? "Definido"
      : channel.route.configured
        ? "Incompleto"
        : "Não definido";
  const routeSummary =
    routeIsValid && route ? describeOperationalChannelDestination(route) : routeStatus;
  const canActivate =
    canManageConnection &&
    !channel.active &&
    routeIsValid &&
    !isActivationPending;

  const state = deriveOperationalChannelStateWithActivation({
    channel,
    route,
    routeUnavailable,
    canManageConnection,
    canManageRoute,
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{channelName}</p>
            <OperationalChannelStateBadge state={state} />
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="shrink-0 text-muted-foreground">Destino:</span>
              <span className="break-words font-medium">{routeSummary}</span>
            </span>
            {route ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                Atualizado em {formatOperationalDateTime(route.updatedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
          <ChannelStateAction
            state={state}
            isRefreshing={isRefreshing}
            isQrPending={isQrPending}
            isActivationPending={isActivationPending}
            isRouteLoading={false}
            canOpenRoute={canOpenRoute}
            canActivate={canActivate}
            onRefresh={onRefresh}
            onConfigureRoute={() => onConfigureRoute(channel, route)}
            onEditChannel={() => onEditChannel(channel)}
            onActivate={() => onActivate(channel)}
            onRequestQrCode={() => onRequestQrCode(channel)}
            onOpenDetails={() => setTechnicalDetailsOpen(true)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                aria-label={`Mais ações para o canal ${channelName}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onRefresh} disabled={isRefreshing}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Atualizar canal
              </DropdownMenuItem>
              {canManageConnection ? (
                <DropdownMenuItem onSelect={() => onEditChannel(channel)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar identificação
                </DropdownMenuItem>
              ) : null}
              {canManageRoute ? (
                <DropdownMenuItem
                  onSelect={() => onConfigureRoute(channel, route)}
                  disabled={!canOpenRoute}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar destino das mensagens
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onSelect={() => setTechnicalDetailsOpen((open) => !open)}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                {technicalDetailsOpen
                  ? "Ocultar detalhes técnicos"
                  : "Ver detalhes técnicos"}
              </DropdownMenuItem>
              {canManageConnection && channel.active ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onDeactivate(channel)}
                    disabled={isDeactivationPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desativar canal
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {technicalDetailsOpen ? (
        <div className="border-t bg-muted/20 px-4 py-3 sm:px-5">
          <div className="divide-y text-sm">
            <PropertyRow
              label="Status do provedor"
              value={
                channel.active
                  ? getOperationalStatusLabel(channel.connectionStatus)
                  : "Desativado"
              }
            />
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
            <PropertyRow
              label="Modo de entrada"
              value={
                channel.route.entryMode
                  ? OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS[channel.route.entryMode]
                  : "Ainda não definido"
              }
            />
            <PropertyRow
              label="Destino"
              value={route ? describeOperationalChannelDestination(route) : "Ainda não definido"}
            />
            <PropertyRow
              label="Versão"
              value={`v${channel.version}`}
            />
            <PropertyRow label="Diagnóstico" value={channel.route.diagnostic.code} code />
            <PropertyRow label="Mensagem do diagnóstico" value={channel.route.diagnostic.message} />
            <PropertyRow
              label="QR Code"
              value={channel.capabilities.supportsQr ? "Suportado" : "Não suportado"}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function OperationalChannelStateBadge({
  state,
}: {
  state: { key: string; label: string; tone: string };
}) {
  const toneClasses: Record<string, string> = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    muted: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[state.tone] ?? toneClasses.muted}`}
    >
      {state.tone === "success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : state.key === "PAUSED" || state.key === "READY_TO_ACTIVATE" ? (
        <Pause className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {state.label}
    </span>
  );
}

type ChannelStateActionProps = {
  state: {
    key: string;
    primaryAction: { action: OperationalChannelStateAction; label: string } | null;
  };
  isRefreshing: boolean;
  isQrPending: boolean;
  isActivationPending: boolean;
  isRouteLoading: boolean;
  canOpenRoute: boolean;
  canActivate: boolean;
  onRefresh: () => void;
  onConfigureRoute: () => void;
  onEditChannel: () => void;
  onActivate: () => void;
  onRequestQrCode: () => void;
  onOpenDetails: () => void;
};

export function ChannelStateAction(props: ChannelStateActionProps) {
  const primaryAction = props.state.primaryAction;
  if (!primaryAction) return null;

  const className = "w-full sm:w-auto";

  if (primaryAction.action === "configure-destination") {
    return (
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={props.onConfigureRoute}
        disabled={props.isRouteLoading || !props.canOpenRoute}
      >
        <Pencil className="h-4 w-4" />
        {primaryAction.label}
      </Button>
    );
  }

  if (primaryAction.action === "update-credentials") {
    return (
      <Button size="sm" variant="outline" className={className} onClick={props.onEditChannel}>
        <Pencil className="h-4 w-4" />
        {primaryAction.label}
      </Button>
    );
  }

  if (primaryAction.action === "activate-channel") {
    return (
      <Button
        size="sm"
        className={className}
        onClick={props.onActivate}
        disabled={!props.canActivate}
      >
        <CheckCircle2 className="h-4 w-4" />
        {primaryAction.label}
      </Button>
    );
  }

  if (primaryAction.action === "generate-qr") {
    return (
      <Button
        size="sm"
        className={className}
        onClick={props.onRequestQrCode}
        disabled={props.isQrPending}
      >
        <RefreshCw className={props.isQrPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {primaryAction.label}
      </Button>
    );
  }

  if (primaryAction.action === "open-details") {
    return (
      <Button size="sm" variant="outline" className={className} onClick={props.onOpenDetails}>
        <ChevronDown className="h-4 w-4" />
        {primaryAction.label}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      onClick={props.onRefresh}
      disabled={props.isRefreshing}
    >
      <RefreshCw className={props.isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {primaryAction.label}
    </Button>
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
    <div className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      {code ? (
        <code className="break-all rounded bg-background px-2 py-0.5 text-xs font-medium sm:max-w-[70%] sm:text-right">
          {value}
        </code>
      ) : (
        <span className={attention ? "font-medium text-amber-700 dark:text-amber-300" : "font-medium"}>
          {value}
        </span>
      )}
    </div>
  );
}
