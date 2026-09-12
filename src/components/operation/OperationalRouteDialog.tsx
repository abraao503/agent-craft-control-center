import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { OperationalChannel, OperationalChannelRoute } from "@/types/operation-channels";
import { OperationalAssistantOption } from "@/types/operation-assistant";
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
import { ServiceArea, ServiceQueue } from "@/types/operation";
import {
  buildRouteMenuConfiguration,
  OperationalRouteFields,
  OperationalRouteFormValues,
  routeFormSchema,
} from "@/components/operation/OperationalRouteFields";
import { OPERATIONAL_CHANNEL_PROVIDER_LABELS } from "@/components/operation/operationalChannelLabels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type { OperationalRouteFormValues } from "@/components/operation/OperationalRouteFields";

type OperationalRouteDialogProps = {
  open: boolean;
  route: OperationalChannelRoute | null;
  channel: OperationalChannel | null;
  defaultChannelId: string;
  areas: ServiceArea[];
  queues: ServiceQueue[];
  assistants: OperationalAssistantOption[];
  triageAgents: OperationalTriageAgent[];
  allowExternalAgent: boolean;
  optionsLoading: boolean;
  optionsError: boolean;
  isPending: boolean;
  onRetryOptions: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalRouteFormValues) => Promise<void>;
};

export function OperationalRouteDialog({
  open,
  route,
  channel,
  defaultChannelId,
  areas,
  queues,
  assistants,
  triageAgents,
  allowExternalAgent,
  optionsLoading,
  optionsError,
  isPending,
  onRetryOptions,
  onOpenChange,
  onSubmit,
}: OperationalRouteDialogProps) {
  const form = useForm<OperationalRouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: getDefaultValues(route, defaultChannelId),
  });

  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(route, defaultChannelId));
  }, [defaultChannelId, form, open, route]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {route ? "Editar destino das mensagens" : "Definir destino das mensagens"}
          </DialogTitle>
          <DialogDescription>
            {route
              ? "Atualize o destino e o modo de entrada deste canal."
              : "Defina como as mensagens deste canal entrarão na operação."}{" "}
            A integração de triagem só será usada quando a configuração e o
            recebimento de mensagens estiverem disponíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" {...form.register("channelId")} />

          <OperationalRouteFields
            form={form}
            channelLabel={
              channel
                ? `${channel.displayName || channel.providerAlias} · ${
                    OPERATIONAL_CHANNEL_PROVIDER_LABELS[channel.provider]
                  }`
                : undefined
            }
            route={route}
            areas={areas}
            queues={queues}
            assistants={assistants}
            triageAgents={triageAgents}
            allowExternalAgent={allowExternalAgent}
            optionsLoading={optionsLoading}
            optionsError={optionsError}
            isPending={isPending}
          />

          {route ? (
            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="operational-route-active">Destino ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Desativar preserva o histórico e deixa o canal sem um destino válido.
                    </p>
                  </div>
                  <Switch
                    id="operational-route-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </div>
              )}
            />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || optionsLoading || optionsError}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : route ? (
                "Salvar alterações"
              ) : (
                "Definir destino"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultValues(
  route: OperationalChannelRoute | null,
  defaultChannelId: string,
): OperationalRouteFormValues {
  return {
    channelId: route?.channelId ?? defaultChannelId,
    entryMode: route?.entryMode ?? "TRIAGE",
    triageAgentId: route?.triageAgentId ?? null,
    assistantId: route?.assistantId ?? null,
    targetAreaId: route?.targetAreaId ?? null,
    targetQueueId: route?.targetQueueId ?? null,
    fallbackAreaId: route?.fallbackAreaId ?? null,
    fallbackQueueId: route?.fallbackQueueId ?? null,
    menuGreeting: route?.menuGreeting ?? null,
    invalidMenuMessage: route?.invalidMenuMessage ?? null,
    handoffAreaId: route?.handoffAreaId ?? null,
    handoffQueueId: route?.handoffQueueId ?? null,
    menuOptions: (route?.menuOptions ?? []).map((option) => ({
      number: option.number,
      label: option.label,
      action: option.action,
      responseText: option.responseText,
      targetAreaId: option.targetAreaId,
      targetQueueId: option.targetQueueId,
    })),
    active: route?.active ?? true,
  };
}

export { buildRouteMenuConfiguration };
