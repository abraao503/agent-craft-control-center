import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StageFormField } from "@/types/stage-form-field";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  CalendarClock,
  File,
} from "lucide-react";

interface EditFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: StageFormField | null;
  onUpdateField: (data: {
    label: string;
    description: string;
    isRequired: boolean;
  }) => void;
  isUpdating?: boolean;
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "short_text":
      return <Type className="h-5 w-5" />;
    case "long_text":
      return <AlignLeft className="h-5 w-5" />;
    case "email":
      return <Mail className="h-5 w-5" />;
    case "phone":
      return <Phone className="h-5 w-5" />;
    case "number":
      return <Hash className="h-5 w-5" />;
    case "date":
      return <Calendar className="h-5 w-5" />;
    case "datetime":
      return <CalendarClock className="h-5 w-5" />;
    case "cpf":
    case "cnpj":
      return <File className="h-5 w-5" />;
    default:
      return <Type className="h-5 w-5" />;
  }
};

const getFieldTypeLabel = (type: string) => {
  switch (type) {
    case "short_text":
      return "Texto Curto";
    case "long_text":
      return "Texto Longo";
    case "email":
      return "E-mail";
    case "phone":
      return "Telefone";
    case "number":
      return "Número";
    case "date":
      return "Data";
    case "datetime":
      return "Data e Hora";
    case "cpf":
      return "CPF";
    case "cnpj":
      return "CNPJ";
    default:
      return "";
  }
};

export const EditFieldModal: React.FC<EditFieldModalProps> = ({
  open,
  onOpenChange,
  field,
  onUpdateField,
  isUpdating,
}) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setDescription(field.description || "");
      setIsRequired(field.isRequired);
    }
  }, [field]);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onUpdateField({
      label: label.trim(),
      description: description.trim(),
      isRequired,
    });
  };

  if (!field) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            {getFieldTypeLabel(field.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do campo</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Orçamento do Cliente"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texto de Ajuda"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <label
              htmlFor="isRequired"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Este campo é obrigatório
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || isUpdating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isUpdating ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
