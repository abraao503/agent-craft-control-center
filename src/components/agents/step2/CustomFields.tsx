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
        <h3 className="text-lg font-medium mb-2">Custom Fields</h3>
        <p className="text-sm text-muted-foreground">
          Define custom fields that your agent will collect from users during
          conversations.
        </p>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-4">Add New Field</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Internal Name</Label>
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
                No spaces, used in your code (e.g., "email")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Display Label</Label>
              <Input
                id="fieldLabel"
                placeholder="Email Address"
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                What users will see (e.g., "Email Address")
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={newField.type}
                onValueChange={(value: "text" | "number" | "boolean") =>
                  setNewField({ ...newField, type: value })
                }
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
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
            Add Field
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-4">
          Custom Fields ({formData.customFields.length})
        </h4>
        {formData.customFields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
            No custom fields added yet
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Name</th>
                  <th className="text-left p-3 text-sm font-medium">Label</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">
                    Identifier
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
                        <span className="sr-only">Remove</span>
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
