import { AlertCircle, CheckCircle2, ChevronRight, Pause } from "lucide-react";
import {
  OperationalChannel,
  OperationalChannelRoute,
} from "@/types/operation-channels";
import { OPERATIONAL_CHANNEL_PROVIDER_LABELS } from "@/components/operation/operationalChannelLabels";
import {
  OperationalChannelStateSpec,
  describeOperationalChannelDestination,
} from "@/components/operation/operationalChannelStatus";
import { cn } from "@/lib/utils";

type OperationalChannelListItemProps = {
  channel: OperationalChannel;
  route: OperationalChannelRoute | null;
  state: OperationalChannelStateSpec;
  selected: boolean;
  onSelect: () => void;
};

export function OperationalChannelListItem({
  channel,
  route,
  state,
  selected,
  onSelect,
}: OperationalChannelListItemProps) {
  const channelName = channel.displayName || channel.providerAlias;
  const channelIdentity =
    channel.metaDisplayPhoneNumber ||
    OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider];
  const destination = route
    ? describeOperationalChannelDestination(route)
    : channel.route.configured
      ? "Destino indisponível"
      : "Destino ainda não definido";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      aria-label={`Abrir canal ${channelName}`}
      className={cn(
        "group flex w-full items-start gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
          selected
            ? "border-primary/20 bg-primary/10 text-primary"
            : "bg-background text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {channelName.slice(0, 2).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{channelName}</span>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              selected && "translate-x-0.5 text-primary",
            )}
          />
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {channelIdentity}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <OperationalChannelStateBadge state={state} />
        </span>
        <span className="mt-2 block truncate text-xs text-muted-foreground">
          {destination}
        </span>
      </span>
    </button>
  );
}

export function OperationalChannelStateBadge({
  state,
}: {
  state: Pick<OperationalChannelStateSpec, "key" | "label" | "tone">;
}) {
  const toneClasses: Record<OperationalChannelStateSpec["tone"], string> = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    muted: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[state.tone],
      )}
    >
      {state.tone === "success" ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : state.key === "PAUSED" || state.key === "READY_TO_ACTIVATE" ? (
        <Pause className="h-3 w-3 shrink-0" />
      ) : (
        <AlertCircle className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{state.label}</span>
    </span>
  );
}
