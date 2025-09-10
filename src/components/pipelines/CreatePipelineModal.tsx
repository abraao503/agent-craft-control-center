import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { createPipeline } from "@/services/pipeline/createPipeline";
import { CreatePipelineInput, CreatePipelineStageInput } from "@/types/pipeline";

interface CreatePipelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onCreated?: (pipelineId: string) => void;
}

type StageForm = CreatePipelineStageInput;

const defaultStage = (order: number): StageForm => ({
  name: "",
  description: "",
  order,
  color: "#64748b", // slate-500
  winProbability: 0,
  isWonStage: false,
  isLostStage: false,
});

export const CreatePipelineModal: React.FC<CreatePipelineModalProps> = ({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageForm[]>([defaultStage(0)]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStage = () => {
    setStages((prev) => [...prev, defaultStage(prev.length)]);
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, patch: Partial<StageForm>) => {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (stages.length < 1) return "At least one stage is required";

    // Unique orders
    const orders = stages.map((s) => s.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) return "Stages must have unique order values";

    // At least one won and one lost stage
    if (!stages.some((s) => s.isWonStage)) return "You must mark at least one stage as Won";
    if (!stages.some((s) => s.isLostStage)) return "You must mark at least one stage as Lost";

    // Basic color and probability checks
    for (const s of stages) {
      if (s.order < 0) return "Order must be a non-negative integer";
      if (s.winProbability < 0 || s.winProbability > 100)
        return "Win probability must be between 0 and 100";
      if (!/^#([0-9a-fA-F]{6})$/.test(s.color))
        return "Color must be a 6-digit hex value (e.g. #FF0000)";
    }

    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const payload: CreatePipelineInput = {
      workspaceId,
      name: name.trim(),
      description: description?.trim() || undefined,
      stages: stages.map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || undefined,
        order: Number(s.order),
        color: s.color,
        winProbability: Number(s.winProbability),
        isWonStage: !!s.isWonStage,
        isLostStage: !!s.isLostStage,
      })),
    };

    try {
      setSubmitting(true);
      const res = await createPipeline(payload);
      onCreated?.(res.id);
      onOpenChange(false);
      // reset
      setName("");
      setDescription("");
      setStages([defaultStage(0)]);
    } catch (e) {
      setError("Failed to create pipeline. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Pipeline</DialogTitle>
          <DialogDescription>
            Configure o pipeline e suas etapas. Defina ao menos uma etapa de vitória e uma de perda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do pipeline" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Etapas</Label>
              <Button size="sm" onClick={addStage} variant="outline">Adicionar etapa</Button>
            </div>

            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={index} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Etapa #{index + 1}</div>
                    {stages.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeStage(index)}>Remover</Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={stage.name} onChange={(e) => updateStage(index, { name: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Ordem</Label>
                      <Input type="number" min={0} value={stage.order} onChange={(e) => updateStage(index, { order: Number(e.target.value) })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Cor (hex)</Label>
                      <Input value={stage.color} onChange={(e) => updateStage(index, { color: e.target.value })} placeholder="#4F46E5" />
                    </div>

                    <div className="space-y-2">
                      <Label>Probabilidade de ganho: {stage.winProbability}%</Label>
                      <Slider value={[stage.winProbability]} min={0} max={100} step={1} onValueChange={(v) => updateStage(index, { winProbability: v[0] })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={stage.description} onChange={(e) => updateStage(index, { description: e.target.value })} />
                    </div>
                    <div className="flex gap-6 items-center mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={stage.isWonStage} onCheckedChange={(v) => updateStage(index, { isWonStage: !!v })} id={`won_${index}`} />
                        <Label htmlFor={`won_${index}`}>Vitória</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={stage.isLostStage} onCheckedChange={(v) => updateStage(index, { isLostStage: !!v })} id={`lost_${index}`} />
                        <Label htmlFor={`lost_${index}`}>Perda</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Criando..." : "Criar Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePipelineModal;
