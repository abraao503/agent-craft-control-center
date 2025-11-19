import { useState } from "react";
import { AgentFormData, CustomField } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Database, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { removeAllSpacesAndSpecialChars } from "@/lib/utils";

interface CustomFieldsCardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

type CreateCustomField = Omit<CustomField, "id">;

export const CustomFieldsCard = ({
  formData,
  updateFormData,
}: CustomFieldsCardProps) => {
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
    <div className="space-y-6">
      {/* Adicionar Novo Campo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Adicionar Campo Personalizado</CardTitle>
              <CardDescription>
                Crie campos para coletar informações específicas dos clientes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Nome Interno</Label>
              <Input
                id="fieldName"
                placeholder="email, telefone, empresa..."
                value={newField.name}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    name: removeAllSpacesAndSpecialChars(e.target.value),
                  })
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Identificador único sem espaços ou caracteres especiais
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Rótulo para Exibição</Label>
              <Input
                id="fieldLabel"
                placeholder="E-mail, Telefone, Nome da Empresa..."
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nome amigável que aparece na interface
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldType">Tipo de Dado</Label>
              <Select
                value={newField.type}
                onValueChange={(value: "text" | "number" | "boolean") =>
                  setNewField({ ...newField, type: value })
                }
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-4 pt-8">
              <Label htmlFor="fieldIdentifier" className="cursor-pointer">
                Usar como identificador
              </Label>
              <Switch
                id="fieldIdentifier"
                checked={newField.isIdentifier}
                onCheckedChange={(checked) =>
                  setNewField({ ...newField, isIdentifier: checked })
                }
              />
            </div>
          </div>

          <Button
            onClick={addField}
            disabled={!newField.name || !newField.label}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Campos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Campos Configurados</CardTitle>
              <CardDescription>
                {formData.customFields.length}{" "}
                {formData.customFields.length === 1
                  ? "campo configurado"
                  : "campos configurados"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formData.customFields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum campo personalizado</p>
              <p className="text-sm mt-1">
                Adicione campos para coletar informações específicas dos
                clientes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.customFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="bg-background px-2 py-0.5 rounded text-sm font-mono font-medium">
                        {field.name}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                      {field.isIdentifier && (
                        <Badge variant="secondary" className="text-xs">
                          Identificador
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {field.label}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
