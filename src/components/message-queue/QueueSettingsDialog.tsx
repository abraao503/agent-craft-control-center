import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { updatePipelineQueue } from "@/services/message-queue/updatePipelineQueue";
import { MessageQueueWithPipeline } from "@/types/message-queue";
import { Loader2 } from "lucide-react";

interface QueueSettingsDialogProps {
  queue: MessageQueueWithPipeline;
  pipelineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueSettingsDialog({
  queue,
  pipelineId,
  open,
  onOpenChange,
}: QueueSettingsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [delaySeconds, setDelaySeconds] = useState(queue.delaySeconds);
  const [isActive, setIsActive] = useState(queue.isActive);

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePipelineQueue(pipelineId, {
        delaySeconds,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelineQueue", pipelineId],
      });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações da fila foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar configurações da fila.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate delay range
    if (delaySeconds < 30 || delaySeconds > 3600) {
      toast({
        title: "Valor inválido",
        description: "O intervalo deve estar entre 30 e 3600 segundos.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configurações da Fila</DialogTitle>
            <DialogDescription>
              Ajuste as configurações de processamento da fila de mensagens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delaySeconds">
                Intervalo entre mensagens (segundos)
              </Label>
              <Input
                id="delaySeconds"
                type="number"
                min={30}
                max={3600}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
                required
              />
              <p className="text-sm text-muted-foreground">
                Intervalo entre o envio de mensagens (30 segundos a 1 hora)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Fila ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Processar mensagens automaticamente
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
