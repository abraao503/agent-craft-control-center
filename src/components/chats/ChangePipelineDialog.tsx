import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { PipelineListItem } from "@/types/pipeline";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

interface ChangePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPipelineId: string | null;
  onConfirm: (pipelineId: string) => Promise<void>;
}

export const ChangePipelineDialog: React.FC<ChangePipelineDialogProps> = ({
  open,
  onOpenChange,
  currentPipelineId,
  onConfirm,
}) => {
  const { currentWorkspace } = useWorkspaceManager();
  const [pipelines, setPipelines] = useState<PipelineListItem[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPipelines = React.useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listPipelines(currentWorkspace.id);
      setPipelines(data);

      // Pre-select current pipeline if available
      if (currentPipelineId) {
        setSelectedPipelineId(currentPipelineId);
      }
    } catch (err) {
      console.error("Error loading pipelines:", err);
      setError("Erro ao carregar pipelines. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, currentPipelineId]);

  useEffect(() => {
    if (open && currentWorkspace?.id) {
      loadPipelines();
    }
  }, [open, currentWorkspace?.id, loadPipelines]);

  const handleConfirm = async () => {
    if (!selectedPipelineId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(selectedPipelineId);
      onOpenChange(false);
    } catch (err) {
      console.error("Error changing pipeline:", err);
      setError("Erro ao trocar pipeline. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) {
        setSelectedPipelineId("");
        setError(null);
      }
    }
  };

  const isCurrentPipeline = selectedPipelineId === currentPipelineId;
  const canSubmit = selectedPipelineId && !isCurrentPipeline && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mudar Cliente de Pipeline</DialogTitle>
          <DialogDescription>
            Selecione a pipeline onde o cliente está sendo atendido. Isso mudará
            o contexto da conversa e definirá qual negócio é o principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="pipeline">Funil</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="pipeline">
                  <SelectValue placeholder="Selecione um funil" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{pipeline.name}</span>
                        {pipeline.id === currentPipelineId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Atual)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isCurrentPipeline && selectedPipelineId && (
              <p className="text-sm text-muted-foreground">
                Este já é o funil atual do cliente
              </p>
            )}
          </div>

          {selectedPipelineId && !isCurrentPipeline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                O cliente será movido para este funil. Se não houver um negócio
                neste funil, um novo será criado automaticamente.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Trocando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
