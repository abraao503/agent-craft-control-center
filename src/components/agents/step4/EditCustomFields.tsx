import { useState } from "react";
import {
  AgentFormData,
  CustomField,
  UpdateAssistantCustomField,
} from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditCustomFieldsProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  setCustomFieldsToUpdate: React.Dispatch<
    React.SetStateAction<UpdateAssistantCustomField[]>
  >;
}

type CreateCustomField = Omit<CustomField, "id">;

const EditCustomFields = ({
  formData,
  updateFormData,
  setCustomFieldsToUpdate,
}: EditCustomFieldsProps) => {
  const [newField, setNewField] = useState<CreateCustomField>({
    name: "",
    label: "",
    type: "text",
    required: false,
  });

  const addField = () => {
    if (newField.name.trim() === "" || newField.label.trim() === "") return;

    const updatedFields = [...formData.customFields, { ...newField }];

    updateFormData({ customFields: updatedFields });

    setCustomFieldsToUpdate((prev) => {
      const fieldIndex = prev.findIndex(
        (field) => field.fieldName === newField.name
      );

      if (fieldIndex !== -1) {
        prev[fieldIndex] = {
          action: "createOrUpdate",
          fieldName: newField.name,
          field: { ...newField },
        };

        return prev;
      } else {
        return [
          ...prev,
          {
            action: "createOrUpdate",
            fieldName: newField.name,
            field: { ...newField },
          },
        ];
      }
    });

    setNewField({
      name: "",
      label: "",
      type: "text",
      required: false,
    });
  };

  const removeField = (index: number) => {
    const fieldToRemove = formData.customFields[index];

    const updatedFields = [...formData.customFields];
    updatedFields.splice(index, 1);

    updateFormData({ customFields: updatedFields });

    setCustomFieldsToUpdate((prev) => {
      const fieldIndex = prev.findIndex(
        (field) => field.fieldName === newField.name
      );

      if (fieldIndex !== -1) {
        prev[fieldIndex] = {
          action: "delete",
          fieldName: fieldToRemove.name,
        };

        return prev;
      } else {
        return [
          ...prev,
          {
            action: "delete",
            fieldName: fieldToRemove.name,
          },
        ];
      }
    });
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
                  setNewField({ ...newField, name: e.target.value })
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
              <Switch
                id="fieldRequired"
                checked={newField.required}
                onCheckedChange={(checked) =>
                  setNewField({ ...newField, required: checked })
                }
              />
              <Label htmlFor="fieldRequired">Required field</Label>
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
                    Required
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
                      {field.required ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
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

export default EditCustomFields;
