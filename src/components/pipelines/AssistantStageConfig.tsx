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

    // Use -1 to indicate "not selected" instead of 0 (which is a valid stage order)
    const newTargetStage: AssistantAllowedTargetStage = {
      targetStageOrder: -1,
      moveCondition: "",
    };

    const updatedConfig: AssistantPipelineStage = {
      assistantAllowedTargetStages: [...allowedTargetStages, newTargetStage],
    };

    onConfigChange(stageId, updatedConfig);
  };

  const handleRemoveTargetStage = (index: number) => {
    if (!assistantConfig) return;

    const updatedTargetStages = allowedTargetStages.filter(
      (_, i) => i !== index
    );
    const updatedConfig: AssistantPipelineStage = {
      assistantAllowedTargetStages: updatedTargetStages,
    };
    onConfigChange(stageId, updatedConfig);
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

    const updatedConfig: AssistantPipelineStage = {
      assistantAllowedTargetStages: updatedTargetStages,
    };

    onConfigChange(stageId, updatedConfig);
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
    <Card className="mt-3 border-primary/20 shadow-sm">
      <CardHeader className="pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold">
              Automação do Agente
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Configure movimentações automáticas para esta etapa
            </p>
          </div>
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
              <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary"></span>
                Regras de Movimentação
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {allowedTargetStages.length}
                </Badge>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTargetStage}
                className="h-8 text-xs px-3 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova regra
              </Button>
            </div>

            {allowedTargetStages.length > 0 && (
              <div className="space-y-2.5">
                {allowedTargetStages.map((targetStage, index) => {
                  const hasCondition =
                    targetStage.moveCondition.trim().length > 0;
                  const isStageSelected = targetStage.targetStageOrder >= 0;

                  const foundStage = availableStages.find(
                    (s) => s.order === targetStage.targetStageOrder
                  );
                  const targetStageName = foundStage?.name || "Não encontrada";

                  const selectValue =
                    targetStage.targetStageOrder >= 0
                      ? String(targetStage.targetStageOrder)
                      : "";

                  return (
                    <div
                      key={`${stageId}-target-${index}-${targetStage.targetStageOrder}`}
                      className="space-y-1.5"
                    >
                      <div
                        className={`p-3 border rounded-lg transition-all ${
                          !hasCondition && isStageSelected
                            ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30 shadow-sm"
                            : "bg-muted/20 hover:bg-muted/40 border-border/60 hover:border-border"
                        }`}
                      >
                        {/* Linha do topo: Badge + Select + Botões */}
                        <div className="flex items-center gap-2.5 mb-0">
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0 h-5 px-1.5 bg-background"
                          >
                            #{index + 1}
                          </Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />

                          <div className="flex-1 min-w-0">
                            <Select
                              value={selectValue}
                              onValueChange={(value) =>
                                handleTargetStageChange(
                                  index,
                                  "targetStageOrder",
                                  Number(value)
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs border-0 bg-background/80 hover:bg-background shadow-sm font-medium w-full">
                                <SelectValue placeholder="Selecione a etapa destino" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTargetStages.map((stage) => (
                                  <SelectItem
                                    key={stage.id}
                                    value={String(stage.order)}
                                    className="text-xs"
                                  >
                                    {stage.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant={
                                !hasCondition && isStageSelected
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => handleEditCondition(index)}
                              className={`h-7 px-2.5 ${
                                !hasCondition && isStageSelected
                                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                                  : "hover:bg-muted"
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
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              title="Remover movimentação"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {!hasCondition && isStageSelected && (
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 pl-3">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            Defina a condição para ativar esta regra
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {allowedTargetStages.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Nenhuma regra configurada</p>
                    <p className="text-muted-foreground/70 mt-0.5">
                      O agente não poderá mover negócios desta etapa
                    </p>
                  </div>
                </div>
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
