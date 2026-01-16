import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageQueueWithPipeline } from "@/types/message-queue";
import { Settings, Pause, Play } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pausePipelineQueue } from "@/services/message-queue/pausePipelineQueue";
import { resumePipelineQueue } from "@/services/message-queue/resumePipelineQueue";
import { useToast } from "@/components/ui/use-toast";
import { isColorDark } from "@/lib/utils";

interface QueueHeaderProps {
  queue: MessageQueueWithPipeline;
  pipelineId: string;
  onOpenSettings: () => void;
  canUpdate: boolean;
}

export function QueueHeader({
  queue,
  pipelineId,
  onOpenSettings,
  canUpdate,
}: QueueHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: () => pausePipelineQueue(pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelineQueue", pipelineId],
      });
      toast({
        title: "Fila pausada",
        description: "O processamento da fila foi pausado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao pausar a fila.",
        variant: "destructive",
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumePipelineQueue(pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelineQueue", pipelineId],
      });
      toast({
        title: "Fila retomada",
        description: "O processamento da fila foi retomado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao retomar a fila.",
        variant: "destructive",
      });
    },
  });

  const formatDelay = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Fila de mensagens</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pipeline: {queue.pipeline.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canUpdate && (
              <>
                {queue.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeMutation.mutate()}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              style={{
                backgroundColor: queue.isActive ? "#d1fae5" : "#f3f4f6",
                color: queue.isActive
                  ? isColorDark("#d1fae5")
                    ? "white"
                    : "#065f46"
                  : isColorDark("#f3f4f6")
                  ? "white"
                  : "#374151",
              }}
            >
              {queue.isActive ? "Ativa" : "Pausada"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Intervalo</p>
            <p className="font-medium">{formatDelay(queue.delaySeconds)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mensagens pendentes</p>
            <p className="font-medium">{queue.totalMessages}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
