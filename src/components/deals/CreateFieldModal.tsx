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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldType, DocumentType } from "@/types/stage-form-field";
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

interface CreateFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldType: FieldType | "document" | null;
  onCreateField: (data: {
    name: string;
    label: string;
    description: string;
    isRequired: boolean;
    type: FieldType;
  }) => void;
  isCreating?: boolean;
}

const getFieldIcon = (type: FieldType | "document" | null) => {
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
    case "due_date":
      return <CalendarClock className="h-5 w-5" />;
    case "document":
    case "cpf":
    case "cnpj":
      return <File className="h-5 w-5" />;
    default:
      return <Type className="h-5 w-5" />;
  }
};

const getFieldTypeLabel = (type: FieldType | "document" | null) => {
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
    case "due_date":
      return "Data de Vencimento";
    case "document":
      return "Documento";
    case "cpf":
      return "CPF";
    case "cnpj":
      return "CNPJ";
    default:
      return "";
  }
};

export const CreateFieldModal: React.FC<CreateFieldModalProps> = ({
  open,
  onOpenChange,
  fieldType,
  onCreateField,
  isCreating,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("cnpj");

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setIsRequired(false);
      setDocumentType("cnpj");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    // If fieldType is "document", use the selected documentType as the actual type
    const actualType: FieldType = fieldType === "document" ? documentType : (fieldType as FieldType);
    
    onCreateField({
      name: name.trim().toLowerCase().replace(/\s+/g, "_"),
      label: name.trim(),
      description: description.trim(),
      isRequired,
      type: actualType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFieldIcon(fieldType)}
            {getFieldTypeLabel(fieldType)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do campo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Orçamento do Cliente"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texto de Ajuda"
              disabled={isCreating}
            />
          </div>

          {fieldType === "document" && (
            <div className="space-y-2">
              <Label>Tipo do documento</Label>
              <RadioGroup value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)} disabled={isCreating}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cpf" id="cpf" />
                  <label htmlFor="cpf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    CPF
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cnpj" id="cnpj" />
                  <label htmlFor="cnpj" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    CNPJ
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              disabled={isCreating}
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
            disabled={!name.trim() || isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? "Criando..." : "Criar campo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
