import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PipelineEditorHeaderProps {
  isCreating: boolean;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PipelineEditorHeader({
  isCreating,
  onCancel,
  onSave,
  isSaving,
}: PipelineEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isCreating ? "Criar Funil" : "Editar Funil"}
        </h1>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isCreating ? "Criar" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
