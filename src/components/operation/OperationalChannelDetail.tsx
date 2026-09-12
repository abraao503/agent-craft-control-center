import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  QrCode,
  RefreshCw,
  Settings2,
} from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperationalChannelStateBadge } from "@/components/operation/OperationalChannelListItem";
import {
  OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS,
  OPERATIONAL_CHANNEL_PROVIDER_LABELS,
  formatOperationalDateTime,
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import {
  OperationalChannelStateSpec,
  describeOperationalChannelDestination,
  deriveOperationalChannelStateWithActivation,
} from "@/components/operation/operationalChannelStatus";
import { cn } from "@/lib/utils";

type OperationalChannelDetailProps = {
  open?: boolean;
  presentation?: "inline" | "sheet";
  channel: OperationalChannel | null;
  route: OperationalChannelRoute | null;
  isRouteError: boolean;
  canManageConnection: boolean;
  canManageRoute: boolean;
  isDeactivationPending: boolean;
  isActivationPending: boolean;
  isQrPending: boolean;
  isRefreshing: boolean;
  webhookUrl?: string;
  onOpenChange?: (open: boolean) => void;
  onEditChannel: (channel: OperationalChannel) => void;
  onEditDestination: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onDeactivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
};

export function OperationalChannelDetail(props: OperationalChannelDetailProps) {
  const { presentation = "sheet", channel } = props;

  if (presentation === "inline") {
    return channel ? (
      <div className="min-w-0">
        <ChannelDetailContent {...props} channel={channel} />
      </div>
    ) : (
      <div className="flex min-h-[480px] items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Selecione um canal para ver sua configuração.
      </div>
    );
  }

  return (
    <Sheet open={Boolean(props.open && channel)} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        {channel ? <ChannelDetailContent {...props} channel={channel} compact /> : null}
      </SheetContent>
    </Sheet>
  );
}

function ChannelDetailContent({
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
  onEditDestination,
  onActivate,
  onDeactivate,
  onRequestQrCode,
  onRefresh,
  compact = false,
}: Omit<OperationalChannelDetailProps, "channel"> & {
  channel: OperationalChannel;
  compact?: boolean;
}) {
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const routeUnavailable = isRouteError && channel.route.configured && !route;
  const state = deriveOperationalChannelStateWithActivation({
    channel,
    route,
    routeUnavailable,
    canManageConnection,
    canManageRoute,
  });
  const routeIsValid =
    channel.route.configured && channel.route.configurationStatus === "VALID";
  const channelName = channel.displayName || channel.providerAlias;
  const canActivate =
    canManageConnection &&
    !channel.active &&
    routeIsValid &&
    !isActivationPending;
  const destination = route
    ? describeOperationalChannelDestination(route)
    : channel.route.configured
      ? "Destino indisponível"
      : "Ainda não definido";

  return (
    <article className={cn("flex min-h-full flex-col", compact && "pt-2")}>
      <header className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {compact ? (
              <SheetTitle className="truncate text-xl">{channelName}</SheetTitle>
            ) : (
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {channelName}
              </h2>
            )}
            <OperationalChannelStateBadge state={state} />
          </div>
          {compact ? (
            <SheetDescription className="mt-1">
              <ChannelIdentity channel={channel} />
            </SheetDescription>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              <ChannelIdentity channel={channel} />
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              aria-label={`Ações do canal ${channelName}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRefresh} disabled={isRefreshing}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              Atualizar status
            </DropdownMenuItem>
            {canManageConnection ? (
              <DropdownMenuItem onSelect={() => onEditChannel(channel)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar canal
              </DropdownMenuItem>
            ) : null}
            {canManageRoute ? (
              <DropdownMenuItem onSelect={() => onEditDestination(channel)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Editar destino
              </DropdownMenuItem>
            ) : null}
            {canManageConnection && channel.active ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDeactivate(channel)}
                  disabled={isDeactivationPending}
                >
                  Pausar canal
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <ReadinessPanel
          state={state}
          channel={channel}
          canActivate={canActivate}
          isQrPending={isQrPending}
          isRefreshing={isRefreshing}
          onEditChannel={onEditChannel}
          onEditDestination={onEditDestination}
          onActivate={onActivate}
          onRequestQrCode={onRequestQrCode}
          onRefresh={onRefresh}
          onOpenDiagnostic={() => setTechnicalOpen(true)}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Conexão</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Provedor e credenciais deste canal
                </p>
              </div>
              {canManageConnection ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditChannel(channel)}
                >
                  Alterar
                </Button>
              ) : null}
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <DetailRow
                label="Provedor"
                value={OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
              />
              <DetailRow
                label="Estado"
                value={
                  channel.active
                    ? getOperationalStatusLabel(channel.connectionStatus)
                    : "Pausado"
                }
              />
              <DetailRow
                label="Credenciais"
                value={channel.credentialsConfigured ? "Configuradas" : "Pendentes"}
              />
              {channel.metaDisplayPhoneNumber || channel.metaPhoneNumberId ? (
                <DetailRow
                  label="Número"
                  value={
                    channel.metaDisplayPhoneNumber ||
                    channel.metaPhoneNumberId ||
                    "—"
                  }
                />
              ) : null}
              {webhookUrl ? (
                <DetailRow label="Webhook" value={webhookUrl} code />
              ) : null}
            </dl>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Destino das mensagens</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Encaminhamento depois da entrada
                </p>
              </div>
              {canManageRoute ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditDestination(channel)}
                >
                  Alterar
                </Button>
              ) : null}
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <DetailRow
                label="Estado"
                value={
                  routeUnavailable
                    ? "Indisponível"
                    : routeIsValid
                      ? "Configurado"
                      : "Pendente"
                }
              />
              <DetailRow
                label="Modo"
                value={
                  channel.route.entryMode
                    ? OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS[
                        channel.route.entryMode
                      ]
                    : "Ainda não definido"
                }
              />
              <DetailRow label="Encaminhamento" value={destination} />
              {route ? (
                <DetailRow
                  label="Atualizado"
                  value={formatOperationalDateTime(route.updatedAt)}
                />
              ) : null}
            </dl>
          </section>
        </div>

        <section className="rounded-lg border">
          <button
            type="button"
            onClick={() => setTechnicalOpen((value) => !value)}
            aria-expanded={technicalOpen}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium">Diagnóstico técnico</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Informações para suporte e integração
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                technicalOpen && "rotate-180",
              )}
            />
          </button>
          {technicalOpen ? (
            <dl className="space-y-2.5 border-t bg-muted/20 px-4 py-4 text-sm">
              <DetailRow label="Diagnóstico" value={channel.route.diagnostic.code} code />
              <DetailRow
                label="Mensagem"
                value={channel.route.diagnostic.message}
              />
              <DetailRow
                label="Status do provedor"
                value={getOperationalStatusLabel(channel.status)}
              />
              <DetailRow
                label="Modo de conexão"
                value={
                  channel.connectionMode === "provisioned-number"
                    ? "Número provisionado"
                    : "Credenciais próprias"
                }
              />
              <DetailRow label="Versão" value={`v${channel.version}`} />
              <DetailRow
                label="QR Code"
                value={channel.capabilities.supportsQr ? "Suportado" : "Não suportado"}
              />
            </dl>
          ) : null}
        </section>
      </div>
    </article>
  );
}

function ReadinessPanel({
  state,
  channel,
  canActivate,
  isQrPending,
  isRefreshing,
  onEditChannel,
  onEditDestination,
  onActivate,
  onRequestQrCode,
  onRefresh,
  onOpenDiagnostic,
}: {
  state: OperationalChannelStateSpec;
  channel: OperationalChannel;
  canActivate: boolean;
  isQrPending: boolean;
  isRefreshing: boolean;
  onEditChannel: (channel: OperationalChannel) => void;
  onEditDestination: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
  onOpenDiagnostic: () => void;
}) {
  const tones: Record<OperationalChannelStateSpec["tone"], string> = {
    success: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
    warning: "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20",
    danger: "border-destructive/30 bg-destructive/5",
    muted: "border-border bg-muted/30",
  };

  return (
    <section className={cn("rounded-xl border p-4 sm:p-5", tones[state.tone])}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
            {state.tone === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-700" />
            )}
          </span>
          <div>
            <p className="font-semibold">{state.label}</p>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              {state.description}
            </p>
          </div>
        </div>
        <PrimaryStateAction
          state={state}
          channel={channel}
          canActivate={canActivate}
          isQrPending={isQrPending}
          isRefreshing={isRefreshing}
          onEditChannel={onEditChannel}
          onEditDestination={onEditDestination}
          onActivate={onActivate}
          onRequestQrCode={onRequestQrCode}
          onRefresh={onRefresh}
          onOpenDiagnostic={onOpenDiagnostic}
        />
      </div>
    </section>
  );
}

function PrimaryStateAction({
  state,
  channel,
  canActivate,
  isQrPending,
  isRefreshing,
  onEditChannel,
  onEditDestination,
  onActivate,
  onRequestQrCode,
  onRefresh,
  onOpenDiagnostic,
}: {
  state: OperationalChannelStateSpec;
  channel: OperationalChannel;
  canActivate: boolean;
  isQrPending: boolean;
  isRefreshing: boolean;
  onEditChannel: (channel: OperationalChannel) => void;
  onEditDestination: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
  onOpenDiagnostic: () => void;
}) {
  const action = state.primaryAction;
  if (!action) return null;

  const common = "w-full shrink-0 sm:w-auto";
  if (action.action === "configure-destination") {
    return <Button className={common} onClick={() => onEditDestination(channel)}>{action.label}</Button>;
  }
  if (action.action === "update-credentials") {
    return <Button className={common} onClick={() => onEditChannel(channel)}>{action.label}</Button>;
  }
  if (action.action === "activate-channel") {
    return <Button className={common} onClick={() => onActivate(channel)} disabled={!canActivate}>{action.label}</Button>;
  }
  if (action.action === "generate-qr") {
    return (
      <Button className={common} onClick={() => onRequestQrCode(channel)} disabled={isQrPending}>
        <QrCode className="h-4 w-4" />
        {action.label}
      </Button>
    );
  }
  if (action.action === "open-details") {
    return <Button className={common} onClick={onOpenDiagnostic}>{action.label}</Button>;
  }
  return (
    <Button className={common} onClick={onRefresh} disabled={isRefreshing}>
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      {action.label}
    </Button>
  );
}

function ChannelIdentity({ channel }: { channel: OperationalChannel }) {
  return (
    <>
      {channel.metaDisplayPhoneNumber ? `${channel.metaDisplayPhoneNumber} · ` : ""}
      {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
    </>
  );
}

function DetailRow({
  label,
  value,
  code = false,
}: {
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-baseline gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      {code ? (
        <code className="break-all rounded bg-muted/50 px-1.5 py-0.5 text-right text-xs font-medium">
          {value}
        </code>
      ) : (
        <dd className="break-words text-right font-medium">{value}</dd>
      )}
    </div>
  );
}
