import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { previewOperationalChannelMigration } from "@/services/operation/previewOperationalChannelMigration";
import { OperationalChannel } from "@/types/operation-channels";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function OperationalChannelMigrationDialog({
  open,
  workspaceId,
  sourceChannel,
  channels,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  workspaceId: string;
  sourceChannel: OperationalChannel | null;
  channels: OperationalChannel[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (targetChannelId: string) => Promise<void>;
}) {
  const [targetChannelId, setTargetChannelId] = useState("");
  const availableChannels = useMemo(
    () =>
      channels.filter(
        (channel) =>
          channel.id !== sourceChannel?.id &&
          channel.active &&
          isChannelConnected(channel) &&
          channel.route.configurationStatus === "VALID",
      ),
    [channels, sourceChannel?.id],
  );
  const previewQuery = useQuery({
    queryKey: [
      "operation-channel-migration-preview",
      workspaceId,
      sourceChannel?.id,
      targetChannelId,
    ],
    queryFn: () =>
      previewOperationalChannelMigration({
        workspaceId,
        sourceChannelId: sourceChannel!.id,
        targetChannelId,
      }),
    enabled: Boolean(
      open && workspaceId && sourceChannel?.id && targetChannelId,
    ),
  });

  useEffect(() => {
    if (!open) {
      setTargetChannelId("");
      return;
    }
    if (!availableChannels.some((channel) => channel.id === targetChannelId)) {
      setTargetChannelId(availableChannels[0]?.id ?? "");
    }
  }, [availableChannels, open, targetChannelId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Migrar atendimentos abertos</DialogTitle>
          <DialogDescription>
            O lote preserva o atendimento, a área, a fila e os responsáveis.
            Cada item é validado novamente antes da migração.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            Canal de origem: {sourceChannel?.displayName || "Canal arquivado"}
          </div>
          {availableChannels.length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum destino disponível</AlertTitle>
              <AlertDescription>
                É necessário um canal ativo, conectado e com rota válida.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="bulk-channel-migration-target">Canal de destino</Label>
                <Select value={targetChannelId} onValueChange={setTargetChannelId}>
                  <SelectTrigger id="bulk-channel-migration-target">
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
              {previewQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Calculando atendimentos abertos...</p>
              ) : previewQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível calcular o lote</AlertTitle>
                  <AlertDescription>Atualize os canais e tente novamente.</AlertDescription>
                </Alert>
              ) : previewQuery.data ? (
                <Alert>
                  <AlertTitle>
                    {previewQuery.data.openAttendanceCount} atendimento(s) serão avaliados
                  </AlertTitle>
                  <AlertDescription>
                    Follow-ups pendentes dos itens migrados serão cancelados. Atendimentos
                    encerrados permanecem no canal original.
                  </AlertDescription>
                </Alert>
              ) : null}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={() => targetChannelId && void onSubmit(targetChannelId)}
            disabled={
              isSubmitting ||
              !targetChannelId ||
              !previewQuery.data ||
              previewQuery.data.openAttendanceCount === 0
            }
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Iniciar migração
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
