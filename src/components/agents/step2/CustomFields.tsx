import { useState } from "react";
import { AgentFormData, CustomField } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { removeAllSpacesAndSpecialChars } from "@/lib/utils";

interface CustomFieldsProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

type CreateCustomField = Omit<CustomField, "id">;

const CustomFields = ({ formData, updateFormData }: CustomFieldsProps) => {
  const [newField, setNewField] = useState<CreateCustomField>({
    name: "",
    label: "",
    type: "text",
    required: true,
    isIdentifier: false,
  });

  const addField = () => {
    if (newField.name.trim() === "" || newField.label.trim() === "") return;
    const fieldName = removeAllSpacesAndSpecialChars(newField.name);
    const formattedNewField = {
      ...newField,
      name: fieldName,
    };

    const updatedFields = [...formData.customFields, { ...formattedNewField }];

    updateFormData({ customFields: updatedFields });

    setNewField({
      name: "",
      label: "",
      type: "text",
      required: true,
      isIdentifier: false,
    });
  };

  const removeField = (index: number) => {
    const updatedFields = [...formData.customFields];
    updatedFields.splice(index, 1);

    updateFormData({ customFields: updatedFields });
  };

  return (
    <div className="form-container">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Campos personalizados</h3>
        <p className="text-sm text-muted-foreground">
          Defina campos personalizados que seu agente coletará dos usuários durante as conversas.
        </p>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-4">Adicionar novo campo</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Nome interno</Label>
              <Input
                id="fieldName"
                placeholder="email"
                value={newField.name}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    name: removeAllSpacesAndSpecialChars(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Sem espaços, usado no seu código (ex.: "email")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Rótulo de exibição</Label>
              <Input
                id="fieldLabel"
                placeholder="Endereço de e-mail"
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                O que os usuários verão (ex.: "Endereço de e-mail")
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldType">Tipo de campo</Label>
              <Select
                value={newField.type}
                onValueChange={(value: "text" | "number" | "boolean") =>
                  setNewField({ ...newField, type: value })
                }
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Selecione o tipo de campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="boolean">Booleano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4 mt-8">
              <input
                type="checkbox"
                id="fieldIdentifier"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={newField.isIdentifier}
                onChange={(e) =>
                  setNewField({ ...newField, isIdentifier: e.target.checked })
                }
              />
              <Label htmlFor="fieldIdentifier">Campo de identificação</Label>
            </div>
          </div>

          <Button
            onClick={addField}
            disabled={!newField.name || !newField.label}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar campo
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-4">
          Campos personalizados ({formData.customFields.length})
        </h4>
        {formData.customFields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            Nenhum campo personalizado adicionado ainda
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Nome</th>
                  <th className="text-left p-3 text-sm font-medium">Rótulo</th>
                  <th className="text-left p-3 text-sm font-medium">Tipo</th>
                  <th className="text-left p-3 text-sm font-medium">
                    Identificador
                  </th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.customFields.map((field, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">
                      <code className="bg-muted/50 px-1 py-0.5 rounded text-sm">
                        {field.name}
                      </code>
                    </td>
                    <td className="p-3">{field.label}</td>
                    <td className="p-3">
                      <Badge variant="outline">{field.type}</Badge>
                    </td>
                    <td className="p-3">
                      {field.isIdentifier ? "Sim" : "Não"}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFields;
