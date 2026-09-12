import { useState } from "react";
import {
  ChevronDown,
  Pencil,
  QrCode,
  RefreshCw,
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

type OperationalChannelDetailProps = {
  open: boolean;
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
  onOpenChange: (open: boolean) => void;
  onEditChannel: (channel: OperationalChannel) => void;
  onEditDestination: (channel: OperationalChannel) => void;
  onActivate: (channel: OperationalChannel) => void;
  onDeactivate: (channel: OperationalChannel) => void;
  onRequestQrCode: (channel: OperationalChannel) => void;
  onRefresh: () => void;
};

export function OperationalChannelDetail({
  open,
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
  onOpenChange,
  onEditChannel,
  onEditDestination,
  onActivate,
  onDeactivate,
  onRequestQrCode,
  onRefresh,
}: OperationalChannelDetailProps) {
  const [technicalOpen, setTechnicalOpen] = useState(false);

  if (!channel) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-xl" />
      </Sheet>
    );
  }

  const routeUnavailable = isRouteError && channel.route.configured && !route;
  const state: OperationalChannelStateSpec =
    deriveOperationalChannelStateWithActivation({
      channel,
      route,
      routeUnavailable,
      canManageConnection,
      canManageRoute,
    });
  const routeIsValid =
    channel.route.configured && channel.route.configurationStatus === "VALID";
  const channelName = channel.displayName || channel.providerAlias;
  const connectionReady = ["CONNECTED", "OPEN"].includes(
    channel.connectionStatus.toUpperCase(),
  );
  const canActivate =
    canManageConnection &&
    !channel.active &&
    routeIsValid &&
    !isActivationPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b px-5 pb-4 pt-5 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="truncate text-xl">{channelName}</SheetTitle>
            <OperationalChannelStateBadge state={state} />
          </div>
          <SheetDescription>
            {channel.metaDisplayPhoneNumber
              ? `${channel.metaDisplayPhoneNumber} · `
              : ""}
            {OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-5 py-5">
          <section aria-labelledby="operational-channel-readiness">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resumo de prontidão
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium">{state.label}.</span>{" "}
              {state.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Próximo passo: <span className="font-medium">{state.nextStep}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {canManageConnection ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditChannel(channel)}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar identificação e credenciais
                  </Button>
                  {channel.active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeactivate(channel)}
                      disabled={isDeactivationPending}
                    >
                      Pausar canal
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onActivate(channel)}
                      disabled={!canActivate}
                    >
                      Ativar canal
                    </Button>
                  )}
                </>
              ) : null}
              {canManageConnection &&
              !connectionReady &&
              channel.capabilities.supportsQr &&
              channel.active ? (
                <Button
                  size="sm"
                  onClick={() => onRequestQrCode(channel)}
                  disabled={isQrPending}
                >
                  <QrCode className="h-4 w-4" />
                  Gerar QR Code
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                />
                Atualizar status
              </Button>
            </div>
          </section>

          <Separator />

          <section aria-labelledby="operational-channel-connection">
            <p
              id="operational-channel-connection"
              className="text-sm font-semibold"
            >
              Conexão
            </p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <DetailRow
                label="Status"
                value={
                  channel.active
                    ? getOperationalStatusLabel(channel.connectionStatus)
                    : "Desativado"
                }
              />
              <DetailRow
                label="Credenciais"
                value={
                  channel.credentialsConfigured ? "Configuradas" : "Incompletas"
                }
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
                <DetailRow label="Webhook operacional" value={webhookUrl} code />
              ) : null}
            </dl>
          </section>

          <Separator />

          <section aria-labelledby="operational-channel-destination">
            <div className="flex items-center justify-between gap-3">
              <p
                id="operational-channel-destination"
                className="text-sm font-semibold"
              >
                Destino das mensagens
              </p>
              {canManageRoute ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditDestination(channel)}
                >
                  <Pencil className="h-4 w-4" />
                  {routeIsValid || channel.route.configured
                    ? "Editar destino"
                    : "Definir destino"}
                </Button>
              ) : null}
            </div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <DetailRow
                label="Estado"
                value={
                  routeUnavailable
                    ? "Indisponível"
                    : routeIsValid
                      ? "Válido"
                      : channel.route.configured
                        ? "Incompleto"
                        : "Não definido"
                }
              />
              <DetailRow
                label="Modo"
                value={
                  channel.route.entryMode
                    ? OPERATIONAL_CHANNEL_ENTRY_MODE_LABELS[channel.route.entryMode]
                    : "Ainda não definido"
                }
              />
              <DetailRow
                label="Resumo"
                value={route ? describeOperationalChannelDestination(route) : "Ainda não definido"}
              />
              {route ? (
                <DetailRow
                  label="Última atualização"
                  value={formatOperationalDateTime(route.updatedAt)}
                />
              ) : null}
              {!canManageRoute ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Somente administradores com permissão podem editar o destino.
                </p>
              ) : null}
            </dl>
          </section>

          <Separator />

          <section aria-labelledby="operational-channel-technical">
            <button
              type="button"
              onClick={() => setTechnicalOpen((value) => !value)}
              aria-expanded={technicalOpen}
              className="flex w-full items-center justify-between text-left"
            >
              <p
                id="operational-channel-technical"
                className="text-sm font-semibold"
              >
                Diagnóstico técnico
              </p>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  technicalOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Códigos e dados do provedor para diagnóstico; mantido fechado por padrão.
            </p>
            {technicalOpen ? (
              <dl className="mt-3 space-y-1.5 text-sm">
                <DetailRow label="Diagnóstico" value={channel.route.diagnostic.code} code />
                <DetailRow
                  label="Mensagem do diagnóstico"
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
                <DetailRow
                  label="Versão"
                  value={`v${channel.version}`}
                />
                <DetailRow
                  label="Mídia"
                  value={
                    channel.capabilities.supportsMedia ? "Suportada" : "Não suportada"
                  }
                />
                <DetailRow
                  label="QR Code"
                  value={
                    channel.capabilities.supportsQr ? "Suportado" : "Não suportado"
                  }
                />
                <DetailRow label="Provedor (alias)" value={channel.providerAlias} code />
              </dl>
            ) : null}
          </section>
        </div>
      </SheetContent>
    </Sheet>
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
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      {code ? (
        <code className="break-all rounded bg-muted/40 px-1.5 py-0.5 text-xs font-medium">
          {value}
        </code>
      ) : (
        <dd className="break-words font-medium">{value}</dd>
      )}
    </div>
  );
}
