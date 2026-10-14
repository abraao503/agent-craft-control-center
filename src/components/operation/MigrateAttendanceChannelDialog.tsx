import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { OperationalChannel } from "@/types/operation-channels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MigrateAttendanceChannelDialogProps {
  open: boolean;
  workspaceId: string;
  currentChannelId: string | null;
  currentChannelName?: string | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (targetChannelId: string) => Promise<void>;
}

export function MigrateAttendanceChannelDialog({
  open,
  workspaceId,
  currentChannelId,
  currentChannelName,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: MigrateAttendanceChannelDialogProps) {
  const [targetChannelId, setTargetChannelId] = useState("");
  const channelsQuery = useOperationalChannels(workspaceId, 1, open, true);

  const availableChannels = useMemo(
    () =>
      (channelsQuery.data?.items ?? []).filter(
        (channel) =>
          channel.id !== currentChannelId &&
          channel.active &&
          channel.route.configurationStatus === "VALID" &&
          isChannelConnected(channel),
      ),
    [channelsQuery.data?.items, currentChannelId],
  );

  useEffect(() => {
    if (!open) {
      setTargetChannelId("");
      return;
    }

    if (!availableChannels.some((channel) => channel.id === targetChannelId)) {
      setTargetChannelId(availableChannels[0]?.id ?? "");
    }
  }, [availableChannels, open, targetChannelId]);

  const handleSubmit = () => {
    if (!targetChannelId || isSubmitting) return;
    void onSubmit(targetChannelId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Migrar conversa para outro canal</DialogTitle>
          <DialogDescription>
            O atendimento e o histórico continuam os mesmos. Apenas o canal
            usado para as próximas mensagens será alterado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p className="font-medium">Canal atual</p>
            <p className="mt-1 text-muted-foreground">
              {currentChannelName || "Canal arquivado ou indisponível"}
            </p>
          </div>

          {channelsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar os canais</AlertTitle>
              <AlertDescription>
                Atualize a página e tente abrir a migração novamente.
              </AlertDescription>
            </Alert>
          ) : availableChannels.length === 0 && !channelsQuery.isLoading ? (
            <Alert>
              <AlertTitle>Nenhum canal compatível disponível</AlertTitle>
              <AlertDescription>
                Configure e conecte um canal ativo com uma rota operacional
                válida antes de migrar esta conversa.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="attendance-migration-target">Novo canal</Label>
              <Select
                value={targetChannelId}
                onValueChange={setTargetChannelId}
                disabled={isSubmitting || channelsQuery.isLoading}
              >
                <SelectTrigger id="attendance-migration-target">
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.displayName || "WhatsApp"} · {channel.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Follow-ups pendentes deste atendimento serão cancelados para evitar
            disparos no canal antigo. A área, fila e responsável serão
            preservados.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !targetChannelId || availableChannels.length === 0}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Migrar conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isChannelConnected(channel: OperationalChannel): boolean {
  return channel.provider === "meta-cloud"
    ? ["connected", "open"].includes(channel.connectionStatus.toLowerCase())
    : channel.status.toLowerCase() === "open";
}
