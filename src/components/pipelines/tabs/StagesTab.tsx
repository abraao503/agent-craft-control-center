import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PipelineStageMinimal,
  AssistantPipelineStage,
  ReengagementConfig,
} from "@/types/pipeline";
import { Agent } from "@/types/agent";
import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import { GripVertical, Pencil, Check, X } from "lucide-react";
import { AssistantStageConfig } from "../AssistantStageConfig";
import { ReengagementConfigSection } from "../ReengagementConfigSection";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

export interface EditableStage extends Omit<
  PipelineStageMinimal,
  "reengagementConfig"
> {
  order: number;
  color?: string;
  winProbability?: number;
  assistantPipelineStage?: AssistantPipelineStage;
  reengagementConfig?: ReengagementConfig | null;
}

interface StagesTabProps {
  pipelineName: string;
  stages: PipelineStageMinimal[];
  availableAgents?: Agent[];
  selectedAssistantId?: string;
  availableWhatsAppIntegrations?: CompanyWhatsAppIntegration[];
  companyWhatsappIntegrationId?: string | null;
  pipelineId?: string;
  isMetaCloud?: boolean;
  assistantEnabled?: boolean;
  assistantConfigured?: boolean; // Indica se o agente foi configurado (tem campos obrigatórios)
  assistantLoading?: boolean; // Indica se o agente está sendo carregado
  workspaceId?: string; // Required for ReengagementConfigSection
  focusStageId?: string;
  focusRuleIndex?: number;
  onSave: (args: { stages: EditableStage[] }) => Promise<void> | void;
  onCancel: () => void;
  saveLabel?: string;
}

interface SortableStageProps {
  stage: EditableStage;
  index: number;
  onUpdate: (index: number, patch: Partial<EditableStage>) => void;
  onRemove: (index: number) => void;
  assistantEnabled: boolean;
  assistantConfigured: boolean; // Indica se o agente foi configurado
  assistantLoading: boolean; // Indica se o agente está sendo carregado
  allStages: EditableStage[];
  workspaceId?: string; // Required for ReengagementConfigSection
  pipelineId?: string;
  isMetaCloud: boolean;
  focusStageId?: string;
  focusRuleIndex?: number;
}

