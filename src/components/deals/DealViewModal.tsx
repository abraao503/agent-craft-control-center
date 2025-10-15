import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Save,
  Trash2,
  History,
  GripVertical,
  MoreVertical,
  Edit2,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DealListItem, DealNote } from "@/types/deal";
import {
  StageFormField,
  FieldType,
  DocumentType,
} from "@/types/stage-form-field";
import { getDealById } from "@/services/deal/getDealById";
import { getDealFormFields } from "@/services/deal/getDealFormFields";
import { saveDealFormValues } from "@/services/deal/saveDealFormValues";
import { getStageFormFieldHistory } from "@/services/stage-form-field/getStageFormFieldHistory";
import { listStageFormFields } from "@/services/stage-form-field/listStageFormFields";
import { createStageFormField } from "@/services/stage-form-field/createStageFormField";
import { deleteStageFormField } from "@/services/stage-form-field/deleteStageFormField";
import { getDealNotes } from "@/services/deal/getDealNotes";
import { createDealNote } from "@/services/deal/createDealNote";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SelectFieldTypeModal } from "./SelectFieldTypeModal";
import { CreateFieldModal } from "./CreateFieldModal";
import { EditFieldModal } from "./EditFieldModal";
import { DealTagsSelector } from "./DealTagsSelector";
import { updateStageFormField } from "@/services/stage-form-field/updateStageFormField";
import { updateDeal } from "@/services/deal/updateDeal";
import { updateDealTags } from "@/services/deal/updateDealTags";
import { listTags } from "@/services/tag/listTags";
import {
  formatCPF,
  formatCNPJ,
  isValidCPF,
  isValidCNPJ,
} from "@brazilian-utils/brazilian-utils";
import { AxiosError } from "axios";

interface DealViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealListItem | null;
  workspaceId: string;
}

