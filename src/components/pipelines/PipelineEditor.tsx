import React, { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PipelineStageMinimal } from "@/types/pipeline";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
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

export interface EditableStage extends PipelineStageMinimal {
  order: number;
  color?: string;
  winProbability?: number;
}

interface PipelineEditorProps {
  pipelineName: string;
  stages: PipelineStageMinimal[];
  onCancel: () => void;
  onSave: (args: {
    name: string;
    stages: EditableStage[];
  }) => Promise<void> | void;
  saveLabel?: string;
}

interface SortableStageProps {
  stage: EditableStage;
  index: number;
  onUpdate: (index: number, patch: Partial<EditableStage>) => void;
  onRemove: (index: number) => void;
}

const SortableStage: React.FC<SortableStageProps> = ({
  stage,
  index,
  onUpdate,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("min-w-[320px] w-[320px] max-w-[360px]")}
    >
      <Card className="flex flex-col bg-background/60 border-border h-[calc(100vh-350px)]">
        <CardHeader
          className="py-3 bg-muted/40 rounded-t-xl border-b border-border cursor-grab active:cursor-grabbing select-none"
          {...attributes}
          {...listeners}
        >
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{stage.name || "(Sem nome)"}</span>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 overflow-auto">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={stage.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Probabilidade: {stage.winProbability ?? 0}%</Label>
              <Slider
                value={[stage.winProbability ?? 0]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => onUpdate(index, { winProbability: v[0] })}
              />
            </div>
          </div>
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

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipelineName,
  stages,
  onCancel,
  onSave,
  saveLabel = "Salvar alterações",
}) => {
  const normalize = (arr: PipelineStageMinimal[]): EditableStage[] =>
    arr.map((s, idx) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      winProbability: s.winProbability ?? 0,
      order: idx,
    }));

  const [name, setName] = useState(pipelineName);
  const [draftStages, setDraftStages] = useState<EditableStage[]>(() =>
    normalize(stages)
  );
  const initialRef = useRef<{ name: string; stages: EditableStage[] }>({
    name: pipelineName,
    stages: normalize(stages),
  });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDraftStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((s, i) => ({ ...s, order: i }));
      });
    }
  };

  const setStage = (index: number, patch: Partial<EditableStage>) => {
    setDraftStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleRemove = (index: number) => {
    setDraftStages((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    );
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
      return [...prev, next];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        stages: draftStages.map((s, i) => ({ ...s, order: i })),
      });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    if (name.trim() !== (initial.name || "")) return true;
    if (draftStages.length !== initial.stages.length) return true;
    for (let i = 0; i < draftStages.length; i++) {
      const a = draftStages[i];
      const b = initial.stages[i];
      if (
        a.name !== b.name ||
        (a.color || "") !== (b.color || "") ||
        (a.winProbability || 0) !== (b.winProbability || 0) ||
        a.order !== b.order
      )
        return true;
    }
    return false;
  }, [name, draftStages]);

  const handleCancel = () => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-full max-w-md space-y-2">
          <Label>Nome do funil</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Funil Comercial"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : saveLabel}
          </Button>
        </div>
      </div>

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

      {/* Unsaved changes confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Há alterações não salvas. Se você continuar, suas mudanças serão
              perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PipelineEditor;