const SortableStage: React.FC<SortableStageProps> = ({
  stage,
  index,
  onUpdate,
  onRemove,
  assistantEnabled,
  assistantConfigured,
  assistantLoading,
  allStages,
  workspaceId,
  pipelineId,
  isMetaCloud,
  focusStageId,
  focusRuleIndex,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(stage.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdate(index, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(stage.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`pipeline-stage-${stage.id}`}
      className={cn("min-w-[320px] w-[320px] max-w-[360px]")}
    >
      <Card
        className="flex flex-col bg-background/60 border-border h-[calc(100vh-350px)] overflow-hidden"
        style={
          stage.color ? { borderTop: `3px solid ${stage.color}` } : undefined
        }
      >
        <CardHeader className="py-3 bg-muted/40 border-b border-border">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm"
                  autoFocus
                  onBlur={handleSaveName}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleSaveName}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 group">
                <span className="flex-1">{stage.name || "(Sem nome)"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div
              className="cursor-grab active:cursor-grabbing select-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 overflow-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2.5 py-1.5">
              <Label className="text-xs font-medium">Cor</Label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="color"
                  value={stage.color || "#64748b"}
                  onChange={(e) => onUpdate(index, { color: e.target.value })}
                  aria-label="Cor da etapa"
                  className="h-5 w-5 cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {stage.color || "#64748b"}
                </span>
              </label>
            </div>
          </div>

          {assistantEnabled && assistantLoading && (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {assistantEnabled && !assistantLoading && assistantConfigured && (
            <div className="mt-4">
              <AssistantStageConfig
                stageId={stage.id}
                stageName={stage.name}
                stageOrder={stage.order}
                assistantConfig={stage.assistantPipelineStage}
                availableStages={allStages.map((s) => ({
                  id: s.id,
                  name: s.name,
                  order: s.order,
                }))}
                focusRuleIndex={
                  focusStageId === stage.id ? focusRuleIndex : undefined
                }
                onConfigChange={(stageId, config) => {
                  onUpdate(index, {
                    assistantPipelineStage: config ?? undefined,
                  });
                }}
              />
            </div>
          )}

          {assistantEnabled && !assistantLoading && !assistantConfigured && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-xs text-muted-foreground">
                Configure o agente na aba "Agente" para habilitar automações
                nesta etapa
              </p>
            </div>
          )}

          {/* Follow-up Configuration */}
          {workspaceId && (
            <div className="mt-3">
              <ReengagementConfigSection
                workspaceId={workspaceId}
                pipelineId={pipelineId}
                isMetaCloud={isMetaCloud}
                config={stage.reengagementConfig ?? null}
                onChange={(config) => {
                  onUpdate(index, {
                    reengagementConfig: config
                      ? {
                          ...config,
                          includeTags: config.includeTags ?? [],
                          excludeTags: config.excludeTags ?? [],
                          isActive: config.isActive ?? true,
                        }
                      : null,
                  });
                }}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-destructive hover:underline"
              onClick={() => onRemove(index)}
            >
              Excluir etapa
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export const StagesTab: React.FC<StagesTabProps> = ({
  pipelineName,
  stages,
  availableAgents = [],
  selectedAssistantId,
  availableWhatsAppIntegrations = [],
  companyWhatsappIntegrationId,
  pipelineId,
  isMetaCloud: metaCloudSelected = false,
  assistantEnabled = false,
  assistantConfigured = false,
  assistantLoading = false,
  workspaceId,
  focusStageId,
  focusRuleIndex,
  onSave,
  onCancel,
  saveLabel = "Aplicar",
}) => {
  const normalize = (arr: PipelineStageMinimal[]): EditableStage[] => {
    const result = arr.map((s, idx) => {
      const order = s.order ?? idx;

      // Convert assistantPipelineStage: targetStageId -> targetStageOrder
      let assistantPipelineStage = s.assistantPipelineStage;
      if (assistantPipelineStage?.assistantAllowedTargetStages) {
        assistantPipelineStage = {
          assistantAllowedTargetStages:
            assistantPipelineStage.assistantAllowedTargetStages.map(
              (target) => {
                // Find the order of the target stage by its ID
                const targetStageIndex = arr.findIndex(
                  (stage) => stage.id === target.targetStageId,
                );
                const targetStageOrder =
                  targetStageIndex !== -1 ? targetStageIndex : -1;

                return {
                  ...target,
                  targetStageOrder,
                };
              },
            ),
        };
      }

      return {
        id: s.id,
        name: s.name,
        color: s.color,
        winProbability: s.winProbability ?? 0,
        order,
        assistantPipelineStage: assistantPipelineStage ?? undefined,
        reengagementConfig: s.reengagementConfig
          ? {
              ...s.reengagementConfig,
              includeTags: s.reengagementConfig.includeTags || [],
              excludeTags: s.reengagementConfig.excludeTags || [],
              isActive: s.reengagementConfig.isActive ?? true,
            }
          : undefined,
      };
    });

    return result;
  };

  const isMetaCloud = metaCloudSelected || availableWhatsAppIntegrations.some(
    (integration) =>
      integration.id === companyWhatsappIntegrationId &&
      integration.whatsappIntegrationName === "meta-cloud",
  );

  const [draftStages, setDraftStages] = useState<EditableStage[]>(() =>
    normalize(stages),
  );

  // Update draftStages when stages prop changes
  useEffect(() => {
    setDraftStages(normalize(stages));
  }, [stages]);

  useEffect(() => {
    if (!focusStageId) return;

    document
      .getElementById(`pipeline-stage-${focusStageId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focusStageId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const syncTargets = (items: EditableStage[]): EditableStage[] => {
    return items.map((s, idx) => {
      let assistantPipelineStage = s.assistantPipelineStage;
      if (assistantPipelineStage?.assistantAllowedTargetStages) {
        assistantPipelineStage = {
          ...assistantPipelineStage,
          assistantAllowedTargetStages:
            assistantPipelineStage.assistantAllowedTargetStages.map(
              (target) => {
                if (!target.targetStageId) return target;

                const targetStageIndex = items.findIndex(
                  (stage) => stage.id === target.targetStageId,
                );

                return {
                  ...target,
                  targetStageOrder:
                    targetStageIndex !== -1 ? targetStageIndex : -1,
                };
              },
            ),
        };
      }
      return {
        ...s,
        order: idx,
        assistantPipelineStage,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDraftStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        const updated = syncTargets(newItems);

        // Sync changes to parent immediately
        onSave({ stages: updated });

        return updated;
      });
    }
  };

  const setStage = (index: number, patch: Partial<EditableStage>) => {
    setDraftStages((prev) => {
      const newItems = prev.map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      );
      const updated = syncTargets(newItems);

      // Sync changes to parent immediately
      onSave({ stages: updated });
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    setDraftStages((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      const updated = syncTargets(newItems);

      // Sync changes to parent immediately
      onSave({ stages: updated });
      return updated;
    });
  };

  const handleAdd = () => {
    setDraftStages((prev) => {
      const next: EditableStage = {
        id: `tmp-${Date.now()}`,
        name: "Nova etapa",
        color: "#64748b",
        winProbability: 100,
        order: prev.length,
      };
      const updated = syncTargets([...prev, next]);
      // Sync changes to parent immediately
      onSave({ stages: updated });
      return updated;
    });
  };

  const handleApply = async () => {
    await onSave({
      stages: syncTargets(draftStages),
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-4 h-[calc(100vh-320px)] w-max pr-2">
            <SortableContext
              items={draftStages.map((stage) => stage.id)}
              strategy={horizontalListSortingStrategy}
            >
              {draftStages.map((stage, index) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onUpdate={setStage}
                  onRemove={handleRemove}
                  assistantEnabled={assistantEnabled}
                  assistantConfigured={assistantConfigured}
                  assistantLoading={assistantLoading}
                  allStages={draftStages}
                  workspaceId={workspaceId}
                  pipelineId={pipelineId}
                  isMetaCloud={isMetaCloud}
                  focusStageId={focusStageId}
                  focusRuleIndex={focusRuleIndex}
                />
              ))}
            </SortableContext>
            {/* Add stage panel */}
            <div className="min-w-[220px] w-[220px]">
              <div className="h-full flex items-start pt-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="border rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  + Nova etapa
                </button>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
};
