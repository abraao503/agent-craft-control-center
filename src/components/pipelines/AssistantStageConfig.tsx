import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit2, ArrowRight, AlertCircle } from "lucide-react";
import {
  AssistantAllowedTargetStage,
  AssistantPipelineStage,
} from "@/types/pipeline";
import { MoveConditionModal } from "./MoveConditionModal";

interface AssistantStageConfigProps {
  stageId: string;
  stageName: string;
  stageOrder: number;
  assistantConfig?: AssistantPipelineStage | null;
  availableStages: Array<{ id: string; name: string; order: number }>;
  onConfigChange: (
    stageId: string,
    config?: AssistantPipelineStage | null
  ) => void;
}

export const AssistantStageConfig: React.FC<AssistantStageConfigProps> = ({
  stageId,
  stageName,
  stageOrder,
  assistantConfig,
  availableStages,
  onConfigChange,
}) => {
  const agentEnabledForStage = !!assistantConfig;
  const allowedTargetStages =
    assistantConfig?.assistantAllowedTargetStages ?? [];

  const [editingCondition, setEditingCondition] = useState<{
    index: number;
    condition: string;
    targetStageName: string;
  } | null>(null);

  const handleCanActChange = (canAct: boolean) => {
    if (!canAct) {
      onConfigChange(stageId, null);
    } else {
      onConfigChange(stageId, {
        assistantAllowedTargetStages: [],
      });
    }
  };

  const handleAddTargetStage = () => {
    if (!assistantConfig) return;

    const newTargetStage: AssistantAllowedTargetStage = {
      targetStageOrder: 0,
      moveCondition: "",
    };

    const updatedConfig = {
      ...assistantConfig,
      assistantAllowedTargetStages: [...allowedTargetStages, newTargetStage],
    };

    onConfigChange(stageId, updatedConfig);
  };

  const handleRemoveTargetStage = (index: number) => {
    if (!assistantConfig) return;

    const updatedTargetStages = allowedTargetStages.filter(
      (_, i) => i !== index
    );
    onConfigChange(stageId, {
      ...assistantConfig,
      assistantAllowedTargetStages: updatedTargetStages,
    });
  };

  const handleTargetStageChange = (
    index: number,
    field: keyof AssistantAllowedTargetStage,
    value: string | number
  ) => {
    if (!assistantConfig) return;

    const updatedTargetStages = allowedTargetStages.map((stage, i) =>
      i === index ? { ...stage, [field]: value } : stage
    );

    onConfigChange(stageId, {
      ...assistantConfig,
      assistantAllowedTargetStages: updatedTargetStages,
    });
  };

  const handleEditCondition = (index: number) => {
    const targetStage = allowedTargetStages[index];
    const targetStageName =
      availableStages.find((s) => s.order === targetStage.targetStageOrder)
        ?.name || "Etapa desconhecida";

    setEditingCondition({
      index,
      condition: targetStage.moveCondition,
      targetStageName,
    });
  };

  const handleSaveCondition = (condition: string) => {
    if (editingCondition === null) return;
    handleTargetStageChange(editingCondition.index, "moveCondition", condition);
    setEditingCondition(null);
  };

  // Filter out current stage from available target stages
  const availableTargetStages = availableStages.filter(
    (stage) => stage.order !== stageOrder
  );

  return (
    <Card className="mt-3">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Agente Ativo</CardTitle>
          <Switch
            checked={agentEnabledForStage}
            onCheckedChange={handleCanActChange}
          />
        </div>
      </CardHeader>

      {agentEnabledForStage && (
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-medium text-muted-foreground">
                Movimentações Permitidas ({allowedTargetStages.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTargetStage}
                className="h-8 text-xs px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar
              </Button>
            </div>

            {allowedTargetStages.length > 0 && (
              <div className="space-y-2.5">
                {allowedTargetStages.map((targetStage, index) => {
                  const targetStageName =
                    availableStages.find(
                      (s) => s.order === targetStage.targetStageOrder
                    )?.name || "Selecione";
                  const hasCondition =
                    targetStage.moveCondition.trim().length > 0;
                  const isStageSelected = targetStage.targetStageOrder !== 0;

                  return (
                    <div
                      key={`${stageId}-target-${index}-${targetStage.targetStageOrder}`}
                      className="space-y-1.5"
                    >
                      <div
                        className={`flex items-center gap-2 p-2 border rounded-md transition-colors ${
                          !hasCondition && isStageSelected
                            ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground shrink-0">
                            #{index + 1}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Select
                            value={String(targetStage.targetStageOrder)}
                            onValueChange={(value) =>
                              handleTargetStageChange(
                                index,
                                "targetStageOrder",
                                Number(value)
                              )
                            }
                          >
                            <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-background/50 w-[180px]">
                              <SelectValue placeholder="Etapa destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTargetStages.map((stage) => (
                                <SelectItem
                                  key={stage.id}
                                  value={String(stage.order)}
                                >
                                  {stage.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant={
                              !hasCondition && isStageSelected
                                ? "default"
                                : "ghost"
                            }
                            size="sm"
                            onClick={() => handleEditCondition(index)}
                            className={`h-7 px-2 ${
                              !hasCondition && isStageSelected
                                ? "bg-orange-600 hover:bg-orange-700 text-white"
                                : ""
                            }`}
                            title={
                              hasCondition
                                ? "Editar condição"
                                : "Definir condição (obrigatório)"
                            }
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTargetStage(index)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Remover movimentação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {!hasCondition && isStageSelected && (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 pl-2">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            Condição obrigatória
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {allowedTargetStages.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
                Nenhuma movimentação configurada. O agente não poderá mover
                negócios desta etapa.
              </div>
            )}
          </div>
        </CardContent>
      )}

      <MoveConditionModal
        open={editingCondition !== null}
        onOpenChange={(open) => !open && setEditingCondition(null)}
        condition={editingCondition?.condition || ""}
        targetStageName={editingCondition?.targetStageName || ""}
        onSave={handleSaveCondition}
      />
    </Card>
  );
};
