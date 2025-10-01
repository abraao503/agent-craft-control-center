import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface MoveConditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: string;
  targetStageName: string;
  onSave: (condition: string) => void;
}

export const MoveConditionModal: React.FC<MoveConditionModalProps> = ({
  open,
  onOpenChange,
  condition,
  targetStageName,
  onSave,
}) => {
  const [editedCondition, setEditedCondition] = useState(condition);

  useEffect(() => {
    setEditedCondition(condition);
  }, [condition, open]);

  const handleSave = () => {
    onSave(editedCondition);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Condição para Movimentação</DialogTitle>
          <DialogDescription>
            Defina quando o agente deve mover o negócio para a etapa{" "}
            <span className="font-semibold">{targetStageName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">Por que a condição é importante?</p>
              <p>
                O agente usará esta condição para decidir automaticamente quando mover 
                negócios para a etapa <span className="font-semibold">{targetStageName}</span>. 
                Quanto mais específica e clara, melhor será a automação.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition" className="text-sm font-medium">
              Condição de Movimentação
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="condition"
              placeholder="Ex: Cliente confirmou interesse no produto e solicitou orçamento detalhado. O agente deve verificar se há informações suficientes sobre o produto desejado antes de mover."
              value={editedCondition}
              onChange={(e) => setEditedCondition(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Seja específico sobre as condições que devem ser atendidas para
              que o agente realize esta movimentação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={editedCondition.trim().length === 0}
          >
            Salvar Condição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
