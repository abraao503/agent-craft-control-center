import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  FileText,
  Calendar,
  CalendarClock,
  Hash,
} from "lucide-react";
import { FieldType } from "@/types/stage-form-field";

interface SelectFieldTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: FieldType) => void;
}

const fieldTypes: Array<{ type: FieldType; label: string; icon: React.ReactNode }> = [
  { type: "short_text", label: "Texto Curto", icon: <Type className="h-5 w-5" /> },
  { type: "long_text", label: "Texto Longo", icon: <AlignLeft className="h-5 w-5" /> },
  { type: "email", label: "E-mail", icon: <Mail className="h-5 w-5" /> },
  { type: "phone", label: "Telefone", icon: <Phone className="h-5 w-5" /> },
  { type: "number", label: "Número", icon: <Hash className="h-5 w-5" /> },
  { type: "date", label: "Data", icon: <Calendar className="h-5 w-5" /> },
  { type: "datetime", label: "Data e Hora", icon: <CalendarClock className="h-5 w-5" /> },
];

export const SelectFieldTypeModal: React.FC<SelectFieldTypeModalProps> = ({
  open,
  onOpenChange,
  onSelectType,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Selecione um tipo de campo!</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {fieldTypes.map((field) => (
            <Button
              key={field.type}
              variant="outline"
              className="h-auto py-4 justify-start gap-3"
              onClick={() => {
                onSelectType(field.type);
                onOpenChange(false);
              }}
            >
              {field.icon}
              <span>{field.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