export const DealViewModal: React.FC<DealViewModalProps> = ({
  open,
  onOpenChange,
  deal,
  workspaceId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showSelectTypeModal, setShowSelectTypeModal] = useState(false);
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<
    FieldType | "document" | null
  >(null);
  const [editingField, setEditingField] = useState<StageFormField | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Editable deal fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Track which field is being saved
  const [savingField, setSavingField] = useState<string | null>(null);

  // Track fields that have been modified locally to prevent overwriting during API updates
  // Using ref to avoid triggering useEffect when modified fields change
  const modifiedFieldsRef = useRef<Set<string>>(new Set());

  // Tags management
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Fetch deal details
  const { data: dealDetails, isLoading: dealDetailsLoading } = useQuery({
    queryKey: ["getDealById", deal?.id],
    queryFn: () => getDealById(deal!.id),
    enabled: open && !!deal?.id,
  });

  // Fetch current stage form fields with values
  const { data: currentFields = [], isLoading: currentFieldsLoading } =
    useQuery({
      queryKey: ["getDealFormFields", deal?.id],
      queryFn: () => getDealFormFields(deal!.id),
      enabled: open && !!deal?.id,
    });

  // Fetch stage form field history
  const { data: fieldHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["getStageFormFieldHistory", deal?.id, deal?.stageId],
    queryFn: () => getStageFormFieldHistory(deal!.id, deal!.stageId),
    enabled: open && !!deal?.id && !!deal?.stageId,
  });

  // Fetch all fields for current stage (for adding new fields)
  const { data: stageFields = [], isLoading: stageFieldsLoading } = useQuery({
    queryKey: ["listStageFormFields", deal?.stageId],
    queryFn: () => listStageFormFields(deal!.stageId),
    enabled: open && !!deal?.stageId,
  });

  // Fetch deal notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["getDealNotes", deal?.id],
    queryFn: () => getDealNotes(deal!.id, { limit: 50, offset: 0 }),
    enabled: open && !!deal?.id,
  });

  // Fetch tags
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Initialize field values
  useEffect(() => {
    if (currentFields.length > 0) {
      setFieldValues((prevValues) => {
        const values: Record<string, string> = {};
        currentFields.forEach((field) => {
          // Only update from API if field hasn't been modified locally
          if (modifiedFieldsRef.current.has(field.id)) {
            values[field.id] = prevValues[field.id] || "";
          } else {
            values[field.id] = field.value || "";
          }
        });
        return values;
      });
    }
  }, [currentFields]);

  // Initialize deal fields
  useEffect(() => {
    if (dealDetails) {
      setTitle(dealDetails.title || "");
      setDescription(dealDetails.description || "");
      setValue(dealDetails.value?.toString() || "");
      setCustomerName(dealDetails.customer?.name || "");
      setSelectedTagIds(dealDetails.tags || []);
    }
  }, [dealDetails]);

  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      description?: string;
      value?: number;
      customerName?: string;
      fieldName?: string;
    }) => {
      if (!deal) return;
      await updateDeal(deal.id, workspaceId, {
        title: data.title?.trim() || undefined,
        description: data.description?.trim() || undefined,
        value: data.value,
        customer: data.customerName?.trim()
          ? { name: data.customerName.trim() }
          : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      setSavingField(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar negócio.",
        variant: "destructive",
      });
      setSavingField(null);
    },
  });

  // Save field values mutation
  const saveFieldValuesMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return;
      const values = Object.entries(fieldValues).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      await saveDealFormValues(deal.id, { values });
    },
    onSuccess: () => {
      // Clear modified fields after successful save
      if (savingField) {
        modifiedFieldsRef.current.delete(savingField);
      }
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      setSavingField(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar campos.",
        variant: "destructive",
      });
      setSavingField(null);
    },
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      label: string;
      description: string;
      type: FieldType;
      isRequired: boolean;
    }) => {
      if (!deal) return;
      await createStageFormField({
        ...data,
        stageId: deal.stageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      setShowCreateFieldModal(false);
      setSelectedFieldType(null);
      toast({ title: "Sucesso", description: "Campo criado com sucesso." });
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        if (
          error?.response?.data?.message ===
          "Field with this name already exists in stage"
        ) {
          toast({
            title: "Erro",
            description:
              "Este nome de campo já existe. Por favor, escolha outro nome.",
            variant: "destructive",
          });

          return;
        }
      }

      toast({
        title: "Erro",
        description: "Falha ao criar campo.",
        variant: "destructive",
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: {
      fieldId: string;
      label: string;
      description: string;
      isRequired: boolean;
    }) => {
      const { fieldId, ...updateData } = data;
      await updateStageFormField(fieldId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      setShowEditFieldModal(false);
      setEditingField(null);
      toast({ title: "Sucesso", description: "Campo atualizado com sucesso." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar campo.",
        variant: "destructive",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      await deleteStageFormField(fieldId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listStageFormFields", deal?.stageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getDealFormFields", deal?.id],
      });
      toast({ title: "Sucesso", description: "Campo removido com sucesso." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover campo.",
        variant: "destructive",
      });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!deal || !newNoteContent.trim()) return;
      await createDealNote({
        dealId: deal.id,
        content: newNoteContent.trim(),
      });
    },
    onSuccess: () => {
      setNewNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["getDealNotes", deal?.id] });
      toast({ title: "Sucesso", description: "Nota adicionada." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar nota.",
        variant: "destructive",
      });
    },
  });

  // Update tags mutation
  const updateTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      if (!deal) return;
      await updateDealTags(deal.id, workspaceId, { tagIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDealById", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["listDealsByPipeline"] });
      toast({ title: "Sucesso", description: "Tags atualizadas." });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar tags.",
        variant: "destructive",
      });
    },
  });

  const handleFieldValueChange = (
    fieldId: string,
    value: string,
    fieldType?: FieldType
  ) => {
    // Mark field as modified
    modifiedFieldsRef.current.add(fieldId);

    // Clear error when user starts typing
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });

    // Format CPF/CNPJ as user types
    let formattedValue = value;
    if (fieldType === "cpf") {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 11) {
        try {
          formattedValue = formatCPF(numericValue);
        } catch {
          formattedValue = numericValue;
        }
      }
    } else if (fieldType === "cnpj") {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 14) {
        try {
          formattedValue = formatCNPJ(numericValue);
        } catch {
          formattedValue = numericValue;
        }
      }
    }

    setFieldValues((prev) => ({ ...prev, [fieldId]: formattedValue }));
  };

  const handleSaveFields = () => {
    saveFieldValuesMutation.mutate();
  };

  const handleFieldBlur = (fieldId: string, fieldType?: FieldType) => {
    // Save field value when input loses focus
    const currentValue = fieldValues[fieldId];
    const originalField = currentFields.find((f) => f.id === fieldId);
    const originalValue = originalField?.value || "";

    // Validate CPF/CNPJ on blur
    if (currentValue && currentValue.trim()) {
      if (fieldType === "cpf") {
        const numericValue = currentValue.replace(/\D/g, "");
        if (numericValue && !isValidCPF(numericValue)) {
          setFieldErrors((prev) => ({
            ...prev,
            [fieldId]: "CPF inválido",
          }));
          return;
        }
      } else if (fieldType === "cnpj") {
        const numericValue = currentValue.replace(/\D/g, "");
        if (numericValue && !isValidCNPJ(numericValue)) {
          setFieldErrors((prev) => ({
            ...prev,
            [fieldId]: "CNPJ inválido",
          }));
          return;
        }
      }
    }

    // Only save if value actually changed
    if (currentValue !== undefined && currentValue !== originalValue) {
      setSavingField(fieldId);
      saveFieldValuesMutation.mutate();
    } else {
      // Remove from modified fields if value hasn't changed
      modifiedFieldsRef.current.delete(fieldId);
    }
  };

  const handleTitleBlur = () => {
    if (title !== dealDetails?.title) {
      setSavingField("title");
      updateDealMutation.mutate({ title, fieldName: "title" });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== dealDetails?.description) {
      setSavingField("description");
      updateDealMutation.mutate({ description, fieldName: "description" });
    }
  };

  const handleValueBlur = () => {
    const numValue = value ? Number(value) : undefined;
    if (numValue !== dealDetails?.value) {
      setSavingField("value");
      updateDealMutation.mutate({ value: numValue, fieldName: "value" });
    }
  };

  const handleCustomerNameBlur = () => {
    if (customerName !== dealDetails?.customer?.name) {
      setSavingField("customerName");
      updateDealMutation.mutate({ customerName, fieldName: "customerName" });
    }
  };

  const handleSelectFieldType = (type: FieldType | "document") => {
    setSelectedFieldType(type);
    setShowCreateFieldModal(true);
  };

  const handleCreateField = (data: {
    name: string;
    label: string;
    description: string;
    isRequired: boolean;
    type: FieldType;
  }) => {
    createFieldMutation.mutate(data);
  };

  const handleEditField = (field: StageFormField) => {
    setEditingField(field);
    setShowEditFieldModal(true);
  };

  const handleUpdateField = (data: {
    label: string;
    description: string;
    isRequired: boolean;
  }) => {
    if (!editingField) return;
    updateFieldMutation.mutate({
      fieldId: editingField.id,
      ...data,
    });
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Tem certeza que deseja remover este campo?")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  const handleAddNote = () => {
    createNoteMutation.mutate();
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
  };

  const handleCloseModal = (isOpen: boolean) => {
    if (!isOpen) {
      // Save any pending changes before closing
      // Check if any deal field was modified
      if (title !== dealDetails?.title) {
        updateDealMutation.mutate({ title });
      }
      if (description !== dealDetails?.description) {
        updateDealMutation.mutate({ description });
      }
      if (value && Number(value) !== dealDetails?.value) {
        updateDealMutation.mutate({ value: Number(value) });
      }
      if (customerName !== dealDetails?.customer?.name) {
        updateDealMutation.mutate({ customerName });
      }

      // Check if any custom field was modified
      const hasModifiedFields = currentFields.some((field) => {
        const currentValue = fieldValues[field.id] || "";
        const originalValue = field.value || "";
        return currentValue !== originalValue;
      });

      if (hasModifiedFields) {
        saveFieldValuesMutation.mutate();
      }
    }
    onOpenChange(isOpen);
  };

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "short_text":
        return "I";
      case "long_text":
        return "≡";
      case "email":
        return "@";
      case "phone":
        return "📞";
      case "number":
        return "#";
      case "date":
        return "📅";
      case "datetime":
        return "🕐";
      case "cpf":
      case "cnpj":
        return "📄";
      default:
        return "I";
    }
  };

  const renderFieldInput = (field: StageFormField) => {
    const value = fieldValues[field.id] || "";

    switch (field.type) {
      case "short_text":
      case "email":
      case "phone":
        return (
          <Input
            type={
              field.type === "email"
                ? "email"
                : field.type === "phone"
                ? "tel"
                : "text"
            }
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
      case "long_text":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
            rows={3}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
          />
        );
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
          />
        );
      case "cpf":
      case "cnpj": {
        const hasError = fieldErrors[field.id];
        return (
          <div className="space-y-1">
            <Input
              type="text"
              value={value}
              onChange={(e) =>
                handleFieldValueChange(field.id, e.target.value, field.type)
              }
              onBlur={() => handleFieldBlur(field.id, field.type)}
              placeholder={field.description || field.label}
              className={hasError ? "border-red-500" : ""}
              maxLength={field.type === "cpf" ? 14 : 18}
            />
            {hasError && <p className="text-xs text-red-500">{hasError}</p>}
          </div>
        );
      }
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            onBlur={() => handleFieldBlur(field.id)}
            placeholder={field.description || field.label}
          />
        );
    }
  };

  if (!deal) return null;

  const isLoading = dealDetailsLoading || currentFieldsLoading;

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <div className="grid grid-cols-[1fr,400px] h-full">
          {/* Left Column - Deal Details */}
          <div className="border-r">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-2xl">
                {dealDetails?.title || deal.title}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-[calc(90vh-100px)] px-6">
              {isLoading ? (
                <div className="space-y-4 pb-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4 pb-6 px-1">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Nome do contato principal
                      {savingField === "customerName" && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onBlur={handleCustomerNameBlur}
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>E-mail principal</Label>
                      <Input placeholder="Inserir e-mail" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone principal</Label>
                      <Input
                        value={dealDetails?.customer?.phone || ""}
                        disabled
                        placeholder="Telefone"
                      />
                    </div>
                  </div>

                  {/* Deal Details */}
                  <div className="border-t pt-4 mt-4 px-1">
                    <h3 className="font-semibold mb-3">Detalhes do negócio</h3>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Nome do negócio
                          {savingField === "title" && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onBlur={handleTitleBlur}
                          placeholder="Nome do negócio"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Pipeline</Label>
                          <Input disabled value="Pipeline atual" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fase</Label>
                          <Input
                            disabled
                            value={
                              dealDetails?.currentStage?.name || "Fase atual"
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Valor do negócio
                            {savingField === "value" && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </Label>
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onBlur={handleValueBlur}
                            placeholder="R$ 0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Moeda</Label>
                          <Input
                            value={dealDetails?.currency || "BRL"}
                            disabled
                            maxLength={3}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Descrição
                          {savingField === "description" && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          onBlur={handleDescriptionBlur}
                          placeholder="Descrição do negócio"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="border-t pt-4 mt-4 px-1">
                    <h3 className="font-semibold mb-3">Tags</h3>

                    <div className="space-y-2">
                      <DealTagsSelector
                        allTags={allTags}
                        selectedTagIds={selectedTagIds}
                        onTagsChange={handleTagsChange}
                        onSave={(tagIds) => updateTagsMutation.mutate(tagIds)}
                        isLoading={updateTagsMutation.isPending}
                      />
                    </div>
                  </div>

                  {/* Stage History */}
                  {historyLoading ? (
                    <div className="border-t pt-4 mt-4 px-1">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Histórico de Etapas
                      </h3>
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="border rounded-lg overflow-hidden border-l-4"
                          >
                            <div className="p-3 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : fieldHistory.length > 0 ? (
                    <div className="border-t pt-4 mt-4 px-1">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Histórico de Etapas
                      </h3>
                      <div className="space-y-2">
                        {fieldHistory.map((stage) => {
                          const isExpanded = expandedStages.has(stage.stageId);
                          const stageColor =
                            stage.stageOrder === 1 ? "#f59e0b" : "#ef4444";

                          return (
                            <div
                              key={stage.stageId}
                              className="border rounded-lg overflow-hidden"
                              style={{
                                borderLeftWidth: "4px",
                                borderLeftColor: stageColor,
                              }}
                            >
                              <button
                                onClick={() =>
                                  toggleStageExpansion(stage.stageId)
                                }
                                className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm">
                                    {stage.stageName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Entrou em{" "}
                                    {new Date().toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </button>

                              {isExpanded && stage.fields.length > 0 && (
                                <div className="px-3 pb-3 space-y-2 bg-muted/20">
                                  {stage.fields.map((field) => (
                                    <div
                                      key={field.id}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-muted-foreground mt-0.5">
                                        {getFieldIcon(field.type)}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                          {field.label}
                                        </p>
                                        <p className="text-sm text-muted-foreground break-words">
                                          {field.value || "Não preenchido"}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Column - Fields Management & Notes */}
          <div className="flex flex-col">
            {/* Header with stage name and add button */}
            <div className="p-4 border-b flex items-center justify-between">
              {dealDetailsLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <h3 className="font-semibold text-sm">
                  {dealDetails?.currentStage?.name || "Etapa Atual"}
                </h3>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSelectTypeModal(true)}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <Plus className="h-4 w-4" />
                Novo Campo
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Fields List */}
                <div className="space-y-3">
                  {stageFieldsLoading ? (
                    // Skeleton loading state
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-6 w-6" />
                              <Skeleton className="h-6 w-6" />
                            </div>
                          </div>
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </>
                  ) : stageFields.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Nenhum campo criado ainda.
                    </p>
                  ) : (
                    stageFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        {/* Field Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {field.label}
                                {field.isRequired && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
                              </p>
                              {savingField === field.id && (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            )}
                          </div>

                          {/* Actions Menu */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 cursor-grab"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditField(field)}
                                >
                                  <Edit2 className="h-3 w-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteField(field.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Field Input */}
                        {renderFieldInput(field)}
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Comments Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      Escrever um comentário!
                    </p>
                  </div>

                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Escreva aqui..."
                    rows={3}
                    className="resize-none"
                  />

                  {newNoteContent.trim() && (
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={createNoteMutation.isPending}
                      className="w-full"
                    >
                      Adicionar Comentário
                    </Button>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 pt-2">
                    {notesLoading && (
                      <>
                        {[1, 2].map((i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-6 rounded-full" />
                              <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                            <Skeleton className="h-10 w-full ml-8" />
                          </div>
                        ))}
                      </>
                    )}

                    {!notesLoading && notes.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhum comentário ainda.
                      </p>
                    )}

                    {!notesLoading &&
                      notes.map((note) => (
                        <div key={note.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {note.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {note.user?.name || "Usuário"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(note.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm pl-8">{note.content}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Modals for field creation and editing */}
      <SelectFieldTypeModal
        open={showSelectTypeModal}
        onOpenChange={setShowSelectTypeModal}
        onSelectType={handleSelectFieldType}
      />

      <CreateFieldModal
        open={showCreateFieldModal}
        onOpenChange={setShowCreateFieldModal}
        fieldType={selectedFieldType}
        onCreateField={handleCreateField}
        isCreating={createFieldMutation.isPending}
      />

      <EditFieldModal
        open={showEditFieldModal}
        onOpenChange={setShowEditFieldModal}
        field={editingField}
        onUpdateField={handleUpdateField}
        isUpdating={updateFieldMutation.isPending}
      />
    </Dialog>
  );
};

export default DealViewModal;
